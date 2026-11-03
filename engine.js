/* Hotflip – Preismodell & Deal-Bewertung (reines JS, ohne Abhängigkeiten).
 * Läuft identisch im Browser (window.FR_ENGINE) und in den Edge Functions (globalThis.FR_ENGINE,
 * deploy.sh kopiert diese Datei nach supabase/functions/_shared/engine.js).
 *
 * Ablauf: listings (normalisiert, siehe normalize in _shared/ebay.ts)
 *   1) classify()  → Relevanzfilter (Zubehör, Defekt/Bastler, falsches Modell/Speicher, Bundle, Gesuch, verdächtig billig)
 *   2) market()    → Median + getrimmter Mittelwert je Zustand (neu / gebraucht), Perzentile, Histogramm
 *   3) evaluate()  → je Angebot: Gesamtpreis inkl. Versand, Ersparnis in € und % gegenüber dem Marktpreis, Deal-Score 0–100, Badges
 *   Bewertet wird NUR Preis (inkl. Versand) gegen Marktpreis (Median vergleichbarer Festpreis-Angebote) – keine Wiederverkaufs- oder Gewinnprognosen.
 */
(function (root) {
  "use strict";

  const DEFAULTS = {
    minDiscount: 15,       // ab so viel % unter Markt bekommt ein Angebot das Abzeichen „−X % unter Markt“
    aucDiscount: 10,       // Auktion: „Günstig bis max.“ = Marktpreis − 10 % (inkl. Versand)
  };

  // ---------- Hilfen ----------
  const round2 = (x) => Math.round(x * 100) / 100;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const norm = (s) => String(s || "").toLowerCase()
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9+]+/g, " ").replace(/\s+/g, " ").trim();
  const squash = (s) => norm(s).replace(/\s+/g, "");
  function median(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function quantile(a, q) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const p = (s.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p); return s[lo] + (s[hi] - s[lo]) * (p - lo); }
  function trimmedMean(a, t = 0.1) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const k = Math.floor(s.length * t); const r = s.slice(k, s.length - k || undefined); return r.reduce((x, y) => x + y, 0) / r.length; }

  // Produktschlüssel: gleiche Suche → gleicher Schlüssel (für Community-Verkaufspreise)
  function productKey(q) {
    return norm(q).split(" ").filter((t) => t && !["neu", "gebraucht", "ovp", "top", "zustand", "der", "die", "das", "mit", "und"].includes(t))
      .map((t) => t.replace(/^(\d+)(gb|tb)$/, "$1$2")).sort().join("-").slice(0, 80);
  }

  // Zustand → Gruppe. eBay conditionId: 1000 Neu, 1500 Neu: Sonstige, 1750 Neu mit Fehlern, 2000–2500 Generalüberholt/Refurbished,
  // 2750 Neuwertig, 3000–6000 Gebraucht, 7000 Defekt. Gruppen: neu · refurb · gebraucht · defekt
  // Als „Neu“ eingestellt, Titel verrät aber Gebrauch („81% Akku“, „3 Monate alt“, „ausgepackt“, „noch 11 Monate Garantie“) → gebraucht + Hinweis „Neu laut Verkäufer?“
  const USED_RX = /\b((?<!un|nicht |nie )benutzt|(?<!un|nicht |nie )ausgepackt|(?<!un|nicht )getragen|gebraucht|gebrauchsspuren|(?<!keine |ohne |keinerlei )kratzer|wie neu|neuwertig|kaum genutzt|wenig genutzt|ausprobiert|nur getestet|\d+ (?:tage|tag|wochen|woche|monate|monat|jahre|jahr) alt|alt \d+ (?:wochen|monate)|noch (?:ca )?\d+ (?:monate|monat|wochen|jahre|jahr) (?:apple ?care|garantie|gewaehrleistung|herstellergarantie)|austausch ?geraet|austauschgeraet|vorfuehrgeraet|vorfuehrer|retoure|aussteller|ausstellungsstueck)\b/;
  const REFURB_RX = /\b(refurbished|generalueberholt|general ueberholt|renewed|aufbereitet)\b/;
  function usedHint(t) {
    const r = String(t || "").toLowerCase(), n = norm(t);
    const m = r.match(/\b(\d{2,3}) ?% ?(?:akku|batterie|battery|bh|kapazit)/) || r.match(/(?:akku|batterie|battery|bh|kapazität)[^0-9%]{0,16}(\d{2,3}) ?%/);
    return !!((m && Number(m[1]) < 100) || USED_RX.test(n));
  }
  function condGroup(it) {
    const id = Number(it.conditionId || 0), t = norm(it.title);
    if (id === 7000) return "defekt";
    if (id >= 1000 && id < 2000) return REFURB_RX.test(t) ? "refurb" : usedHint(it.title) ? "gebraucht" : "neu";
    if (id >= 2000 && id <= 2500) return "refurb";
    if (id > 2500) return "gebraucht";
    const c = norm(it.condition);
    if (/defekt|ersatzteil/.test(c)) return "defekt";
    if (/refurb|generalueberholt/.test(c)) return "refurb";
    if (/^neu|new/.test(c)) return REFURB_RX.test(t) ? "refurb" : usedHint(it.title) ? "gebraucht" : "neu";
    return "gebraucht";
  }
  // eBay sagt „Neu“, der Titel deutet auf Gebrauch → wird als gebraucht bewertet und markiert
  const sellerSaysNew = (it) => { const id = Number(it.conditionId || 0); return ((id >= 1000 && id < 2000) || (!id && /^neu|new/.test(norm(it.condition)))) && condGroup(it) === "gebraucht"; };
  const COND_LABEL = { neu: "Neu", refurb: "Generalüberholt", gebraucht: "Gebraucht", defekt: "Defekt" };
  function condLabelOf(it) {
    const g = condGroup(it), id = Number(it.conditionId || 0);
    if (sellerSaysNew(it)) return "Gebraucht?";
    if (g === "neu" && id === 1500) return "Neu: Sonstige";
    if (g === "neu" && id === 1750) return "Neu mit Fehlern";
    return COND_LABEL[g] || g;
  }
  // Angebotsformat: echte Auktion (nur Gebote) vs. Sofort-Kaufen (Festpreis, ggf. mit Preisvorschlag)
  const isAuction = (it) => it.buyingOption === "AUCTION";
  const BUY_LABEL = { sofort: "Sofort-Kaufen", auktion: "Auktion" };
  const buyKind = (it) => (isAuction(it) ? "auktion" : "sofort");

  // ---------- 1) Relevanzfilter ----------
  const RX = {
    accessory: /\b(filterhalterung|kamerafilter|nd ?filter|objektiv(?:e|set)?|handyhalterung|kfz ?halterung|ersatzteil|ersatzteile|(?:lcd |oled )?(?:display|bildschirm|touchscreen|panel|gehaeuse|backcover|rueckschale|mainboard|platine|lautsprecher|kamera ?modul) (?:fuer|for|anzeige|panel|ersatz)|huelle|hulle|case|cover|bumper|panzerglas|schutzglas|schutzfolie|displayschutz|folie|ladekabel|kabel|netzteil|ladegeraet|adapter|halterung|staender|dock(?:ing)?|skin|aufkleber|sticker|tasche|etui|ohrpolster|polster|ersatzpolster|fernbedienung|controller|dualsense|joy ?cons?|gamepad|wandhalterung|kopfhoererhalter|lampe|abdeckung|faceplate|controller ladestation|ladestation|grip|griffe|thumbsticks?|ersatz ?akku|passend fuer|kompatibel mit|kompatibel|nur ovp|leere? ovp|ovp leer|nur karton|karton ohne|leerkarton|attrappe|dummy|anleitung|nur box|bauanleitung|minifigur(?:en)?|einzelteile|ersatzteile set)\b/,
    defect: /\b(defekt|defect|bastler|bastlerware|fuer teile|als ersatzteil|ersatzteilspender|teilespender|kaputt|gesprungen|gebrochen|riss im|display ?bruch|displayschaden|display ?riss|glas ?bruch|(?<!nicht |kaum |nie |un)beschaedigt|face ?id (?:defekt|ausgefallen|geht nicht|funktioniert nicht)|(?:kein|ohne) face ?id|wasserschaden|ohne funktion|nicht funktionsfaehig|funktioniert nicht|startet nicht|icloud ?(?:gesperrt|lock|sperre)|activation ?lock|gesperrt|blacklist|bootloop|akku defekt|drift|stick ?drift|knackt|rauscht|unvollstaendig|fehlende? teile|ohne (?:netzteil|kabel|controller))\b/,
    bundle: /\b(bundle|paket|konvolut|sammlung|lot|set mit|inkl \d+ spiele|mit \d+ spielen|plus spiele|2x|3x|zwei controller|2 controller|mit spielen)\b/,
    wanted: /\b(suche|gesucht|tausche|tausch gegen|ankauf|wir kaufen|kaufe)\b/,
    bundlePlus: /\+ ?\d+ ?(spiele|games|controller)|\+ ?spiele/,
    rental: /\b(miete|mieten|leihen|vermiete|abo)\b/,
    service: /\b(reparatur|reparaturservice|akku ?tausch|display ?tausch|displaytausch|austausch service|reparieren lassen|einsendereparatur)\b/,
  };
  const VARIANTS = ["pro", "max", "mini", "plus", "lite", "ultra", "slim", "digital", "oled", "se", "fe", "air", "edge"];
  const storages = (t) => { const out = new Set(); let m; const s = norm(t).replace(/(\d)\s+(gb|tb)\b/g, "$1$2"); const r = /\b(\d{2,4})(gb|tb)\b/g; while ((m = r.exec(s))) out.add(m[1] + m[2]); return out; };

  const ALIASES = { ps5: ["playstation5"], ps4: ["playstation4"], playstation5: ["ps5"], playstation4: ["ps4"], xm4: ["wh1000xm4"], xm5: ["wh1000xm5"] };
  function queryProfile(q) {
    const n = norm(q).replace(/(\d)\s+(gb|tb)\b/g, "$1$2"), toks = n.split(" ").filter(Boolean);
    return {
      q, n, toks,
      models: toks.filter((t) => (/\d/.test(t) && /[a-z]/.test(t) && !/^\d+(gb|tb)$/.test(t)) || /^\d{2,}$/.test(t)),
      storage: storages(q),
      variants: new Set(toks.filter((t) => VARIANTS.includes(t))),
      wantsAccessory: RX.accessory.test(n),
      wantsDefect: RX.defect.test(n),
      wantsBundle: RX.bundle.test(n),
      core: toks.filter((t) => t.length >= 3 && !/^\d+(gb|tb)$/.test(t) && !["edition", "disc", "konsole", "console", "neu", "gebraucht", "ovp", "apple", "sony"].includes(t)),
    };
  }

  // Liefert { ok, reason, flags[], uncertain }
  function classifyOne(it, P) {
    const t0 = norm(it.title);
    const t = t0 + (/\bps ?5\b/.test(t0) ? " playstation 5" : "") + (/\bps ?4\b/.test(t0) ? " playstation 4" : "");
    const ts = t.replace(/\s+/g, ""), flags = [];
    const out = (ok, reason, uncertain = false) => ({ ok, reason, flags, uncertain });
    if (it.llmReject) return out(false, "KI: " + it.llmReject);
    if (RX.wanted.test(t)) return out(false, "Gesuch / Tausch");
    if (RX.rental.test(t)) return out(false, "Miete / Abo");
    if (RX.service.test(t) && !/\b(akku|display) (?:neu |wurde )?(?:getauscht|ersetzt|erneuert)\b/.test(t)) return out(false, "Reparatur / Service");
    if (!P.wantsDefect && (condGroup(it) === "defekt" || RX.defect.test(t))) return out(false, "Defekt / Bastler");
    if (!P.wantsAccessory) {
      const m = RX.accessory.exec(t);
      if (m) {
        // Zubehör-Wort VOR dem Produkt („Hülle für iPhone 13“) = Zubehör; danach mit „inkl./mit/+“ („iPhone 13 inkl. Hülle“) = Beigabe
        const anchors = [...P.models, ...P.core].map((c) => t.indexOf(c)).concat([t0.search(/\bps ?[45]\b/)]).filter((i) => i >= 0);
        const pIdx = anchors.length ? Math.min(...anchors) : 0;
        const before = t.slice(Math.max(0, m.index - 14), m.index);
        if (m.index > pIdx && /\b(inkl|inklusive|mit|plus|und|samt)\b|\+/.test(before)) flags.push("inkl. Zubehör");
        else return out(false, "Zubehör");
      }
    }
    // Modellnummern (z. B. 13, 75192, xm4, ps5) müssen vorkommen – Leerzeichen/Bindestriche egal
    const has = (m) => ts.includes(m) || (ALIASES[m] || []).some((a) => ts.includes(a));
    for (const m of P.models) if (!has(m)) return out(false, "Anderes Modell");
    // Varianten (Pro, Mini, Lite, Digital …) die NICHT gesucht wurden
    const tv = t.split(" ").filter((x) => VARIANTS.includes(x));
    for (const v of tv) if (!P.variants.has(v)) {
      if (v === "digital" && /\bdisc\b/.test(t)) continue; // „Disc statt Digital“
      return out(false, "Anderes Modell (" + v[0].toUpperCase() + v.slice(1) + ")");
    }
    for (const v of P.variants) if (!t.split(" ").includes(v)) return out(false, "Anderes Modell (ohne " + v.toUpperCase() + ")");
    // Speichergröße
    if (P.storage.size) {
      const st = storages(it.title);
      if (st.size && ![...st].some((x) => P.storage.has(x))) return out(false, "Anderer Speicher (" + [...st][0].toUpperCase() + ")");
      if (!st.size) flags.push("Speicher unklar");
    }
    if (!P.wantsBundle && (RX.bundle.test(t) || RX.bundlePlus.test(t))) return out(false, "Bundle / Paket");
    // Kernwörter: mindestens die Hälfte muss im Titel stehen
    if (P.core.length) {
      const hit = P.core.filter((c) => t.includes(c) || ts.includes(c)).length;
      if (hit / P.core.length < 0.5) return out(false, "Passt nicht zur Suche", true);
      if (hit < P.core.length) flags.push("Titel weicht ab");
    }
    return out(true, "", flags.length > 0);
  }

  function classify(listings, q) {
    const P = queryProfile(q);
    const res = listings.map((it) => ({ ...it, rel: classifyOne(it, P) }));
    // Ausreißer nach unten: < 35 % des vorläufigen Medians → verdächtig (Zubehör, Fake, Betrug)
    const groups = {};
    for (const it of res) if (it.rel.ok && !isAuction(it)) (groups[condGroup(it)] ||= []).push(total(it));
    const med = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, median(v)]));
    for (const it of res) {
      if (!it.rel.ok || isAuction(it)) continue;
      const m = med[condGroup(it)];
      if (m && total(it) < m * 0.35) { it.rel = { ok: false, reason: "Verdächtig billig", flags: it.rel.flags, uncertain: true }; }
    }
    return res;
  }

  // ---------- 2) Marktpreis ----------
  const price = (it) => Number(it.buyingOption === "AUCTION" && it.currentBid != null ? it.currentBid : it.price) || 0;
  const total = (it) => round2(price(it) + (Number(it.shipping) || 0));

  function statsOf(values) {
    if (!values.length) return null;
    return {
      n: values.length,
      median: round2(median(values)), trimmed: round2(trimmedMean(values, 0.1)),
      p10: round2(quantile(values, 0.1)), p25: round2(quantile(values, 0.25)), p75: round2(quantile(values, 0.75)), p90: round2(quantile(values, 0.9)),
      min: round2(Math.min(...values)), max: round2(Math.max(...values)),
    };
  }

  // Marktpreis nur aus Festpreis-Angeboten: ein Zwischengebot ist kein Preis (auch nicht kurz vor Ende)
  function marketEligible(it) {
    return !!it.rel?.ok && !isAuction(it);
  }

  function market(items, now = Date.now()) {
    const by = { neu: [], refurb: [], gebraucht: [] };
    for (const it of items) if (marketEligible(it, now)) { const g = condGroup(it); if (by[g]) by[g].push(total(it)); }
    const all = [...by.neu, ...by.refurb, ...by.gebraucht];
    return { neu: statsOf(by.neu), refurb: statsOf(by.refurb), gebraucht: statsOf(by.gebraucht), alle: statsOf(all), points: points(items, now) };
  }

  // Einzelne Sofort-Kaufen-Preise je Zustand für die Preisskala (Punkt = Angebot)
  function points(items, now = Date.now()) {
    return items.filter((it) => marketEligible(it, now)).map((it) => ({ v: total(it), g: condGroup(it), id: it.itemId })).sort((a, b) => a.v - b.v);
  }

  // „Schöne“ Achsen-Ticks (3–4 Stück) zwischen lo und hi
  function niceTicks(lo, hi, want = 4) {
    if (!(hi > lo)) return [Math.round(lo)];
    const raw = (hi - lo) / (want - 1), mag = Math.pow(10, Math.floor(Math.log10(raw)));
    let step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => (hi - lo) / s <= want - 0.5) || 10 * mag;
    let t = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) t.push(Math.round(v * 100) / 100);
    if (t.length < 3) { step /= 2; t = []; for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) t.push(Math.round(v * 100) / 100); }
    while (t.length > 4) t = t.filter((_, i) => i % 2 === 0);
    return t;
  }

  // ---------- 3) Bewertung ----------
  function trustScore(it) {
    const pct = Number(it.sellerFeedbackPct ?? 0), n = Number(it.sellerFeedbackScore ?? 0);
    if (!n) return 0.45;
    return clamp(((pct - 90) / 10) * 0.6 + clamp(Math.log10(n + 1) / 3) * 0.4);
  }

  function evaluate(items, q, opt = {}, sold = [], now = Date.now()) {
    const o = { ...DEFAULTS, ...opt };
    const classified = classify(items, q);
    const mkt = market(classified, now);
    const mref = mkt.refurb || mkt.gebraucht;
    const out = classified.map((it) => {
      const g = condGroup(it), st = (g === "refurb" ? mref : mkt[g]) || mkt.alle, tot = total(it), auc = isAuction(it);
      const base = { ...it, cond: g, condLabel: condLabelOf(it), sellerNew: sellerSaysNew(it), buy: buyKind(it), auction: auc, total: tot };
      if (!it.rel.ok || !st) return { ...base, score: null, under: null, badges: [], verdict: it.rel.ok ? "Zu wenig Daten" : "Aussortiert" };
      const mid = st.median;
      const conf = clamp(st.n / 12, 0.35, 1);                          // wenige Vergleichsangebote → vorsichtiger
      const trust = trustScore(it);
      const ship = Number(it.shipping) || 0;
      const endsIn = auc && it.endDate ? Date.parse(it.endDate) - now : null;
      const lastHour = auc && endsIn != null && endsIn > 0 && endsIn <= 3600e3;
      // Score-Formel: nur Ersparnis gegenüber Marktpreis (85 %) + Verkäufer-Vertrauen (15 %), gedämpft bei dünner Datenbasis.
      // 30 % unter Markt = volle Punkte für die Ersparnis; nicht günstiger als der Markt → höchstens 30.
      // Bei Auktionen nur in der letzten Stunde (davor ist das Gebot kein Preis)
      const scoreAt = (buyTot) => {
        const u = (mid - buyTot) / mid * 100;
        let s = (0.85 * clamp(u / 30) + 0.15 * trust) * 100;
        if (u <= 0) s = Math.min(s, 30);
        s = s * (0.75 + 0.25 * conf);
        return { s, u };
      };
      const pos = st.max > st.min ? clamp((tot - st.p10) / Math.max(1, st.p90 - st.p10)) : 0.5; // Lage auf der Marktkurve
      const badges = [];
      const fmtBadges = () => {
        if (auc) badges.push({ k: "auction", t: lastHour ? "Auktion · endet bald" : "Auktion" });
        else badges.push({ k: "bin", t: "Sofort-Kaufen" });
        if (it.bestOffer) badges.push({ k: "offer", t: "Preisvorschlag" });
        if (!auc && it.auctionBin) badges.push({ k: "info", t: "+ Gebote möglich" });
        if (base.sellerNew) badges.push({ k: "warn", t: "Neu laut Verkäufer?" });
        else if (g === "neu" && Number(it.conditionId) === 1500) badges.push({ k: "info", t: "Neu: Sonstige" });
      };
      if (auc) {
        // Auktion: kein „−X %“/„spart“ auf Basis des Zwischengebots. Stattdessen: „Günstig bis max.“ = Marktpreis − aucDiscount % (inkl. Versand),
        // als Gebot ohne Versand angezeigt. Darüber liegt das Angebot nicht mehr deutlich unter dem Marktpreis.
        const guenstigTot = round2(mid * (1 - o.aucDiscount / 100));
        const guenstigBis = Math.max(0, round2(guenstigTot - ship));
        const bid = Number(it.currentBid ?? it.price) || 0;
        const room = round2(guenstigBis - bid);
        const underNow = round2((mid - tot) / mid * 100);                 // nur intern (Suchauftrag kurz vor Ende), nie angezeigt
        let score = null, under = null;
        if (lastHour) { const r = scoreAt(tot); score = Math.round(clamp(room >= 0 ? r.s : Math.min(r.s, 40), 0, 100)); }
        fmtBadges();
        for (const f of it.rel.flags) badges.push({ k: "info", t: f });
        const verdict = room < 0 ? "Gebot schon über „Günstig bis“" : lastHour ? "Auktion endet bald – mitbieten?" : "Auktion – beobachten";
        return { ...base, under, score, pos, badges, verdict, confidence: round2(conf), market: round2(mid),
          auctionOpen: !lastHour, endingSoon: lastHour, guenstigBis, guenstigTotal: guenstigTot, bid, room, endsIn, underNow };
      }
      const under = round2((mid - tot) / mid * 100);                // % unter Markt (negativ = teurer)
      let { s } = scoreAt(tot);
      const suspicious = under > 55;
      if (suspicious) s *= 0.85;                                        // zu gut, um wahr zu sein
      const score = Math.round(clamp(s, 0, 100));
      if (score >= 80) badges.push({ k: "top", t: "Top-Deal" });
      else if (score >= 65) badges.push({ k: "good", t: "Guter Deal" });
      if (under >= o.minDiscount) badges.push({ k: "under", t: `−${Math.round(under)} % unter Markt` });
      fmtBadges();
      if (trust >= 0.8) badges.push({ k: "trust", t: "Top-Verkäufer" });
      if (it.createdAt && now - Date.parse(it.createdAt) < 6 * 3600e3) badges.push({ k: "fresh", t: "Neu eingestellt" });
      if (suspicious) badges.push({ k: "warn", t: "Verdächtig günstig – genau prüfen" });
      for (const f of it.rel.flags) badges.push({ k: "info", t: f });
      const verdict = under <= 0 ? "Über Marktpreis" : score >= 80 ? "Top-Deal" : score >= 65 ? "Guter Deal" : score >= 45 ? "Fairer Preis" : "Kaum günstiger";
      return { ...base, under, save: round2(mid - tot), score, pos, badges, verdict, confidence: round2(conf), market: round2(mid), auctionOpen: false };
    });
    const ok = out.filter((x) => x.rel.ok && (x.score != null || x.auction)).sort(byDeal);
    const rejected = out.filter((x) => !x.rel.ok);
    const reasons = {};
    for (const r of rejected) reasons[r.rel.reason] = (reasons[r.rel.reason] || 0) + 1;
    return { q, key: productKey(q), market: mkt, items: ok, rejected, reasons, options: o, evaluatedAt: new Date(now).toISOString() };
  }
  // Deal-Sortierung: Sofort-Kaufen zuerst (nach Score), Auktionen danach (die bald endenden zuerst) – ein niedriges Zwischengebot rutscht nie nach oben
  const endT = (x) => (x.endDate ? Date.parse(x.endDate) : Infinity);
  function byDeal(a, b) {
    if (!!a.auction !== !!b.auction) return a.auction ? 1 : -1;
    if (a.auction) return endT(a) - endT(b);
    return (b.score ?? -1) - (a.score ?? -1) || a.total - b.total;
  }
  const byEnding = (a, b) => (!!a.auction !== !!b.auction ? (a.auction ? -1 : 1) : a.auction ? endT(a) - endT(b) : byDeal(a, b));

  // Treffer für einen Suchauftrag: Score-Grenze, Maximalpreis, Mindest-Ersparnis in %, Zustand.
  // Auktionen nur kurz vor Ende (≤ 60 Min.) und nur, wenn das Gebot unter „Günstig bis“ liegt – nie wegen eines niedrigen Zwischengebots.
  function watchHits(result, w) {
    return result.items.filter((x) => (!w.condition || w.condition === "alle" || x.cond === w.condition)
      && (!x.auction || (x.endingSoon && x.room >= 0))
      && x.score != null
      && (!w.max_price || x.total <= Number(w.max_price))
      && (w.min_discount == null || (x.auction ? x.underNow : x.under) >= Number(w.min_discount))
      && x.score >= (w.min_score ?? 60));
  }

  // DAC7 / PStTG: Plattformen melden ab 30 Verkäufen ODER 2.000 € Erlös pro Plattform und Kalenderjahr
  function dac7(sales, year = new Date().getFullYear()) {
    const per = {};
    for (const s of sales) {
      if (!s.sold_at || new Date(s.sold_at).getFullYear() !== year) continue;
      const p = s.platform_sold || "Sonstige";
      (per[p] ||= { platform: p, count: 0, revenue: 0 });
      per[p].count++; per[p].revenue = round2(per[p].revenue + Number(s.sold_price || 0));
    }
    return Object.values(per).map((x) => ({ ...x, countPct: Math.round(x.count / 30 * 100), revenuePct: Math.round(x.revenue / 2000 * 100), level: x.count >= 30 || x.revenue >= 2000 ? "over" : x.count >= 24 || x.revenue >= 1600 ? "near" : "ok" }));
  }

  const ebaySoldUrl = (q) => "https://www.ebay.de/sch/i.html?_nkw=" + encodeURIComponent(q) + "&LH_Sold=1&LH_Complete=1&_sop=13";

  // Verkaufs-Flammen: Wie viele Mitglieder haben dasselbe Produkt (gleicher Zustand) im rollierenden Fenster TEURER verkauft?
  // Wird bei jeder Abfrage neu berechnet – ältere Meldungen bleiben gespeichert und zählen weiter für Marktpreis/Verlauf, nur nicht für Flammen.
  const FLAME_WINDOW_DAYS = 30;
  const flameSince = (now = Date.now(), days = FLAME_WINDOW_DAYS) => new Date(now - days * 864e5).toISOString().slice(0, 10);
  // exclude: Nutzer-ID, deren eigene Verkäufe nicht zählen (wer einen Deal/Restock teilt, kann ihn nicht selbst „anheizen“)
  function saleFlames(price, cond, sales, { now = Date.now(), days = FLAME_WINDOW_DAYS, exclude = null } = {}) {
    const since = flameSince(now, days), users = new Set(); let n = 0;
    for (const s of sales || []) {
      if (String(s.sold_at).slice(0, 10) < since || (cond && s.condition !== cond) || !(+s.price > +price)) continue;
      if (exclude && s.user_id === exclude) continue;
      n++; users.add(s.user_id || s.id);
    }
    return { members: users.size, sales: n, days };
  }

  // Plausibilitätsprüfung für Flip-Einträge (Client, Demo und Server nutzen dieselbe Regel). Gibt Fehlertext oder null zurück.
  // recent = Verkaufsmeldungen desselben Produkts (beliebig alt – gefiltert wird hier auf 90 Tage + Zustand).
  const FLIP_MAX_AGE_DAYS = 365;
  function checkFlip(x, recent = [], now = Date.now()) {
    const price = +x.sold_price, buy = x.buy_price === "" || x.buy_price == null ? null : +x.buy_price;
    const today = new Date(now).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
    const oldest = new Date(now - FLIP_MAX_AGE_DAYS * 864e5).toISOString().slice(0, 10);
    if (!(price >= 1 && price < 100000)) return "Verkaufspreis fehlt oder ist ungültig";
    if (buy != null && !(buy >= 0 && buy < 100000)) return "Kaufpreis ist ungültig";
    const sd = String(x.sold_at || today).slice(0, 10), bd = x.bought_at ? String(x.bought_at).slice(0, 10) : null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sd)) return "Verkaufsdatum ist ungültig";
    if (sd > today) return "Verkaufsdatum liegt in der Zukunft";
    if (sd < oldest) return "Verkauf ist älter als 12 Monate – bitte nur aktuelle Verkäufe eintragen";
    if (bd && bd > sd) return "Kaufdatum liegt nach dem Verkaufsdatum";
    if (buy != null && buy >= 5 && price > buy * 20) return "Verkaufspreis ist mehr als 20× so hoch wie der Kaufpreis – bitte prüfen";
    const since = new Date(now - 90 * 864e5).toISOString().slice(0, 10);
    const ref = (recent || []).filter((s) => s.condition === (x.condition === "neu" ? "neu" : "gebraucht") && String(s.sold_at).slice(0, 10) >= since).map((s) => +s.price);
    if (ref.length >= 3) {
      const med = median(ref);
      if (price > med * 3 || price < med / 3) return `Verkaufspreis weicht stark vom Community-Median (${Math.round(med)} €) ab – bitte prüfen`;
    }
    return null;
  }

  // ---------- Bestell-Zeitleiste (Einkauf → Verkauf), Sendungsverfolgung, eBay-Bestellungen ----------
  // Stufen mit Zeitstempel (ISO). Einkauf: gekauft → bezahlt → versendet → erhalten. Verkauf: verkauft → v_bezahlt → v_versendet → v_zugestellt.
  const STEPS_BUY = [["gekauft", "Gekauft"], ["bezahlt", "Bezahlt"], ["versendet", "Versendet"], ["erhalten", "Zugestellt / erhalten"]];
  const STEPS_SELL = [["verkauft", "Verkauft"], ["v_bezahlt", "Zahlung erhalten"], ["v_versendet", "An Käufer versendet"], ["v_zugestellt", "Beim Käufer zugestellt"]];
  const STEP_KEYS = [...STEPS_BUY, ...STEPS_SELL].map((x) => x[0]);
  const CARRIERS = ["DHL", "Deutsche Post", "Hermes", "DPD", "GLS", "UPS", "Sonstige"];
  // Ein Zeitstempel ist gültig, wenn er nicht (mehr als 10 Min.) in der Zukunft und nicht vor 2000 liegt
  function stepTime(v, now = Date.now()) {
    if (v == null || v === "") return null;
    const t = Date.parse(String(v)); if (!Number.isFinite(t) || t > now + 10 * 60e3 || t < Date.UTC(2000, 0, 1)) return undefined;
    return new Date(t).toISOString();
  }
  // Zeitleiste eines Bestand-Eintrags: gekauft/verkauft fallen auf bought_at/sold_at zurück
  function timeline(it) {
    const tl = { ...(it.timeline || {}) };
    if (!tl.gekauft && it.bought_at) tl.gekauft = String(it.bought_at).slice(0, 10);
    if (!tl.verkauft && it.status === "verkauft" && it.sold_at) tl.verkauft = String(it.sold_at).slice(0, 10);
    const lastOf = (steps) => { let k = -1; steps.forEach(([s], i) => { if (tl[s]) k = i; }); return k; };
    const buy = lastOf(STEPS_BUY), sell = lastOf(STEPS_SELL);
    const stage = sell >= 0 ? STEPS_SELL[sell] : STEPS_BUY[Math.max(0, buy)];
    return { tl, buy, sell, stage: stage[0], label: stage[1] };
  }
  function normCarrier(v) {
    const s = String(v || "").toLowerCase();
    if (/deutsche ?post|warenpost|brief/.test(s)) return "Deutsche Post";
    if (/dhl/.test(s)) return "DHL";
    if (/hermes/.test(s)) return "Hermes";
    if (/dpd/.test(s)) return "DPD";
    if (/gls/.test(s)) return "GLS";
    if (/ups/.test(s)) return "UPS";
    return s ? "Sonstige" : null;
  }
  const cleanTracking = (v) => { const s = String(v || "").replace(/\s+/g, "").toUpperCase(); return /^[A-Z0-9-]{6,40}$/.test(s) ? s : null; };
  const dhlCarrier = (c) => c === "DHL" || c === "Deutsche Post";
  // Öffentliche Sendungsverfolgung des Versanddienstes (Fallback ohne API-Schlüssel)
  function trackUrl(carrier, no) {
    const n = encodeURIComponent(no || "");
    switch (carrier) {
      case "DHL": case "Deutsche Post": return `https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${n}`;
      case "Hermes": return `https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation#${n}`;
      case "DPD": return `https://tracking.dpd.de/status/de_DE/parcel/${n}`;
      case "GLS": return `https://gls-group.com/DE/de/paketverfolgung?match=${n}`;
      case "UPS": return `https://www.ups.com/track?loc=de_DE&tracknum=${n}`;
      default: return null;
    }
  }
  const TRACK_LABEL = { "pre-transit": "Angekündigt", transit: "Unterwegs", delivered: "Zugestellt", failure: "Problem bei der Zustellung", unknown: "Noch keine Daten" };
  // Sendungsstatus → fehlende Zeitleisten-Stufen ergänzen (manuell gesetzte Zeiten werden nie überschrieben)
  function trackPatch(tl, shipment) {
    const out = shipment.direction === "out", p = {};
    const sent = out ? "v_versendet" : "versendet", got = out ? "v_zugestellt" : "erhalten";
    const ev = (shipment.events || []).filter((e) => e.at).sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const firstMove = ev.find((e) => e.code === "transit" || e.code === "delivered");
    if (!tl?.[sent] && (shipment.status === "transit" || shipment.status === "delivered")) p[sent] = stepTime(firstMove?.at || shipment.status_at) || null;
    if (!tl?.[got] && shipment.status === "delivered") p[got] = stepTime(shipment.status_at || ev[ev.length - 1]?.at) || null;
    for (const k of Object.keys(p)) if (!p[k]) delete p[k];
    return p;
  }
  // Normalisierte eBay-Bestellung (Trading API GetOrders, siehe _shared/ebayuser.ts) → Bestand-Felder + Zeitleiste + Sendung
  function ebayOrderPatch(o) {
    const buyer = o.role === "buyer", d = (v) => stepTime(v) || null;
    const tl = buyer ? { gekauft: d(o.created), bezahlt: d(o.paid), versendet: d(o.shipped), erhalten: d(o.delivered) } : { verkauft: d(o.created), v_bezahlt: d(o.paid), v_versendet: d(o.shipped), v_zugestellt: d(o.delivered) };
    for (const k of Object.keys(tl)) if (!tl[k]) delete tl[k];
    const tr = (o.tracking || []).map((t) => ({ carrier: normCarrier(t.carrier), no: cleanTracking(t.number) })).find((t) => t.no);
    const date = (v) => (v ? new Date(Date.parse(v)).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }) : null);
    const total = Math.round((+o.total || 0) * 100) / 100;
    return {
      ext_ref: `ebay:${buyer ? "buyer" : "seller"}:${o.orderId}`, item_id: o.itemId || null, title: String(o.title || "eBay-Bestellung").slice(0, 200), timeline: tl,
      fields: buyer ? { buy_price: total, platform_bought: "eBay", bought_at: date(o.created) } : { status: "verkauft", sold_price: total, platform_sold: "eBay", sold_at: date(o.created) },
      shipment: tr ? { direction: buyer ? "in" : "out", carrier: tr.carrier || "Sonstige", tracking_no: tr.no } : null,
    };
  }

  // ---------- KI-Kontingent (DEMO – keine echte KI, keine echte Zahlung) ----------
  // Gleiche Rechnung im Demo-Backend und in der Edge Function fr-ai. Preise sind SIMULIERT (Cent je 1.000 Tokens).
  const AI = {
    DEMO: true,
    PLAN: { id: "pro_demo", name: "Hotflip Pro", price_eur: 9.99, budget_ct: 300, pack_ct: 300, max_budget_ct: 1500 },
    PRICE: { in_ct_per_1k: 0.25, out_ct_per_1k: 1.0, model: "demo-sim-1" },
    MAX_IN: 4000, MAX_OUT: 1000,          // Obergrenze je Analyse → so viel wird vorher reserviert
    PER_MIN: 10, PER_DAY: 200,            // Tempolimit je Nutzer
  };
  const r3 = (v) => Math.round(v * 1000) / 1000;
  AI.cost = (tin, tout) => r3((tin / 1000) * AI.PRICE.in_ct_per_1k + (tout / 1000) * AI.PRICE.out_ct_per_1k);
  AI.maxCost = () => AI.cost(AI.MAX_IN, AI.MAX_OUT);
  AI.typicalCost = () => AI.cost(2400, 600);
  AI.nextRefill = (from) => { const d = new Date(from); d.setMonth(d.getMonth() + 1); return d.toISOString(); };
  // Wallet-Sicht für die Anzeige: Rest, ca. Analysen, Prozent
  AI.view = (w) => {
    if (!w || !w.plan || w.plan === "none") return { active: false, rest_ct: 0, pct: 0, approx: 0, empty: true };
    const rest = Math.max(0, r3(+w.budget_ct - +w.used_ct - (+w.reserved_ct || 0)));
    return { active: true, rest_ct: rest, budget_ct: +w.budget_ct, used_ct: +w.used_ct, pct: +w.budget_ct ? Math.max(0, Math.min(100, (rest / +w.budget_ct) * 100)) : 0,
      approx: Math.floor(rest / AI.typicalCost()), empty: rest < AI.maxCost(), next_refill_at: w.next_refill_at };
  };
  // Simulierte Analyse: deterministisch aus den Angebotsdaten, plus simulierte Token-Zahlen
  AI.simulate = (d) => {
    const title = String(d.title || "").slice(0, 200), q = String(d.query || title).slice(0, 120), flags = (d.flags || []).map(String).slice(0, 8);
    let h = 0; for (const c of title + q) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const tin = Math.min(AI.MAX_IN, 1900 + title.length * 6 + flags.length * 40 + (h % 500));
    const tout = Math.min(AI.MAX_OUT, 420 + (h % 260));
    const n = norm(title), risks = [];
    if (/defekt|bastler|kaputt|riss|gesprungen/.test(n)) risks.push("Hinweis auf Defekt im Titel");
    if (/ohne (ladekabel|kabel|netzteil|controller|ovp)/.test(n)) risks.push("Zubehör fehlt laut Titel");
    if (/icloud|gesperrt|sim ?lock|simlock/.test(n)) risks.push("Mögliche Sperre (iCloud/SIM)");
    for (const f of flags) risks.push(f);
    const total = +d.total || 0, market = +d.market || 0, under = d.under == null ? null : +d.under;
    const verdict = risks.length >= 2 ? "Vorsicht" : under != null && under >= 15 ? "Zugreifen" : under != null && under > 0 ? "Prüfen" : "Eher nicht";
    return {
      tokens_in: tin, tokens_out: tout,
      result: {
        demo: true, verdict,
        product: `Erkannt (simuliert): ${q}${d.cond ? " · " + (COND_LABEL[d.cond] || d.cond) : ""}`,
        risks: risks.length ? [...new Set(risks)] : ["Keine Auffälligkeiten im Titel gefunden"],
        price: market > 0 ? `${Math.round(total)} € inkl. Versand bei ca. ${Math.round(market)} € Marktpreis${under != null ? ` – ${under >= 0 ? Math.round(under) + " % darunter" : Math.round(-under) + " % darüber"}` : ""}.` : `${Math.round(total)} € inkl. Versand.`,
        note: "Demo-Antwort – keine echte KI. Text und Token-Zahlen sind simuliert.",
      },
    };
  };

  const E = { AI, niceTicks, STEPS_BUY, STEPS_SELL, STEP_KEYS, CARRIERS, stepTime, timeline, normCarrier, cleanTracking, dhlCarrier, trackUrl, TRACK_LABEL, trackPatch, ebayOrderPatch, FLAME_WINDOW_DAYS, flameSince, saleFlames, checkFlip, FLIP_MAX_AGE_DAYS, DEFAULTS, norm, productKey, condGroup, COND_LABEL, condLabelOf, usedHint, sellerSaysNew, isAuction, buyKind, BUY_LABEL, byDeal, byEnding, classify, market, evaluate, watchHits, dac7, ebaySoldUrl, total, median, trimmedMean, quantile, queryProfile, classifyOne };
  root.FR_ENGINE = E;
  if (typeof module !== "undefined" && module.exports) module.exports = E;
})(typeof globalThis !== "undefined" ? globalThis : this);
