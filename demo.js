/* Hotflip – Demo-Backend (localStorage). Gleiche Schnittstelle wie das Live-Backend in app.js.
 * Alle Daten sind „Beispieldaten“: 4 Produkte, Community-Stimmen, Kommentare, Verkaufsmeldungen, Bestand. */
(function () {
  "use strict";
  const KEY = "fr_demo_v1";
  const E = window.FR_ENGINE, M = window.FR_MOCK;
  const H = 3600e3, D = 864e5;
  const uid = () => "x" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const iso = (t) => new Date(t).toISOString();
  const day = (t) => new Date(t).toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });

  function findProduct(q) {
    const n = E.norm(q).replace(/\s+/g, "");
    const map = [["iphone13", /iphone ?13|iphone/], ["ps5", /ps5|playstation ?5|playstation/], ["switcholed", /switch/], ["xm4", /xm4|wh ?1000|sony ?wh|kopfhoerer/]];
    for (const [id, rx] of map) if (rx.test(n) || rx.test(E.norm(q))) return M.PRODUCTS.find((p) => p.id === id);
    return null;
  }

  function seed() {
    const now = Date.now(), r = M.rng(4242);
    const users = M.USERS.map(([u, n]) => ({ id: "u-" + u, username: u, display_name: n }));
    const sold = [];
    for (const p of M.PRODUCTS) for (const [price, cond, platform, ago] of M.SOLD[p.id])
      sold.push({ id: uid(), product_key: E.productKey(p.q), title: p.q, condition: cond, platform, price, sold_at: day(now - ago * D), user_id: users[Math.floor(r() * users.length)].id, created_at: iso(now - ago * D) });
    // geteilte Deals = die besten Angebote je Produkt
    const deals = [], votes = [], comments = [];
    const plan = [["iphone13", 0, 3, 14, 2], ["ps5", 0, 7, 11, 1], ["switcholed", 0, 18, 9, 3], ["xm4", 0, 26, 6, 1], ["ps5", 1, 30, 4, 4], ["iphone13", 1, 44, 3, 6]];
    let ci = 0;
    for (const [pid, idx, hAgo, hot, cold] of plan) {
      const p = M.PRODUCTS.find((x) => x.id === pid);
      const res = E.evaluate(M.listingsFor(p, now), p.q, {}, sold.filter((s) => s.product_key === E.productKey(p.q)), now);
      const it = res.items.filter((x) => !x.auctionOpen)[idx];
      if (!it) continue;
      const by = users[(deals.length * 3) % users.length];
      const d = { id: "d-" + (deals.length + 1), item_id: it.itemId, product_key: res.key, query: p.q, title: it.title, image: it.image, url: it.url, condition: it.cond,
        total: it.total, market: res.market[it.cond]?.median ?? null, score: it.score, under_pct: it.under, ends_at: it.endDate,
        status: "aktiv", shared_by: by.id, note: ["Akku laut Foto 88 %, Preisvorschlag lohnt sich.", "Abholung Raum Hamburg möglich.", null, "Kaum getragen laut Beschreibung.", null, null][deals.length], created_at: iso(now - hAgo * H) };
      deals.push(d);
      const pool = users.filter((u) => u.id !== by.id);
      for (let i = 0; i < hot + cold; i++) votes.push({ deal_id: d.id, user_id: i < pool.length ? pool[i].id : "u-anon" + i, v: i < hot ? 1 : -1 });
      const nC = [2, 3, 1, 2, 0, 1][deals.length - 1];
      for (let i = 0; i < nC; i++) comments.push({ id: uid(), deal_id: d.id, user_id: pool[(i + deals.length) % pool.length].id, body: M.COMMENTS[ci++ % M.COMMENTS.length], created_at: iso(now - (hAgo - 1 - i * 0.7) * H) });
    }
    // Bestand: so viele eBay-Verkäufe, dass die DAC7-Warnung („nah dran“) sichtbar wird
    const y = new Date(now).getFullYear(), inv = [];
    const goods = [["Sony WH-1000XM4 Schwarz", 96, 128, "eBay"], ["LEGO Technic 42115 Lamborghini", 210, 289, "eBay"], ["AirPods Pro (2. Gen.)", 112, 149, "eBay"], ["Nintendo Switch Lite Koralle", 95, 129, "Kleinanzeigen"], ["Kindle Paperwhite 11. Gen", 58, 84, "eBay"], ["Apple Watch SE 40 mm", 89, 125, "eBay"], ["iPad 9. Gen 64 GB", 165, 219, "eBay"], ["GoPro Hero 9", 120, 158, "Kleinanzeigen"], ["Bose QC45", 115, 152, "eBay"], ["Mario Kart 8 Deluxe", 28, 38, "Vinted"], ["Zelda TOTK", 32, 42, "Vinted"], ["DJI Mini 2", 190, 248, "eBay"]];
    for (let i = 0; i < 26; i++) {
      const g = goods[i % goods.length], soldAt = new Date(y, Math.floor(i * 10 / 26), 3 + Math.floor(r() * 24)).getTime();
      const platform = i % 7 === 3 ? "Kleinanzeigen" : i % 9 === 5 ? "Vinted" : "eBay";
      const sp = Math.round(g[2] * (0.92 + r() * 0.16)), bp = Math.round(g[1] * (0.95 + r() * 0.1));
      inv.push({ id: uid(), title: g[0], product_key: E.productKey(g[0]), condition: "gebraucht", platform_bought: r() < 0.6 ? "eBay" : "Kleinanzeigen", buy_price: bp, buy_costs: r() < 0.5 ? 0 : 4.99,
        bought_at: day(soldAt - (5 + r() * 20) * D), status: "verkauft", list_price: sp, platform_sold: platform, sold_price: sp, sold_fees: platform === "eBay" ? 0 : 0, sold_shipping: 5.49, sold_at: day(soldAt), item_ref: null, note: null, created_at: iso(soldAt) });
    }
    inv.push({ id: uid(), title: "PlayStation 5 Disc Edition", product_key: E.productKey("PlayStation 5 Disc Edition"), condition: "gebraucht", platform_bought: "eBay", buy_price: 249, buy_costs: 0, bought_at: day(now - 4 * D), status: "inseriert", list_price: 329, platform_sold: null, sold_price: null, sold_fees: 0, sold_shipping: 0, sold_at: null, item_ref: null, note: "Inseriert auf eBay + Kleinanzeigen", created_at: iso(now - 4 * D) });
    inv.push({ id: uid(), title: "iPhone 13 128 GB Blau", product_key: E.productKey("iPhone 13 128 GB"), condition: "gebraucht", platform_bought: "Kleinanzeigen", buy_price: 230, buy_costs: 0, bought_at: day(now - 2 * D), status: "lager", list_price: null, platform_sold: null, sold_price: null, sold_fees: 0, sold_shipping: 0, sold_at: null, item_ref: null, note: "Akku 88 %, Display neu", created_at: iso(now - 2 * D) });
    inv.push({ id: uid(), title: "Sony WH-1000XM4 Silber", product_key: E.productKey("Sony WH-1000XM4"), condition: "gebraucht", platform_bought: "eBay", buy_price: 79, buy_costs: 4.99, bought_at: day(now - 1 * D), status: "lager", list_price: null, platform_sold: null, sold_price: null, sold_fees: 0, sold_shipping: 0, sold_at: null, item_ref: null, note: null, created_at: iso(now - 1 * D) });
    // Bestell-Zeitleiste + Sendungen (Demo)
    const [ps5, iph, sony] = inv.slice(-3);
    ps5.timeline = { gekauft: iso(now - 4 * D), bezahlt: iso(now - 4 * D + 2 * H), versendet: iso(now - 3 * D), erhalten: iso(now - 2 * D + 3 * H) };
    iph.timeline = { gekauft: iso(now - 2 * D), bezahlt: iso(now - 2 * D + H) , versendet: iso(now - 1 * D) };
    sony.timeline = { gekauft: iso(now - 1 * D), bezahlt: iso(now - 1 * D + 0.5 * H) };
    const ships = [{ id: uid(), inventory_id: iph.id, direction: "in", carrier: "DHL", tracking_no: "00340434161700000123", created_at: iso(now - 1 * D), source: "manual" }];
    const watches = [
      { id: "w-1", query: "iPhone 13 128 GB", condition: "gebraucht", max_price: 280, min_discount: 15, min_score: 60, active: true, last_checked_at: iso(now - 12 * 60e3), last_error: null, created_at: iso(now - 6 * D) },
      { id: "w-2", query: "Nintendo Switch OLED", condition: "gebraucht", max_price: null, min_discount: 20, min_score: 70, active: true, last_checked_at: iso(now - 12 * 60e3), last_error: null, created_at: iso(now - 3 * D) },
    ];
    // Restocks & Wissensecke
    const restocks = [], rvotes = [], posts = [], pvotes = [];
    M.RESTOCKS.forEach(([title, retailer, url, niche, price, regular, resale, startH, endH, status, note, image], i) => {
      const id = "r-" + (i + 1), by = users[(i * 2 + 1) % users.length];
      const rsp = M.RESTOCK_SOLD.find((x) => x[0] === i);
      restocks.push({ id, product_key: rsp ? E.productKey(rsp[1]) : E.productKey(title), title, retailer, url, niche, price, regular_price: regular, resale_estimate: resale, starts_at: iso(now + startH * H), expires_at: iso(now + endH * H), status, note, image, posted_by: by.id, created_at: iso(now - (Math.max(1, -startH) + i) * H) });
      const hot = [16, 11, 9, 7, 2, 13, 6][i], cold = [1, 3, 0, 1, 5, 1, 2][i];
      for (let k = 0; k < hot + cold; k++) rvotes.push({ id, user_id: "u-x" + k, v: k < hot ? 1 : -1 });
      if (rsp) rsp[2].forEach(([p, ago], k) => sold.push({ id: uid(), product_key: E.productKey(rsp[1]), title: rsp[1], condition: "neu", platform: k % 2 ? "Kleinanzeigen" : "eBay", price: p, sold_at: day(now - ago * D), user_id: users[(i * 2 + 2 + k) % users.length].id, created_at: iso(now - ago * D) }));
      if (i < 3) comments.push({ id: uid(), restock_id: id, user_id: users[(i + 3) % users.length].id, body: ["Gerade 2 Stück bekommen, danke!", "Bei mir zeigt der Shop schon 'bald verfügbar'.", "Insiders-Punkte nicht vergessen 👍"][i], created_at: iso(now - (i + 0.5) * H) });
    });
    M.POSTS.forEach(([niche, kind, title, body, trend, metrics, hAgo, replies], i) => {
      const id = "p-" + (i + 1), by = users[(i * 3 + 2) % users.length];
      posts.push({ id, niche, kind, title, body, trend, metrics, posted_by: by.id, created_at: iso(now - hAgo * H) });
      const up = [14, 21, 8, 6, 12, 25, 18, 9, 4, 5][i];
      for (let k = 0; k < up; k++) pvotes.push({ id, user_id: "u-y" + k, v: k === up - 1 && i % 3 === 0 ? -1 : 1 });
      replies.forEach((b, k) => comments.push({ id: uid(), post_id: id, user_id: users[(i + k + 1) % users.length].id, body: b, created_at: iso(now - (hAgo - 1 - k) * H) }));
    });
    const st = { v: 5, ships, ebayLink: null, restocks, rvotes, posts, pvotes, me: { id: "me", username: "demo", display_name: "Du" }, settings: {}, users, sold, deals, votes, comments, inventory: inv, watches, hits: [], recent: [] };
    for (const w of watches) runWatch(st, w, now);
    st.hits.forEach((h, i) => { h.seen = i > 1; });
    return st;
  }

  function runWatch(st, w, now = Date.now()) {
    const p = findProduct(w.query);
    w.last_checked_at = iso(now); w.last_error = null;
    if (!p) { w.last_error = "Im Demo-Modus nur für die 4 Beispielprodukte"; return { found: 0, added: 0 }; }
    const res = E.evaluate(M.listingsFor(p, now), w.query, st.settings, st.sold.filter((s) => s.product_key === E.productKey(p.q)), now);
    let added = 0; const hits = E.watchHits(res, w).slice(0, 20);
    for (const x of hits) if (!st.hits.some((h) => h.watch_id === w.id && h.item_id === x.itemId)) {
      st.hits.unshift({ id: uid(), watch_id: w.id, item_id: x.itemId, query: w.query, title: x.title, image: x.image, url: x.url, total: x.total, under_pct: x.auction ? x.underNow : x.under, score: x.score, seen: false, created_at: iso(now - added * 9 * 60e3) });
      added++;
    }
    return { found: hits.length, added };
  }

  // Simulierter Sendungsstatus (nur Demo, klar gekennzeichnet): je nach Alter angekündigt → unterwegs → zugestellt
  function simTrack(sh, now = Date.now()) {
    const t0 = Date.parse(sh.created_at), h = (now - t0) / H, at = (x) => iso(t0 + x * H);
    const ev = [{ at: at(0.2), code: "pre-transit", text: "Die Sendung wurde elektronisch angekündigt.", place: null }];
    if (h >= 1) ev.push({ at: at(1), code: "transit", text: "Die Sendung wurde im Start-Paketzentrum bearbeitet.", place: "Leipzig" });
    if (h >= 20) ev.push({ at: at(20), code: "transit", text: "Die Sendung wurde in das Zustellfahrzeug geladen.", place: "Berlin" });
    if (h >= 26) ev.push({ at: at(26), code: "delivered", text: "Die Sendung wurde erfolgreich zugestellt.", place: "Berlin" });
    const last = ev[ev.length - 1];
    return { status: last.code, status_text: last.text, status_at: last.at, eta: h < 26 ? at(26) : null, events: ev.reverse(), checked_at: iso(now), delivered_at: last.code === "delivered" ? last.at : null, simulated: true };
  }

  window.FR_DEMO_BACKEND = function () {
    let st;
    try { st = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { st = null; }
    if (!st || st.v !== 5) st = seed();
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* voll */ } };
    save();
    const name = (id) => (id === st.me.id ? st.me.display_name : st.users.find((u) => u.id === id)?.display_name ?? "Ehemaliges Mitglied");
    const feedRow = (d) => {
      const vs = st.votes.filter((v) => v.deal_id === d.id);
      const hot = vs.filter((v) => v.v > 0).length, cold = vs.length - hot;
      const hours = (Date.now() - Date.parse(d.created_at)) / H;
      const temp = hot - cold;
      return { ...d, temp, hot, cold, comments: st.comments.filter((c) => c.deal_id === d.id).length, shared_by_name: name(d.shared_by),
        rank: (temp * 10 + (d.score || 0) / 4) / Math.pow(hours + 2, 0.8), my_vote: vs.find((v) => v.user_id === st.me.id)?.v ?? 0 };
    };
    const vt = (arr, id) => { const vs = arr.filter((v) => v.id === id); const hot = vs.filter((v) => v.v > 0).length; return { hot, cold: vs.length - hot, temp: hot - (vs.length - hot), my_vote: vs.find((v) => v.user_id === st.me.id)?.v ?? 0 }; };
    const rRow = (r) => { const t = vt(st.rvotes, r.id), hours = (Date.now() - Date.parse(r.created_at)) / H;
      return { ...r, ...t, mine: r.posted_by === st.me.id, comments: st.comments.filter((c) => c.restock_id === r.id).length, posted_by_name: name(r.posted_by), expired: r.status !== "aktiv" || (r.expires_at && Date.parse(r.expires_at) < Date.now()), rank: (t.temp * 10 + 5) / Math.pow(hours + 2, 0.8) }; };
    const pRow = (x) => { const cs = st.comments.filter((c) => c.post_id === x.id); return { ...x, ...vt(st.pvotes, x.id), mine: x.posted_by === st.me.id, comments: cs.length, last_at: cs.map((c) => c.created_at).sort().pop() || null, posted_by_name: name(x.posted_by) }; };
    const cmts = (key, id) => st.comments.filter((c) => c[key] === id).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((c) => ({ ...c, author: name(c.user_id), mine: c.user_id === st.me.id }));
    return {
      mode: "demo",
      async restocks() { return st.restocks.map(rRow); },
      async restock(id) { const r = st.restocks.find((x) => x.id === id); return r ? { ...rRow(r), commentList: cmts("restock_id", id) } : null; },
      async restockSave(x) { const id = "r-" + uid(); st.restocks.unshift({ ...x, product_key: E.productKey(x.product || x.title), id, status: "aktiv", posted_by: st.me.id, image: null, created_at: iso(Date.now()) }); save(); return { id }; },
      async restockDelete(id) { st.restocks = st.restocks.filter((x) => !(x.id === id && x.posted_by === st.me.id)); save(); return { ok: true }; },
      async report(kind, id, reason, note) { (st.reports ||= []).push({ kind, id, reason, note, at: iso(Date.now()) }); save(); return { ok: true }; },
      async restockStatus(id, status) { const r = st.restocks.find((x) => x.id === id); if (r) r.status = status; save(); return { ok: true }; },
      async posts() { return st.posts.map(pRow); },
      async post(id) { const x = st.posts.find((p) => p.id === id); return x ? { ...pRow(x), commentList: cmts("post_id", id) } : null; },
      async postSave(x) { const id = "p-" + uid(); st.posts.unshift({ ...x, id, posted_by: st.me.id, created_at: iso(Date.now()) }); save(); return { id }; },
      async postDelete(id) { st.posts = st.posts.filter((p) => !(p.id === id && p.posted_by === st.me.id)); save(); return { ok: true }; },
      async session() { return st.me; },
      async me() { return { profile: st.me, settings: st.settings, ebay: false, features: { ebayConnect: true, dhl: true, ai: true, demo: true } }; },
      async logout() { },
      async reset() { localStorage.removeItem(KEY); st = seed(); save(); },
      async search(q, cond = "alle", buying = "alle") {
        // Beispiel-Preisverlauf (wie fr-search: alle Sofort-Kaufen-Preise der letzten 30 Tage je Zustand) – erfunden wie die übrigen Beispieldaten
        const demoHist = (items, pq) => {
          const by = {};
          for (const x of E.evaluate(items, pq).items) if (!x.auction) for (const f of [1, 1.06, 0.97, 1.12]) (by[x.cond] ||= []).push(Math.round(x.total * f * 100) / 100);
          for (const k in by) by[k].sort((a, b) => a - b);
          return { since: iso(Date.now() - 30 * 864e5), by };
        };
        await wait(650);
        const p = findProduct(q);
        if (!p) return { items: [], total: 0, demo: true, unknown: true, fetched_at: iso(Date.now()) };
        // wie fr-search: serverseitiger Filter über eBay-conditionIds / buyingOptions
        const IDS = { neu: [1000, 1500, 1750], refurb: [2000, 2010, 2020, 2030, 2500], gebraucht: [2750, 3000, 4000, 5000, 6000] };
        const items = M.listingsFor(p).filter((x) => (!IDS[cond] || IDS[cond].includes(x.conditionId)) && (buying === "alle" || (buying === "auktion") === (x.buyingOption === "AUCTION")));
        return { items, total: 0, demo: true, product: p.q, fetched_at: iso(Date.now()), cached: false, llm: {}, condition: cond, buying, ...(cond === "alle" && buying === "alle" ? { hist: demoHist(items, p.q) } : {}) };
      },
      async soldFor(key) { return st.sold.filter((s) => s.product_key === key).map((s) => ({ ...s, user_name: name(s.user_id) })).sort((a, b) => b.sold_at.localeCompare(a.sold_at)); },
      async recentSales(keys) { const since = E.flameSince(); return st.sold.filter((x) => keys.includes(x.product_key) && x.sold_at >= since); },
      async soldRecent() { return st.sold.map((s) => ({ ...s, user_name: name(s.user_id) })).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 120); },
      async feed() { return st.deals.map(feedRow); },
      async deal(id) {
        const d = st.deals.find((x) => x.id === id); if (!d) return null;
        return { ...feedRow(d), commentList: st.comments.filter((c) => c.deal_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((c) => ({ ...c, author: name(c.user_id), mine: c.user_id === st.me.id })) };
      },
      async dealByItem(itemId) { return st.deals.find((d) => d.item_id === itemId)?.id ?? null; },
      async shareDeal(d) {
        const ex = st.deals.find((x) => x.item_id === d.itemId); if (ex) return { id: ex.id, existed: true };
        const id = "d-" + uid();
        st.deals.unshift({ id, item_id: d.itemId, product_key: E.productKey(d.query), query: d.query, title: d.title, image: d.image, url: d.url, condition: d.cond, total: d.total, market: d.market, score: d.score, under_pct: d.under, ends_at: d.endDate, status: "aktiv", shared_by: st.me.id, note: d.note || null, created_at: iso(Date.now()) });
        save(); return { id };
      },
      async vote(kind, id, v) { // nur „hilfreich“ bei Beiträgen – Flammen kommen aus Verkäufen
        if (kind !== "post") throw new Error("Heiß/kalt gibt es nicht mehr – Flammen entstehen aus echten Verkäufen der Mitglieder");
        st.pvotes = st.pvotes.filter((x) => !(x.id === id && x.user_id === st.me.id)); if (v === 1) st.pvotes.push({ id, user_id: st.me.id, v: 1 });
        save(); return { ok: true };
      },
      async comment(target, body) { st.comments.push({ id: uid(), ...target, user_id: st.me.id, body: String(body).slice(0, 600), created_at: iso(Date.now()) }); save(); return { ok: true }; },
      async commentDelete(id) { st.comments = st.comments.filter((c) => !(c.id === id && c.user_id === st.me.id)); save(); return { ok: true }; },
      async soldReport(r) {
        st.sold.unshift({ id: uid(), product_key: E.productKey(r.query), title: r.title || r.query, condition: r.condition === "neu" ? "neu" : "gebraucht", platform: r.platform, price: Number(r.price), sold_at: r.sold_at || day(Date.now()), user_id: st.me.id, deal_id: r.deal_id || null, created_at: iso(Date.now()) });
        save(); return { ok: true };
      },
      async soldDelete(id) { st.sold = st.sold.filter((s) => !(s.id === id && s.user_id === st.me.id)); save(); return { ok: true }; },
      async watches() { return st.watches.map((w) => ({ ...w, hits: st.hits.filter((h) => h.watch_id === w.id).length, fresh: st.hits.filter((h) => h.watch_id === w.id && !h.seen).length })); },
      async watchSave(w) {
        if (w.id) Object.assign(st.watches.find((x) => x.id === w.id) || {}, w);
        else { const nw = { ...w, id: "w-" + uid(), active: true, last_checked_at: null, last_error: null, created_at: iso(Date.now()) }; st.watches.push(nw); runWatch(st, nw); }
        save(); return { ok: true };
      },
      async watchDelete(id) { st.watches = st.watches.filter((w) => w.id !== id); st.hits = st.hits.filter((h) => h.watch_id !== id); save(); return { ok: true }; },
      async watchRun(id) { await wait(500); const w = st.watches.find((x) => x.id === id); const r = w ? runWatch(st, w) : { found: 0, added: 0 }; save(); return r; },
      async hits() { return st.hits.map((h) => ({ ...h, query: h.query || st.watches.find((w) => w.id === h.watch_id)?.query })).slice(0, 60); },
      async hitsSeen() { st.hits.forEach((h) => (h.seen = true)); save(); return { ok: true }; },
      async inventory() { return [...st.inventory].map((x) => ({ ...x, timeline: x.timeline || {}, ship: Object.fromEntries(st.ships.filter((s) => s.inventory_id === x.id).map((s) => [s.direction, s])), shared: st.sold.some((s) => s.inventory_id === x.id) })).sort((a, b) => (b.sold_at || b.bought_at).localeCompare(a.sold_at || a.bought_at)); },
      async invSave(it) {
        const row = { ...it, buy_price: Number(it.buy_price) || 0, buy_costs: Number(it.buy_costs) || 0, sold_price: it.status === "verkauft" ? Number(it.sold_price) || 0 : null, sold_fees: Number(it.sold_fees) || 0, sold_shipping: Number(it.sold_shipping) || 0,
          sold_at: it.status === "verkauft" ? it.sold_at || day(Date.now()) : null, platform_sold: it.status === "verkauft" ? it.platform_sold || "eBay" : null, bought_at: it.bought_at || day(Date.now()) };
        // wie der Server: verkauft + geteilt → Verkaufsmeldung (Flammen/Preismodell), sonst Meldung entfernen. Gleiche Plausibilität + Tageslimit.
        const share = row.status === "verkauft" && it.share !== false, key = E.productKey(it.query || row.title);
        const prev = it.id ? st.sold.find((s) => s.inventory_id === it.id) : null;
        if (share) {
          const err = E.checkFlip(row, st.sold.filter((s) => s.product_key === key && s.id !== prev?.id)); if (err) throw new Error(err);
          if (!prev && st.sold.filter((s) => s.user_id === st.me.id && Date.now() - Date.parse(s.created_at) < D).length >= 20) throw new Error("Zu viele Einträge heute – bitte morgen weiter");
        }
        const iid = it.id || uid();
        if (it.id) Object.assign(st.inventory.find((x) => x.id === it.id) || {}, row, { product_key: key });
        else st.inventory.unshift({ ...row, product_key: key, id: iid, created_at: iso(Date.now()) });
        st.sold = st.sold.filter((s) => s.inventory_id !== iid);
        if (share) st.sold.unshift({ id: prev?.id || uid(), inventory_id: iid, product_key: key, title: row.title, condition: row.condition === "neu" ? "neu" : "gebraucht", platform: row.platform_sold, price: Number(row.sold_price), sold_at: row.sold_at, user_id: st.me.id, created_at: prev?.created_at || iso(Date.now()) });
        save(); return { id: iid, shared: share };
      },
      async invStep(id, step, at) {
        const it = st.inventory.find((x) => x.id === id); if (!it || !E.STEP_KEYS.includes(step)) throw new Error("Eintrag nicht gefunden");
        const t = at == null || at === "" ? null : E.stepTime(at); if (t === undefined) throw new Error("Zeitpunkt ist ungültig oder liegt in der Zukunft");
        it.timeline = { ...(it.timeline || {}) }; if (t) it.timeline[step] = t; else delete it.timeline[step];
        save(); return { timeline: it.timeline };
      },
      async shipSave(inventory_id, direction, carrier, tracking_no) {
        st.ships = st.ships.filter((s) => !(s.inventory_id === inventory_id && s.direction === direction));
        if (!String(tracking_no || "").trim()) { save(); return { removed: true }; }
        const no = E.cleanTracking(tracking_no); if (!no) throw new Error("Sendungsnummer: 6–40 Zeichen, nur Buchstaben, Ziffern und Bindestrich");
        st.ships.push({ id: uid(), inventory_id, direction, carrier: E.CARRIERS.includes(carrier) ? carrier : "Sonstige", tracking_no: no, created_at: iso(Date.now()), source: "manual" }); save(); return { ok: true };
      },
      async trackRefresh(inventory_id) {
        await wait(400);
        const it = st.inventory.find((x) => x.id === inventory_id);
        for (const sh of st.ships.filter((s) => s.inventory_id === inventory_id && E.dhlCarrier(s.carrier))) {
          Object.assign(sh, simTrack(sh));
          if (it) it.timeline = { ...(it.timeline || {}), ...E.trackPatch(it.timeline || {}, sh) };
        }
        save(); return { dhl: true, simulated: true };
      },
      async ebayStatus() { return { enabled: true, demo: true, connected: !!st.ebayLink, link: st.ebayLink }; },
      async ebayConnect() { await wait(500); st.ebayLink = { ebay_user: "demo_flipper", connected_at: iso(Date.now()), last_sync_at: null, last_error: null }; save(); return { demo: true }; },
      async ebaySync() {
        await wait(700); if (!st.ebayLink) throw new Error("eBay ist nicht verbunden");
        const now = Date.now(), orders = [
          { role: "buyer", orderId: "DEMO-11-12345-67890", itemId: "DEMO1", title: "Nintendo Switch OLED Weiß (Demo-eBay-Kauf)", created: iso(now - 3 * D), paid: iso(now - 3 * D + 0.2 * H), shipped: iso(now - 2 * D), delivered: null, total: 219, tracking: [{ carrier: "DHL", number: "00340434161700000456" }] },
          { role: "seller", orderId: "DEMO-22-54321-09876", itemId: "DEMO2", title: "Apple AirPods Pro 2 (Demo-eBay-Verkauf)", created: iso(now - 5 * D), paid: iso(now - 5 * D + H), shipped: iso(now - 4 * D), delivered: iso(now - 2 * D), total: 169, tracking: [{ carrier: "Hermes", number: "H1002345678901" }] },
        ];
        let created = 0, updated = 0;
        for (const o of orders) {
          const p = E.ebayOrderPatch(o), ex = st.inventory.find((x) => x.ext_ref === p.ext_ref);
          if (ex) { ex.timeline = { ...p.timeline, ...(ex.timeline || {}) }; updated++; continue; }
          const id = uid(), base = { id, title: p.title, product_key: E.productKey(p.title), condition: "gebraucht", buy_costs: 0, list_price: null, sold_fees: 0, sold_shipping: 0, item_ref: p.item_id, note: null, source: "ebay", ext_ref: p.ext_ref, timeline: p.timeline, created_at: iso(now) };
          st.inventory.unshift(o.role === "buyer" ? { ...base, ...p.fields, status: "lager", platform_sold: null, sold_price: null, sold_at: null }
            : { ...base, ...p.fields, buy_price: 0, bought_at: p.fields.sold_at, platform_bought: "eBay", note: "Aus eBay-Verkauf übernommen – bitte Kaufpreis nachtragen" });
          if (p.shipment) st.ships.push({ id: uid(), inventory_id: id, ...p.shipment, created_at: o.shipped, source: "ebay" });
          created++;
        }
        st.ebayLink.last_sync_at = iso(now); save(); return { orders: orders.length, created, updated };
      },
      async ebayDisconnect() { st.ebayLink = null; save(); return { ok: true }; },
      async invDelete(id) { st.ships = st.ships.filter((s) => s.inventory_id !== id); st.inventory = st.inventory.filter((x) => x.id !== id); st.sold = st.sold.filter((s) => s.inventory_id !== id); save(); return { ok: true }; },
      async settingsSave(s) { st.settings = { ...st.settings, ...s }; save(); return { ok: true }; },
      async profileSave(n) { st.me.display_name = n; save(); return { ok: true }; },
      // KI-Kontingent (DEMO) – gleiche Regeln wie die Edge Function fr-ai, nur lokal
      async aiStatus() {
        const A = E.AI, ai = (st.ai ||= { wallet: null, usage: [], hits: [] });
        const w = ai.wallet;
        if (w && w.plan !== "none" && Date.parse(w.next_refill_at) <= Date.now()) { w.used_ct = 0; w.budget_ct = A.PLAN.budget_ct; w.period_start = w.next_refill_at; w.next_refill_at = A.nextRefill(w.next_refill_at); save(); }
        return { enabled: true, demo: true, local: true, plan: A.PLAN, price: A.PRICE, max_ct: A.maxCost(), typical_ct: A.typicalCost(), wallet: w, usage: ai.usage.slice(0, 20) };
      },
      async aiBook() {
        await wait(450); const A = E.AI, ai = (st.ai ||= { wallet: null, usage: [], hits: [] }), now = Date.now();
        let kind;
        if (!ai.wallet || ai.wallet.plan === "none") { kind = "book"; ai.wallet = { plan: "pro_demo", budget_ct: A.PLAN.budget_ct, used_ct: 0, reserved_ct: 0, period_start: iso(now), next_refill_at: A.nextRefill(now), demo: true }; }
        else { if (ai.wallet.budget_ct + A.PLAN.pack_ct > A.PLAN.max_budget_ct) throw new Error(`Mehr als ${(A.PLAN.max_budget_ct / 100).toFixed(2).replace(".", ",")} € Testguthaben gehen nicht`); kind = "pack"; ai.wallet.budget_ct += A.PLAN.pack_ct; }
        ai.usage.unshift({ id: uid(), kind, cost_ct: kind === "book" ? A.PLAN.budget_ct : A.PLAN.pack_ct, tokens_in: 0, tokens_out: 0, created_at: iso(now) });
        save(); return { ok: true, kind, demo: true, ...(await this.aiStatus()) };
      },
      async aiCheck(d) {
        const A = E.AI, ai = (st.ai ||= { wallet: null, usage: [], hits: [] }), now = Date.now();
        ai.hits = (ai.hits || []).filter((t) => now - t < 60e3);
        if (ai.hits.length >= A.PER_MIN) throw new Error("Zu viele Anfragen – bitte kurz warten und dann erneut versuchen.");
        await this.aiStatus();
        const w = ai.wallet;
        if (!w || w.plan === "none") throw new Error("Kein KI-Guthaben – buche „Hotflip Pro (Demo)“ im Profil, um den KI-Check zu testen.");
        const max = A.maxCost();
        if (w.budget_ct - w.used_ct - (w.reserved_ct || 0) < max) throw new Error(`KI-Guthaben aufgebraucht – bitte nachbuchen (Demo) oder bis zur Aufladung am ${new Date(w.next_refill_at).toLocaleDateString("de-DE")} warten.`);
        ai.hits.push(now); w.reserved_ct = (w.reserved_ct || 0) + max; save();
        await wait(700);
        const sim = A.simulate({ ...d, opts: st.settings }), cost = A.cost(sim.tokens_in, sim.tokens_out);
        w.reserved_ct = Math.max(0, w.reserved_ct - max); w.used_ct = Math.min(w.budget_ct, Math.round((w.used_ct + cost) * 1000) / 1000);
        ai.usage.unshift({ id: uid(), kind: "deal_check", title: String(d.title || "").slice(0, 200), tokens_in: sim.tokens_in, tokens_out: sim.tokens_out, cost_ct: cost, created_at: iso(Date.now()) });
        ai.usage = ai.usage.slice(0, 100); save();
        return { demo: true, result: sim.result, usage: { tokens_in: sim.tokens_in, tokens_out: sim.tokens_out, cost_ct: cost, reserved_ct: max }, wallet: w, usageList: ai.usage.slice(0, 20) };
      },
      async deleteAccount() { localStorage.removeItem(KEY); return { ok: true }; },
    };
  };
})();
