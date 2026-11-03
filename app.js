/* Hotflip – App (ohne Build-Schritt). Hash-Router, zwei Backends: Demo (localStorage) und Live (Supabase). */
(function () {
  "use strict";
  const E = window.FR_ENGINE, CFG = window.FR_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const eur = (n, d = 0) => n == null || !isFinite(n) ? "–" : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
  const eur2 = (n) => eur(n, Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2);
  const pct = (n) => (n == null ? "–" : Math.round(n) + " %");
  const safeUrl = (u) => (typeof u === "string" && /^https:\/\//.test(u) ? u : "#");
  const ago = (t) => {
    const s = (Date.now() - Date.parse(t)) / 1000;
    if (s < 90) return "gerade eben"; if (s < 3600) return `vor ${Math.round(s / 60)} Min.`; if (s < 86400) return `vor ${Math.round(s / 3600)} Std.`;
    const d = Math.round(s / 86400); return d === 1 ? "gestern" : `vor ${d} Tagen`;
  };
  const until = (t) => { const s = (Date.parse(t) - Date.now()) / 1000; if (s <= 0) return "beendet"; if (s < 3600) return `noch ${Math.ceil(s / 60)} Min.`; if (s < 86400) return `noch ${Math.floor(s / 3600)} Std. ${Math.round((s % 3600) / 60)} Min.`; return `noch ${Math.floor(s / 86400)} T. ${Math.round((s % 86400) / 3600)} Std.`; };
  const gebote = (n) => `${n ?? 0} ${+n === 1 ? "Gebot" : "Gebote"}`;
  const dateTimeDE = (d) => new Date(d).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " Uhr";
  const dateDE = (d) => (d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "");
  const today = () => new Date().toLocaleDateString("sv-SE");
  const scoreColor = (s) => (s >= 80 ? "#b3241a" : s >= 65 ? "#17140f" : s >= 45 ? "#4a4237" : "#675d4d");
  const hueOf = (s) => [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  // ---------- Icons ----------
  const I = {
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 21V5M9 8h6"/></svg>',
    radar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" opacity=".6"/><path d="M12 12 18.5 5.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 3.5c1 3 4.5 4.5 4.5 9a5 5 0 0 1-10 0c0-2 1-3.2 2-4 0 1.5.7 2.5 1.7 2.5 0-3 .3-5.3 1.8-7.5Z"/><path d="M5 21h14"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5Z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.6 2.2c.4 3.3 2.6 4.9 4.3 6.8 1.6 1.8 2.6 3.7 2.6 6.1A7.4 7.4 0 0 1 12 22.4a7.4 7.4 0 0 1-7.5-7.3c0-2.8 1.4-4.7 3-6.1.2 1.8 1 3 2.3 3.5-.4-3.9.8-7.6 2.8-10.3Zm-.4 11.1c-1.5 1.4-2.6 2.6-2.6 4.3a2.5 2.5 0 0 0 5 0c0-1.6-1-2.9-2.4-4.3Z"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4 7l16 10M20 7 4 17M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5M3 10.5l3.5-1-1-3.5M21 13.5l-3.5 1 1 3.5M3.4 14.3l3.5.6-.9 3.5M20.6 9.7l-3.5-.6.9-3.5"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/></svg>',
    hist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/></svg>',
  };
  // Logo: ein Preisschild mit Loch und Faden – Hotflip ist der Typ am Flohmarktstand, der die Preise kennt
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 9.5 9.5 3H29v26H9.5L3 22.5Z" fill="#ffd23f" stroke="#17140f" stroke-width="2" stroke-linejoin="round" transform="rotate(-8 16 16)"/><circle cx="9" cy="16" r="2.3" fill="#f3ecdd" stroke="#17140f" stroke-width="1.6" transform="rotate(-8 16 16)"/><path d="M15.5 21.5c3.8-1.4 6.6-4.3 6.9-8.6.2-2.4-.8-4.4-2.3-5.6.2 2.1-.6 3.4-1.9 3.9.3-2.7-.6-4.3-2.2-5.2.1 2.9-1.6 4.4-2.6 6-.8 1.3-1 2.9-.4 4.5" fill="none" stroke="#b3241a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------- Produktbilder (Demo) ----------
  const PHONE = ["#262b38", "#3f6fb3", "#ece6da", "#c8202f", "#3d5c48"], JOY = [["#e9edf2", "#e9edf2"], ["#0ab9e6", "#ff3c28"], ["#e9edf2", "#e9edf2"], ["#0ab9e6", "#ff3c28"], ["#3b3f46", "#3b3f46"]], HP = ["#1c1e23", "#c9c4bb", "#283a5c", "#1c1e23", "#c9c4bb"];
  function illo(src) {
    const [, kind, hueS, nS] = String(src).split(":"); const hue = Number(hueS) || 200, n = Number(nS) || 0;
    const bg = `<defs><radialGradient id="g${kind}${n}" cx=".35" cy=".25" r="1"><stop offset="0" stop-color="hsl(${hue} 32% 58%)"/><stop offset="1" stop-color="hsl(${hue} 30% 36%)"/></radialGradient></defs><rect width="100" height="100" fill="url(#g${kind}${n})"/><ellipse cx="50" cy="88" rx="30" ry="4" fill="#000" opacity=".35"/>`;
    let g = "";
    if (kind === "phone") { const c = PHONE[n]; g = `<g transform="rotate(${-8 + n * 3} 50 50)"><rect x="31" y="12" width="38" height="74" rx="8" fill="${c}" stroke="rgba(255,255,255,.35)" stroke-width="1"/><rect x="35" y="16" width="20" height="20" rx="5" fill="rgba(0,0,0,.25)"/><circle cx="41" cy="22" r="4.2" fill="#0d0f14" stroke="#555" stroke-width="1"/><circle cx="49" cy="30" r="4.2" fill="#0d0f14" stroke="#555" stroke-width="1"/><circle cx="41" cy="22" r="1.6" fill="#2a3b5c"/><circle cx="49" cy="30" r="1.6" fill="#2a3b5c"/><circle cx="50" cy="60" r="5" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.2"/></g>`; }
    else if (kind === "console") { g = `<g transform="translate(${n * 1.5 - 3} 0)"><path d="M33 14c6-2 10 0 11 4v66c-1 3-6 4-11 2-3-14-3-58 0-72Z" fill="#f2f4f7"/><path d="M67 14c-6-2-10 0-11 4v66c1 3 6 4 11 2 3-14 3-58 0-72Z" fill="#f2f4f7"/><rect x="43" y="16" width="14" height="70" rx="3" fill="#15171c"/><path d="M45 20h10" stroke="#3b6ff5" stroke-width="1.6" stroke-linecap="round" opacity=".9"/><rect x="47" y="64" width="6" height="1.4" fill="#444"/></g>`; }
    else if (kind === "handheld") { const [l, r] = JOY[n]; g = `<g transform="rotate(${-4 + n * 2} 50 50)"><rect x="8" y="30" width="15" height="40" rx="7" fill="${l}"/><rect x="77" y="30" width="15" height="40" rx="7" fill="${r}"/><rect x="22" y="30" width="56" height="40" rx="3" fill="#202329"/><rect x="25" y="33" width="50" height="34" rx="2" fill="hsl(${hue + 190} 60% 45%)"/><path d="M25 58 40 46l9 7 10-11 16 15v10H25Z" fill="rgba(255,255,255,.25)"/><circle cx="15.5" cy="42" r="3" fill="#222"/><circle cx="84.5" cy="56" r="3" fill="#222"/></g>`; }
    else if (kind === "cards") { g = `<g transform="rotate(${-6 + n * 2} 50 50)"><rect x="24" y="22" width="52" height="62" rx="4" fill="hsl(${hue} 70% 52%)" stroke="rgba(255,255,255,.35)"/><rect x="28" y="26" width="44" height="30" rx="2" fill="#ffd84a"/><circle cx="50" cy="41" r="10" fill="#fff" stroke="#111" stroke-width="2"/><path d="M40 41h20" stroke="#111" stroke-width="2.4"/><circle cx="50" cy="41" r="3.2" fill="#fff" stroke="#111" stroke-width="2"/><rect x="28" y="62" width="44" height="4" rx="2" fill="rgba(255,255,255,.55)"/><rect x="28" y="70" width="30" height="3" rx="1.5" fill="rgba(255,255,255,.35)"/></g>`; }
    else if (kind === "lego") { g = `<g transform="rotate(${-5 + n * 3} 50 55)"><rect x="18" y="44" width="64" height="34" rx="3" fill="hsl(${hue} 85% 50%)"/>${[0, 1, 2, 3].map((k) => `<rect x="${22 + k * 15.5}" y="35" width="10" height="10" rx="2" fill="hsl(${hue} 85% 56%)"/><ellipse cx="${27 + k * 15.5}" cy="35" rx="5" ry="1.8" fill="hsl(${hue} 90% 68%)"/>`).join("")}<rect x="18" y="44" width="64" height="5" fill="rgba(255,255,255,.18)"/></g>`; }
    else if (kind === "sneaker") { g = `<g transform="rotate(${-4 + n * 2} 50 60)"><path d="M14 66c2-12 8-20 18-22l10 6c8 2 18 4 26 8 10 3 18 6 18 12v4H14Z" fill="#f4f4f4"/><path d="M32 44l10 6c8 2 18 4 26 8l-4 6c-14-2-26-4-40-4-3-6 0-12 8-16Z" fill="#141414"/><path d="M14 74h72v5H14Z" fill="#e8e8e8"/><path d="M38 56l14 2M42 52l12 2" stroke="#fff" stroke-width="1.6"/></g>`; }
    else { const c = HP[n]; g = `<g transform="rotate(${-6 + n * 3} 50 52)"><path d="M24 58c0-25 12-40 26-40s26 15 26 40" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/><path d="M24 58c0-25 12-40 26-40s26 15 26 40" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/><rect x="15" y="50" width="20" height="30" rx="9" fill="${c}" stroke="rgba(255,255,255,.2)"/><rect x="65" y="50" width="20" height="30" rx="9" fill="${c}" stroke="rgba(255,255,255,.2)"/><rect x="31" y="54" width="6" height="22" rx="3" fill="#0e0f12"/><rect x="63" y="54" width="6" height="22" rx="3" fill="#0e0f12"/></g>`; }
    return `<svg viewBox="0 0 100 100" role="img" aria-label="Beispielbild">${bg}${g}</svg>`;
  }
  const thumb = (src) => (String(src || "").startsWith("demo:") ? illo(src) : src && /^https:\/\//.test(src) ? `<img src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#e4dac6"/><g transform="translate(38 38)" stroke="#8a7f6c" fill="none" stroke-width="3">${I.box.replace(/<\/?svg[^>]*>/g, "")}</g></svg>`);

  // ---------- Live-Backend (Supabase) ----------
  function liveBackend() {
    const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, storageKey: "fr_auth" } });
    let user = null;
    async function call(fn, body) {
      const { data: s } = await sb.auth.getSession();
      const r = await fetch(`${CFG.supabaseUrl}/functions/v1/${fn}`, { method: "POST", headers: { "content-type": "application/json", apikey: CFG.supabaseAnonKey, authorization: `Bearer ${s?.session?.access_token || CFG.supabaseAnonKey}` }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `Fehler ${r.status}`);
      return j;
    }
    const fx = (action, b = {}) => call(CFG.functionName || "flipradar", { action, ...b });
    const q = async (p) => { const { data, error } = await p; if (error) throw new Error(error.message); return data; };
    const email = (u) => `${String(u).trim().toLowerCase()}@${CFG.emailDomain || "flipradar.local"}`;
    return {
      mode: "live",
      async session() { const { data } = await sb.auth.getSession(); user = data?.session?.user ?? null; return user ? { id: user.id } : null; },
      async login(u, p) { const { data, error } = await sb.auth.signInWithPassword({ email: email(u), password: p }); if (error) throw new Error(/invalid/i.test(error.message) ? "Benutzername oder Passwort falsch" : error.message); user = data.user; },
      async signup(u, p, name) { await fx("signup", { username: u, password: p, display_name: name, consent: true }); await this.login(u, p); },
      async logout() { await sb.auth.signOut(); },
      me: () => fx("me"),
      async search(qs, cond = "alle", buying = "alle") { return call(CFG.searchFunction || "fr-search", { q: qs, condition: cond, buying }); },
      soldFor: (key) => q(sb.from("fr_sold_reports").select("id,price,condition,platform,sold_at,title,user_id,created_at,author:fr_profiles(display_name)").eq("product_key", key).order("sold_at", { ascending: false }).limit(200)).then((r) => r.map((x) => ({ ...x, user_name: x.author?.display_name }))),
      soldRecent: () => q(sb.from("fr_sold_reports").select("id,price,condition,platform,sold_at,title,product_key,user_id,created_at,author:fr_profiles(display_name)").order("created_at", { ascending: false }).limit(120)).then((r) => r.map((x) => ({ ...x, user_name: x.author?.display_name }))),
      async feed() {
        const [rows, mine] = await Promise.all([q(sb.from("fr_deal_feed").select("*").order("created_at", { ascending: false }).limit(80)), q(sb.from("fr_votes").select("deal_id,v").eq("user_id", user.id))]);
        const mv = Object.fromEntries(mine.map((v) => [v.deal_id, v.v]));
        return rows.map((r) => ({ ...r, total: +r.total, market: +r.market, under_pct: +r.under_pct, my_vote: mv[r.id] ?? 0 }));
      },
      // Verkaufsmeldungen im Flammen-Fenster (rollierend, z. B. 30 Tage) für mehrere Produkte – Basis für die Verkaufs-Flammen im Feed
      recentSales: (keys) => (keys.length ? q(sb.from("fr_sold_reports").select("product_key,condition,price,sold_at,user_id").in("product_key", keys).gte("sold_at", E.flameSince()).limit(1000)) : Promise.resolve([])),
      async deal(id) {
        const [d, cs, mv] = await Promise.all([q(sb.from("fr_deal_feed").select("*").eq("id", id).maybeSingle()), q(sb.from("fr_comments").select("id,body,created_at,user_id,author:fr_profiles(display_name)").eq("deal_id", id).order("created_at")), q(sb.from("fr_votes").select("v").eq("deal_id", id).eq("user_id", user.id))]);
        if (!d) return null;
        return { ...d, total: +d.total, market: +d.market, under_pct: +d.under_pct, my_vote: mv[0]?.v ?? 0, commentList: cs.map((c) => ({ ...c, author: c.author?.display_name ?? "Ehemaliges Mitglied", mine: c.user_id === user.id })) };
      },
      dealByItem: (itemId) => q(sb.from("fr_deals").select("id").eq("item_id", itemId).maybeSingle()).then((r) => r?.id ?? null),
      shareDeal: (d) => fx("deal_share", { deal: d }),
      vote: (kind, id, v) => fx("vote", { kind, id, v }),
      comment: (target, body) => fx("comment_post", { target, body }),
      async restocks() {
        const [rows, mine] = await Promise.all([q(sb.from("fr_restock_feed").select("*").order("created_at", { ascending: false }).limit(100)), q(sb.from("fr_restock_votes").select("restock_id,v").eq("user_id", user.id))]);
        const mv = Object.fromEntries(mine.map((v) => [v.restock_id, v.v]));
        return rows.map((r) => ({ ...r, price: r.price == null ? null : +r.price, regular_price: r.regular_price == null ? null : +r.regular_price, resale_estimate: r.resale_estimate == null ? null : +r.resale_estimate, my_vote: mv[r.id] ?? 0 }));
      },
      async restock(id) {
        const [r, cs, mv] = await Promise.all([q(sb.from("fr_restock_feed").select("*").eq("id", id).maybeSingle()), q(sb.from("fr_comments").select("id,body,created_at,user_id,author:fr_profiles(display_name)").eq("restock_id", id).order("created_at")), q(sb.from("fr_restock_votes").select("v").eq("restock_id", id).eq("user_id", user.id))]);
        if (!r) return null;
        return { ...r, price: r.price == null ? null : +r.price, regular_price: r.regular_price == null ? null : +r.regular_price, resale_estimate: r.resale_estimate == null ? null : +r.resale_estimate, my_vote: mv[0]?.v ?? 0, mine: r.posted_by === user.id, commentList: cs.map((c) => ({ ...c, author: c.author?.display_name ?? "Ehemaliges Mitglied", mine: c.user_id === user.id })) };
      },
      restockSave: (x) => fx("restock_save", { restock: x }),
      restockStatus: (id, status) => fx("restock_status", { id, status }),
      restockDelete: (id) => fx("restock_delete", { id }),
      report: (kind, id, reason, note) => fx("report", { kind, id, reason, note }),
      async posts() {
        const [rows, mine] = await Promise.all([q(sb.from("fr_post_feed").select("*").order("created_at", { ascending: false }).limit(150)), q(sb.from("fr_post_votes").select("post_id,v").eq("user_id", user.id))]);
        const mv = Object.fromEntries(mine.map((v) => [v.post_id, v.v]));
        return rows.map((r) => ({ ...r, my_vote: mv[r.id] ?? 0 }));
      },
      async post(id) {
        const [r, cs, mv] = await Promise.all([q(sb.from("fr_post_feed").select("*").eq("id", id).maybeSingle()), q(sb.from("fr_comments").select("id,body,created_at,user_id,author:fr_profiles(display_name)").eq("post_id", id).order("created_at")), q(sb.from("fr_post_votes").select("v").eq("post_id", id).eq("user_id", user.id))]);
        if (!r) return null;
        return { ...r, my_vote: mv[0]?.v ?? 0, mine: r.posted_by === user.id, commentList: cs.map((c) => ({ ...c, author: c.author?.display_name ?? "Ehemaliges Mitglied", mine: c.user_id === user.id })) };
      },
      postSave: (x) => fx("post_save", { post: x }),
      postDelete: (id) => fx("post_delete", { id }),
      commentDelete: (id) => fx("comment_delete", { id }),
      soldReport: (r) => fx("sold_report", r),
      soldDelete: (id) => fx("sold_delete", { id }),
      async watches() {
        const [ws, hs] = await Promise.all([q(sb.from("fr_watches").select("*").order("created_at")), q(sb.from("fr_watch_hits").select("watch_id,seen"))]);
        return ws.map((w) => ({ ...w, hits: hs.filter((h) => h.watch_id === w.id).length, fresh: hs.filter((h) => h.watch_id === w.id && !h.seen).length }));
      },
      watchSave: (w) => fx("watch_save", w),
      watchDelete: (id) => fx("watch_delete", { id }),
      watchRun: (id) => fx("watch_run", { id }),
      hits: () => q(sb.from("fr_watch_hits").select("*,w:fr_watches(query)").order("created_at", { ascending: false }).limit(60)).then((r) => r.map((h) => ({ ...h, query: h.w?.query, total: +h.total, under_pct: h.under_pct == null ? null : +h.under_pct }))),
      hitsSeen: () => fx("hits_seen"),
      async inventory() {
        const [rows, sh, ships] = await Promise.all([q(sb.from("fr_inventory").select("*").order("bought_at", { ascending: false }).limit(1000)), q(sb.from("fr_sold_reports").select("inventory_id").eq("user_id", user.id).not("inventory_id", "is", null)), q(sb.from("fr_shipments").select("*").limit(2000)).catch(() => [])]);
        const shared = new Set(sh.map((x) => x.inventory_id));
        return rows.map((r) => ({ ...r, timeline: r.timeline || {}, ship: Object.fromEntries(ships.filter((s) => s.inventory_id === r.id).map((s) => [s.direction, s])), shared: shared.has(r.id) }));
      },
      invStep: (id, step, at) => fx("inv_step", { id, step, at }),
      shipSave: (inventory_id, direction, carrier, tracking_no) => fx("ship_save", { inventory_id, direction, carrier, tracking_no }),
      trackRefresh: (inventory_id) => call("fr-track", { action: "track_refresh", inventory_id }),
      ebayStatus: () => fx("ebay_status"),
      ebayConnect: () => fx("ebay_connect"),
      ebaySync: () => fx("ebay_sync"),
      ebayDisconnect: () => fx("ebay_disconnect"),
      aiStatus: () => call("fr-ai", { action: "ai_status" }),
      aiBook: () => call("fr-ai", { action: "ai_book" }),
      aiCheck: (deal) => call("fr-ai", { action: "ai_check", deal }),
      invSave: (it) => fx("inv_save", { item: it }),
      invDelete: (id) => fx("inv_delete", { id }),
      settingsSave: (s) => fx("settings_save", { settings: s }),
      profileSave: (n) => fx("profile_save", { display_name: n }),
      deleteAccount: async () => { await fx("delete_account"); try { localStorage.removeItem("fr_auth"); } catch {} user = null; }, // Konto ist serverseitig weg → nur lokale Sitzung verwerfen
      logError: (m) => fx("log_error", { message: m, page: location.hash }).catch(() => {}),
    };
  }
  const HAS_LIVE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);

  // ---------- Zustand ----------
  const S = { be: null, me: null, settings: {}, ebay: false, route: "", search: { q: "", cond: "alle", buy: "alle", sort: "score", base: null, extra: {}, fLoading: false, showRej: false, loading: false, res: null, raw: null, err: null, sold: [] }, feedTab: "hot", niche: "alle", unseen: 0, recent: [] };
  const opts = () => ({ ...E.DEFAULTS, ...S.settings });
  // Eine einheitliche Ansicht: Preis (inkl. Versand) gegen Marktpreis. Ein früher gespeichertes settings.mode wird ignoriert.
  const marketOf = (x) => x.market || S.search.res?.market[x.cond]?.median || S.search.res?.market.alle?.median || 0;
  const saveOf = (total, market) => (market > 0 ? market - total : 0);
  try { S.recent = JSON.parse(localStorage.getItem("fr_recent") || "[]").slice(0, 6); } catch { S.recent = []; }

  // ---------- UI-Helfer ----------
  let toastT;
  function toast(msg, err = false) {
    $(".toast")?.remove(); clearTimeout(toastT);
    const t = document.createElement("div"); t.className = "toast" + (err ? " err" : ""); t.textContent = msg; t.setAttribute("role", "status");
    document.body.appendChild(t); toastT = setTimeout(() => t.remove(), 3200);
  }
  function sheet(html, onMount) {
    closeSheet();
    const sc = document.createElement("div"); sc.className = "scrim"; sc.onclick = closeSheet;
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true");
    sh.innerHTML = `<div class="grab"></div>${html}`;
    document.body.append(sc, sh); onMount?.(sh);
    setTimeout(() => sh.querySelector("input:not([type=range]),select,textarea")?.focus({ preventScroll: true }), 350);
    return sh;
  }
  function closeSheet() { $(".scrim")?.remove(); $(".sheet")?.remove(); }
  const fail = (e) => { console.warn(e); toast(e?.message || String(e), true); };
  function ring(score, size = 52) {
    const r = 22, c = 2 * Math.PI * r, s = Math.max(0, Math.min(100, score || 0));
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 52 52" style="width:${size}px;height:${size}px"><circle cx="26" cy="26" r="${r}" fill="none" stroke="#e4dac6" stroke-width="5"/><circle class="arc" cx="26" cy="26" r="${r}" fill="none" stroke="${scoreColor(s)}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - s / 100)}"/></svg><div class="v" style="color:${scoreColor(s)}">${score ?? "–"}</div></div>`;
  }
  function animate(root = document) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$("[data-off]", root).forEach((el) => { el.style.strokeDashoffset = el.dataset.off; });
      $$("[data-rot]", root).forEach((el) => { el.style.transform = `rotate(${el.dataset.rot}deg)`; });
      $$("[data-w]", root).forEach((el) => { el.style.width = el.dataset.w; });
      $$("[data-count]", root).forEach((el) => {
        const to = Number(el.dataset.count), fmt = el.dataset.fmt, t0 = performance.now(), dur = 900;
        const step = (t) => { const k = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = fmt === "eur" ? eur(v) : Math.round(v); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }));
  }
  // Etiketten aus der Engine in Hotflip-Sprache (Engine/Server bleiben unverändert)
  const SAY = { "Top-Deal": "Heißes Ding", "Guter Deal": "Guter Kurs", "Neu eingestellt": "frisch rein", "Top-Verkäufer": "Verkäufer top", "Verdächtig günstig – genau prüfen": "Zu billig? Genau hinschauen", "Auktion · endet bald": "Auktion · gleich vorbei" };
  const badgeHtml = (bs, max = 9) => bs.slice(0, max).map((b) => `<span class="bdg ${esc(b.k)}">${esc(SAY[b.t] || b.t)}</span>`).join("");
  const avatar = (name) => `<div class="av" style="background:hsl(${hueOf(name)} 70% 70%)">${esc(String(name || "?").trim()[0]?.toUpperCase() || "?")}</div>`;

  // ---------- Shell ----------
  function shell(inner, tab) {
    const demo = S.be.mode === "demo";
    return `<header class="top"><div class="in"><a class="brand" href="#/">${LOGO}<span>Hotflip</span></a>${demo ? '<span class="pill demo" title="Alle Angebote, Stimmen und Verkäufe sind erfunden">Beispieldaten</span>' : ""}<span class="spacer"></span><button class="iconbtn" data-act="settings" aria-label="Einstellungen">${I.gear}</button></div></header>
    <main class="wrap view" id="main">${inner}<footer class="sitefoot">${LEGAL}</footer></main>
    <nav class="tabs" aria-label="Navigation"><div class="in">
      ${[["#/", "Suchen", I.search, "radar"], ["#/community", "Community", I.users, "community"], ["#/watch", "Lauern", I.bell, "watch"], ["#/bestand", "Mehr", I.more, "bestand", "more"]].map(([h, l, ic, k, act]) => `<a class="tab ${tab === k ? "on" : ""}" href="${h}" ${act ? `data-act="${act}"` : ""} ${tab === k ? 'aria-current="page"' : ""}>${ic}<span>${l}</span>${k === "watch" && S.unseen ? `<span class="dot">${S.unseen}</span>` : ""}</a>`).join("")}
    </div></nav>`;
  }
  function mount(html, tab) { document.getElementById("app").innerHTML = shell(html, tab); animate(); window.scrollTo(0, 0); }

  // ---------- Radar (Suche) ----------
  const SUGGEST = ["iPhone 13 128 GB", "PlayStation 5 Disc Edition", "Nintendo Switch OLED", "Sony WH-1000XM4"];
  function viewRadar() {
    const s = S.search;
    const chips = [...new Set([...(S.be.mode === "demo" ? SUGGEST : []), ...S.recent, ...(S.be.mode === "demo" ? [] : SUGGEST)])].slice(0, 8);
    let body = "";
    if (s.loading) body = skeleton();
    else if (s.err) body = `<div class="card empty">${I.info}<div>${esc(s.err)}</div></div>`;
    else if (s.res) body = results();
    else body = intro();
    mount(`<section class="hero"><h1>Was kostet’s <em>wirklich?</em></h1><p class="herosub">Sag, was du suchst. Ich sag dir, ob der Preis ein Ding ist – oder ob du drauflegst.</p>
      <form class="search" id="sf" role="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input id="q" name="q" value="${esc(s.q)}" placeholder="z. B. iPhone 13 128 GB" autocomplete="off" enterkeyhint="search" aria-label="Produkt suchen">
        <button class="btn pri go" type="submit">Prüfen</button></form>
      <div class="chips">${chips.map((c) => `<button class="chip ${E.productKey(c) === E.productKey(s.q) ? "on" : ""}" data-act="q" data-q="${esc(c)}">${S.be.mode === "demo" && SUGGEST.includes(c) ? '<span class="d"></span>' : ""}${esc(c)}</button>`).join("")}</div>
    </section><div id="body">${body}</div>`, "radar");
    $("#sf").onsubmit = (e) => { e.preventDefault(); runSearch($("#q").value); };
  }

  function intro() {
    const bon = [["bis 150 eBay-Angebote", "angeschaut"], ["Hüllen, Kabel, Kartons", "raus"], ["Kaputt & Bastler", "raus"], ["falsches Modell/Speicher", "raus"], ["dein Preis vs. Median", "klar"]];
    return `<div class="bon" aria-label="Was Hotflip mit jeder Suche macht"><div class="bonhead">HOTFLIP · PREISCHECK</div>
        ${bon.map(([a, b]) => `<div class="bl"><span>${a}</span><i></i><b>${b}</b></div>`).join("")}
        <div class="bonfoot">Verglichen wird mit dem Median der Sofort-Kaufen-Preise. Flammen gibt’s, wenn Leute hier das Ding teurer verkauft haben.</div></div>
      ${S.be.mode === "demo" ? `<p class="note">Demo-Modus. Alles ausgedacht, aber echt gerechnet – nimm eins der vier Produkte oben.</p>` : !S.ebay ? `<p class="note warn">eBay ist noch nicht verbunden. Bis die Schlüssel drin sind, gibt’s hier keine echten Angebote.</p>` : ""}
      <div class="sec hand"><h2>Haben andere gerade gefunden</h2><span class="spacer"></span><a href="#/community">alle ansehen</a></div><div id="hotprev"><div class="sk" style="height:96px"></div></div>
      <div class="sec hand"><h2>Wieder im Laden. Nicht lange.</h2><span class="spacer"></span><a href="#/community" data-act="ftab" data-v="restocks">alle Restocks</a></div><div id="rsprev"><div class="sk" style="height:96px"></div></div>`;
  }
  async function loadHotPreview() {
    const el = $("#hotprev"); if (!el) return;
    try { const f = (await withFlames(await S.be.feed())).sort(byFlames).slice(0, 3); el.innerHTML = f.length ? f.map(dealCard).join("") : `<p class="empty-line">Noch hat keiner was geteilt. Sei der Erste – Teilen geht in jedem Angebot.</p>`; }
    catch (e) { el.innerHTML = ""; }
    const rp = $("#rsprev"); if (!rp) return;
    try { const r = sortRestocks(await withRestockFlames((await S.be.restocks()).filter((x) => rsState(x).k !== "out"))).slice(0, 2); rp.innerHTML = r.length ? r.map(restockCard).join("") : `<p class="empty-line">Gerade läuft kein Restock. Ruhig bleiben, kommt wieder.</p>`; }
    catch (e) { rp.innerHTML = ""; }
  }

  function skeleton() {
    const it = `<div class="skitem"><div class="sk" style="height:84px"></div><div><div class="sk" style="height:14px;width:85%"></div><div class="sk" style="height:14px;width:55%;margin-top:8px"></div><div class="sk" style="height:20px;width:35%;margin-top:12px"></div></div><div class="sk" style="width:52px;height:52px;border-radius:50%"></div></div>`;
    return `<div class="scan"><svg viewBox="0 0 32 32">${LOGO.replace(/<\/?svg[^>]*>/g, "")}</svg>Wühle mich durch die Angebote. Hüllen und Kaputtes fliegen raus …</div>
      <div class="card"><div class="sk" style="height:12px;width:40%"></div><div class="sk" style="height:34px;width:55%;margin-top:10px"></div><div class="sk" style="height:100px;margin-top:16px"></div></div>
      <div style="margin-top:16px">${it.repeat(4)}</div>`;
  }

  async function runSearch(q) {
    q = String(q || "").trim(); if (q.length < 2) return toast("Ein Wort brauch ich schon.", true);
    const s = S.search; Object.assign(s, { q, loading: true, res: null, err: null, showRej: false });
    S.recent = [q, ...S.recent.filter((x) => E.productKey(x) !== E.productKey(q))].slice(0, 6);
    try { localStorage.setItem("fr_recent", JSON.stringify(S.recent)); } catch { }
    if (location.hash !== "#/" && location.hash !== "") { location.hash = "#/"; } else viewRadar();
    try {
      const raw = await S.be.search(q, "alle");
      if (raw.unknown) throw new Error("In der Demo kenne ich nur: " + SUGGEST.join(", ") + ".");
      s.base = raw; s.extra = {}; s.raw = raw; s.evalQ = raw.product || q;
      s.sold = await S.be.soldFor(E.productKey(s.evalQ)).catch(() => []);
      await loadFiltered(false);
      evaluateNow();
      if (!s.res.items.length && !s.res.rejected.length) s.err = "Nichts gefunden. Vielleicht kürzer fragen – ohne Farbe, ohne Zustand.";
    } catch (e) { s.err = e.message || String(e); }
    s.loading = false;
    if (route() === "radar") { viewRadar(); }
  }
  // Zustand/Angebotsformat ≠ „Alle“: zusätzlich serverseitig gefiltert bei eBay abfragen (conditionIds / buyingOptions)
  // und mit der Basis-Suche zusammenführen – so gibt es genug Festpreis-Angebote für den Marktpreis, und die Liste ist vollständig.
  async function loadFiltered(redraw = true) {
    const s = S.search; if (!s.base) return;
    const key = `${s.cond}|${s.buy}`;
    if (key !== "alle|alle" && !s.extra[key]) {
      if (redraw) { s.fLoading = true; viewRadar(); }
      try { s.extra[key] = await S.be.search(s.q, s.cond, s.buy); } catch (e) { s.extra[key] = { items: [] }; toast("Der Filter hat gehakt. Ich zeig dir, was schon da ist.", true); }
      s.fLoading = false;
    }
    const ex = key === "alle|alle" ? null : s.extra[key], seen = new Set(s.base.items.map((x) => x.itemId));
    s.raw = ex ? { ...s.base, items: [...s.base.items, ...(ex.items || []).filter((x) => !seen.has(x.itemId))], llm: { ...(s.base.llm || {}), ...(ex.llm || {}) } } : s.base;
    if (redraw) { evaluateNow(); viewRadar(); }
  }
  function evaluateNow() {
    const s = S.search, llm = s.raw.llm || {};
    const items = s.raw.items.map((x) => (llm[x.itemId] ? { ...x, llmReject: llm[x.itemId] } : x));
    s.res = E.evaluate(items, s.evalQ, opts(), s.sold);
  }

  // Ampel-Leiste je Zustand: grün = gutes Angebot (mind. 20 % unter der Mitte – ab da gibt der Score „Guter Deal“),
  // gelb = normal um die Mitte, rot = zu teuer (mehr als 10 % über der Mitte). Mitte = Median der Sofort-Kaufen-Angebote.
  const GOOD_PCT = 20, BAD_PCT = 10;
  const COND_NAME = { gebraucht: "Gebraucht", neu: "Neu", refurb: "Generalüberholt" };
  const zoneLim = (st) => ({ good: Math.round(st.median * (1 - GOOD_PCT / 100)), bad: Math.round(st.median * (1 + BAD_PCT / 100)) });
  const zoneOf = (v, st) => { const z = zoneLim(st); return v < z.good ? "g" : v > z.bad ? "r" : "y"; };
  const ZONE_CALL = { g: "Im grünen Bereich.", y: "Normaler Preis.", r: "Zu teuer." };
  const dayShort = (d) => new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "short" });
  // Gruppe, gegen die verglichen wird (wie in der Engine: Generalüberholt ohne eigene Angebote → Gebraucht)
  const rankGroup = (cond, mk) => (mk[cond] ? cond : cond === "refurb" && mk.gebraucht ? "gebraucht" : null);
  function ampel(st, { v = null, mini = false } = {}) {
    if (!st || !(st.median > 0)) return "";
    const m = st.median, z = zoneLim(st), lo = m * 0.62, hi = m * 1.3;
    const x = (p) => Math.max(0, Math.min(100, ((p - lo) / (hi - lo)) * 100));
    const xg = x(z.good), xm = x(m), xb = x(z.bad);
    const w = (t) => (mini ? "" : `<span>${t}</span>`);
    const bar = `<div class="abar"><i class="zg" style="width:${xg}%">${w("gut")}</i><i class="zy" style="width:${xb - xg}%">${w("normal")}</i><i class="zr" style="width:${100 - xb}%">${w("teuer")}</i><b class="amid" style="left:${xm}%"></b></div>`;
    const xv = v != null ? x(v) : null, out = v != null && (v < lo ? " out l" : v > hi ? " out r" : xv < 12 ? " l" : xv > 88 ? " r" : "");
    const ptr = v != null ? `<div class="aptr z${zoneOf(v, st)}${out}" style="left:${xv}%">${mini ? "" : `<span class="num">${v < lo ? "‹ " : ""}${eur(v)}${v > hi ? " ›" : ""}</span>`}</div>` : "";
    if (mini) return `<div class="ampel amps" aria-hidden="true">${bar}${ptr}</div>`;
    const lbl = `Preisleiste: gut unter ${eur(z.good)}, Mitte ${eur(m)}, teuer über ${eur(z.bad)}${v != null ? `, dieses Angebot ${eur(v)}` : ""}`;
    return `<div class="ampel" role="img" aria-label="${lbl}">
      <div class="amarks"><span class="agood" style="left:${xg}%"><small>gut unter</small><b class="num">${eur(z.good)}</b></span><span class="amidl" style="left:${xm}%"><small>Mitte</small><b class="num">${eur(m)}</b></span></div>
      ${bar}${ptr ? `<div class="aptrs">${ptr}</div>` : ""}</div>`;
  }
  // Wie günstig ist v im Vergleich? Mit genug Verlauf (≥ 3 Tage) gegen alle Angebote der letzten 30 Tage, sonst gegen die aktuellen.
  function rankOf(v, cond, id) {
    const s = S.search, mk = s.res?.market; if (!mk) return null;
    const g = rankGroup(cond, mk), now = (mk.points || []).filter((p) => (!g || p.g === g) && p.id !== id).map((p) => p.v);
    const h = s.base?.hist, hv = g && h?.by?.[g], days = h?.since ? Math.floor((Date.now() - Date.parse(h.since)) / 864e5) : 0;
    const use30 = !!hv && days >= 3 && hv.length >= Math.max(5, now.length);
    const vals = use30 ? [...hv] : now;
    if (use30) { const i = vals.findIndex((x) => Math.abs(x - v) < 0.01); if (i >= 0) vals.splice(i, 1); }   // das Angebot selbst
    const base = { use30, days: Math.min(30, days), since: h?.since || null, n: vals.length };
    if (vals.length < 3) return { ...base, few: true };
    const cheaper = vals.filter((x) => x > v).length, below = vals.filter((x) => x < v).length;
    return { ...base, ten: cheaper === vals.length ? 10 : Math.min(9, Math.round((cheaper / vals.length) * 10)), all: cheaper === vals.length, top: Math.max(5, Math.ceil((((below + 1) / (vals.length + 1)) * 100) / 5) * 5) };
  }
  function rankCall(r, short = false) {
    if (!r || r.few) return "";
    const span = r.days >= 30 ? "der letzten 30 Tage" : `der letzten ${r.days} Tage`;
    if (r.use30) {
      if (r.top <= 20) return short ? `Top ${r.top} % · ${r.days >= 30 ? 30 : r.days} Tage` : `Top ${r.top} % ${span}`;
      if (r.ten === 0) return short ? "Teurer als fast alle" : `Teurer als fast alle Angebote ${span}`;
      return short ? `Günstiger als ${r.ten} von 10` : `Günstiger als ${r.ten} von 10 Angeboten ${span}`;
    }
    if (r.all) return short ? `Billigstes von ${r.n + 1}` : `Günstiger als alle ${r.n} anderen aktuellen Angebote`;
    if (r.ten === 0) return short ? "Teurer als fast alle" : "Teurer als fast alle aktuellen Angebote";
    return short ? `Günstiger als ${r.ten} von 10` : `Günstiger als ${r.ten} von 10 aktuellen Angeboten`;
  }
  // kleine Zeile: womit verglichen wird – ehrlich, solange der Verlauf noch kurz ist
  const histNote = (r) => !r ? "" : r.use30 ? `Verglichen mit ${r.n} Angeboten seit ${dayShort(r.since)}` : r.since ? `Verglichen mit ${r.n} aktuellen Angeboten · Preise beobachtet seit ${dayShort(r.since)}` : `Verglichen mit ${r.n} aktuellen Angeboten`;

  function results() {
    const s = S.search, r = s.res, g = s.cond === "neu" ? "neu" : s.cond === "refurb" && r.market.refurb ? "refurb" : "gebraucht", st = r.market[g] || r.market.alle;
    const others = ["gebraucht", "neu", "refurb"].filter((k) => k !== g && r.market[k]).map((k) => `${COND_NAME[k]}: <b class="num">${eur(r.market[k].median)}</b>`);
    const h = s.base?.hist, hN = h?.by?.[g]?.length || 0, hDays = h?.since ? Math.floor((Date.now() - Date.parse(h.since)) / 864e5) : 0;
    let items = r.items.filter((x) => (s.cond === "alle" || x.cond === s.cond) && (s.buy === "alle" || x.buy === s.buy));
    // Auktionen nie wegen eines niedrigen Zwischengebots nach oben: bei Score/Ersparnis/Preis stehen Sofort-Kaufen-Angebote vorn
    const fixedFirst = (f) => (a, b) => (!!a.auction !== !!b.auction ? (a.auction ? 1 : -1) : a.auction ? E.byDeal(a, b) : f(a, b));
    const sorters = { score: E.byDeal, save: fixedFirst((a, b) => (b.under ?? -1e9) - (a.under ?? -1e9)), price: fixedFirst((a, b) => a.total - b.total), ending: E.byEnding, fresh: (a, b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0) };
    items = [...items].sort(sorters[s.sort] || sorters.score);
    const hasRefurb = r.items.some((x) => x.cond === "refurb") || s.cond === "refurb", nAuc = r.items.filter((x) => x.auction).length;
    const rejN = r.rejected.length, total = r.items.length + rejN;
    const reasons = Object.entries(r.reasons).sort((a, b) => b[1] - a[1]);
    const marketCard = st ? `<div class="card market">
        <div class="row"><span class="tagline">${COND_NAME[g]} – so viel kostet’s</span><span class="spacer"></span>${s.raw.demo ? '<span class="pill demo">Beispieldaten</span>' : s.raw.cached ? `<span class="pill" title="Zwischengespeichert">${ago(s.raw.fetched_at)}</span>` : '<span class="pill">live</span>'}</div>
        ${ampel(st)}
        <div class="msub">Mitte aus <b>${st.n}</b> Sofort-Kaufen-Angebot${st.n === 1 ? "" : "en"}${h?.since ? ` · ${hDays >= 3 && hN ? `${hN} Preise` : "Preise"} beobachtet seit ${dayShort(h.since)}` : ""}</div>
        ${others.length ? `<div class="aother">${others.join(" · ")}</div>` : ""}
        <div class="filterbar"><span><b>${r.items.length}</b> von ${total} zählen${rejN ? ". Rausgeflogen:" : "."}</span>${reasons.slice(0, 4).map(([k, v]) => `<span class="rej">${esc(k)} · ${v}</span>`).join("")}</div>
        <div class="row wrapf" style="margin-top:12px;gap:10px"><a class="btn sm" href="${E.ebaySoldUrl(s.evalQ)}" target="_blank" rel="noopener">${I.hist}Was wirklich verkauft wurde</a><button class="btn sm ghost" data-act="watchFromSearch">${I.bell}Auf die Lauer legen</button></div>
      </div>` : "";
    const top = items.find((x) => !x.auction);
    const condSeg = [["alle", "Alle"], ["neu", "Neu"], ["gebraucht", "Gebraucht"], ...(hasRefurb ? [["refurb", "Generalüberholt"]] : [])];
    const buySeg = [["alle", "Alle"], ["sofort", "Sofort-Kaufen"], ["auktion", `Auktion${nAuc ? ` (${nAuc})` : ""}`]];
    return `${marketCard}
      ${top && top.score >= 65 ? `<a class="pick" href="#/item/${encodeURIComponent(top.itemId)}"><span class="pickcall">${top.score >= 80 ? "Das da." : "Guck mal."}</span><span>${esc(top.title)} für <b>${eur2(top.total)}</b> – <b>${eur(saveOf(top.total, marketOf(top)))}</b> unter Marktpreis.</span></a>` : ""}
      <div class="filters" id="filters">
        <div class="frow"><span class="flbl">Zustand</span><div class="seg wide" role="group" aria-label="Zustand">${condSeg.map(([k, l]) => `<button class="${s.cond === k ? "on" : ""}" data-act="cond" data-v="${k}" aria-pressed="${s.cond === k}">${l}</button>`).join("")}</div></div>
        <div class="frow"><span class="flbl">Kaufart</span><div class="seg wide" role="group" aria-label="Angebotsformat">${buySeg.map(([k, l]) => `<button class="${s.buy === k ? "on" : ""}" data-act="buy" data-v="${k}" aria-pressed="${s.buy === k}">${l}</button>`).join("")}</div></div>
        <div class="frow"><span class="flbl">Zuerst</span><select id="sort" aria-label="Sortierung">${[["score", "die besten Deals"], ["save", "größte Ersparnis"], ["price", "die billigsten"], ["ending", "endet bald"], ["fresh", "frisch reingekommen"]].map(([k, l]) => `<option value="${k}" ${s.sort === k ? "selected" : ""}>${l}</option>`).join("")}</select><span class="spacer"></span><span class="small dim" id="fcount">${s.fLoading ? "lädt …" : `${items.length} Stück`}</span></div>
      </div>
      ${s.cond === "neu" ? `<div class="tiny dim" style="margin:-2px 0 8px">Nur was eBay als neu führt (Neu, Neu: Sonstige). Klingt der Titel nach benutzt – Akku unter 100 %, „ausgepackt“, „2 Monate alt“ –, landet es bei Gebraucht mit „Neu laut Verkäufer?“.</div>` : ""}
      ${s.buy === "auktion" ? `<div class="tiny dim" style="margin:-2px 0 8px">Bei Auktionen ist das Gebot jetzt nicht der Endpreis. „Günstig bis max.“ heißt: Marktpreis minus ${opts().aucDiscount} %, ohne Versand. Drüber ist’s kein Schnäppchen mehr.</div>` : ""}
      <div id="list">${s.fLoading ? skeleton() : items.map((x, i) => itemCard(x, i)).join("") || `<p class="empty-line">Mit dem Filter bleibt nichts übrig. Mach ihn mal lockerer.</p>`}</div>
      ${rejN ? `<button class="btn block ghost" style="margin-top:14px" data-act="rej">${s.showRej ? "Aussortierte wieder weg" : `Zeig mir die ${rejN} aussortierten`}</button>` : ""}
      ${s.showRej ? `<div style="margin-top:10px">${r.rejected.map((x) => `<div class="item rejected"><div class="thumb">${thumb(x.image)}</div><div><div class="t">${esc(x.title)}</div><div class="meta"><span class="rej">${esc(x.rel.reason)}</span> · ${eur2(x.total)}</div></div></div>`).join("")}</div>` : ""}
      <p class="foot-note">Alle Preise mit Versand. Ersparnis heißt: Marktpreis (Median vergleichbarer Sofort-Kaufen-Angebote) minus Angebotspreis. Ohne Gewähr – geschätzt ist geschätzt.</p>`;
  }

  function itemCard(x, i = 0) {
    if (x.auction) return auctionCard(x, i);
    const sub = [x.condLabel, x.location].filter(Boolean).join(" · ");
    const stamp = x.under < -BAD_PCT ? '<span class="stamp bad">Lass liegen</span>' : x.score >= 80 ? '<span class="stamp">Heiß!</span>' : "";
    return `<a class="item ${x.score >= 80 ? "top" : ""} ${x.under < 0 ? "over" : ""}" href="#/item/${encodeURIComponent(x.itemId)}" style="animation-delay:${Math.min(i, 12) * 45}ms" data-buy="sofort">${stamp}
      <div class="thumb">${thumb(x.image)}</div>
      <div style="min-width:0"><div class="t">${esc(x.title)}</div>
        <div class="p"><b class="num">${eur2(x.total)}</b><span class="under ${x.under < 0 ? "over" : ""}">${x.under >= 0 ? "−" : "+"}${Math.abs(Math.round(x.under))} %</span>${saveOf(x.total, marketOf(x)) >= 1 ? `<span class="small pos">spart ${eur(saveOf(x.total, marketOf(x)))}</span>` : ""}</div>
        <div class="meta">${esc(sub)}</div>
        <div class="badges">${badgeHtml(cardBadges(x), 4)}</div>
        ${miniAmpel(x)}
      </div>
      <div>${ring(x.score)}</div></a>`;
  }
  function miniAmpel(x) {
    const mk = S.search.res?.market, st = mk && (mk[x.cond] || (x.cond === "refurb" && mk.gebraucht) || mk.alle);
    if (!st) return "";
    const call = rankCall(rankOf(x.total, x.cond, x.itemId), true) || ZONE_CALL[zoneOf(x.total, st)].replace(".", "");
    return `<div class="amini">${ampel(st, { v: x.total, mini: true })}<span class="acall z${zoneOf(x.total, st)}">${call}</span></div>`;
  }
  // Format-Badge (Sofort-Kaufen/Auktion) immer zuerst, Zustandshinweise danach
  const BORDER = { bin: 0, auction: 0, offer: 1, warn: 2, info: 3 };
  const cardBadges = (x) => x.badges.filter((b) => b.k !== "under" && b.k !== "top").map((b, i) => [b, BORDER[b.k] ?? 4, i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((a) => a[0]);
  // Auktion: aktuelles Gebot, Gebote, Restzeit, Marktpreis, „Günstig bis max.“ – keine Ersparnis/−X % auf Basis des Zwischengebots
  function auctionCard(x, i = 0) {
    const over = x.room < 0;
    return `<a class="item auc ${x.endingSoon && !over ? "soon" : ""}" href="#/item/${encodeURIComponent(x.itemId)}" style="animation-delay:${Math.min(i, 12) * 45}ms" data-buy="auktion">
      <div class="thumb">${thumb(x.image)}</div>
      <div style="min-width:0"><div class="t">${esc(x.title)}</div>
        <div class="p"><span class="small muted">Aktuelles Gebot</span> <b class="num">${eur2(x.bid)}</b></div>
        <div class="meta">${esc(x.condLabel)} · ${gebote(x.bids)} · ${x.endDate ? `endet ${esc(until(x.endDate).replace(/^noch /, "in "))}` : "Ende unbekannt"}${x.shipping ? ` · + ${eur2(x.shipping)} Versand` : " · Versand frei"}</div>
        <div class="aucline"><span>Marktpreis ca. <b class="num">${eur(x.market)}</b></span><span class="${over ? "neg" : "pos"}">Günstig bis max. <b class="num">${eur(x.guenstigBis)}</b></span></div>
        <div class="badges">${badgeHtml(cardBadges(x), 4)}</div>
      </div>
      <div>${x.score != null ? `${ring(x.score)}` : `<div class="ring na" title="Score gibt’s erst in der letzten Stunde">–</div><div class="lbl">läuft noch</div>`}</div></a>`;
  }

  // ---------- Detail (Angebot aus der Suche oder geteilter Deal) ----------
  // Ansagen statt Etiketten: so würde es einer am Flohmarktstand sagen
  const verdictOf = (s) => (s >= 80 ? "Das ist ein Ding." : s >= 65 ? "Gut. Kannst du machen." : s >= 45 ? "Fair. Kein Knaller." : "Kaum billiger. Warte lieber.");
  const AUC_CALL = { "Gebot schon über „Günstig bis“": "Schon zu hoch. Lass laufen.", "Auktion endet bald – mitbieten?": "Gleich vorbei. Mitbieten?", "Auktion – beobachten": "Läuft noch. Erst mal zuschauen." };
  function vmFromItem(x) {
    const r = S.search.res, st = r.market[x.cond] || (x.cond === "refurb" && r.market.gebraucht) || r.market.alle;
    return { kind: "item", itemId: x.itemId, query: S.search.evalQ, title: x.title, image: x.image, url: x.url, total: x.total, cond: x.cond, condLabel: x.condLabel, st, market: st.median,
      score: x.score, marketX: x.market, under: x.under, verdict: x.verdict, badges: x.badges, endDate: x.endDate, auction: !!x.auction, auctionOpen: x.auctionOpen, endingSoon: x.endingSoon, guenstigBis: x.guenstigBis, bid: x.bid, room: x.room, bids: x.bids, shipping: x.shipping, sellerNew: x.sellerNew,
      bestOffer: x.bestOffer, seller: x.seller, fb: x.sellerFeedbackPct, fbN: x.sellerFeedbackScore, location: x.location, demo: x.demo, confidence: x.confidence, flags: x.rel?.flags || [] };
  }
  function vmFromDeal(d) {
    const m = d.market || d.total;
    return { kind: "deal", dealId: d.id, itemId: d.item_id, query: d.query, title: d.title, image: d.image, url: d.url, total: d.total, cond: d.condition, condLabel: E.COND_LABEL[d.condition],
      st: { median: m, p10: m * 0.78, p90: m * 1.2, min: m * 0.7, max: m * 1.3, n: null }, market: m, score: d.score, under: d.under_pct, verdict: verdictOf(d.score || 0),
      badges: [], endDate: d.ends_at, auction: !!d.ends_at, shared: d, demo: String(d.image || "").startsWith("demo:") };
  }

  const buyVerdict = (s, sv, under) => (sv <= 0 ? (under != null && under >= -BAD_PCT ? "Etwas drüber. Warte lieber." : "Zu teuer. Lass liegen.") : verdictOf(s));
  // Statt Tacho: ein Stempel mit der Zahl. Rot = heiß, Tinte = okay, grau = lahm.
  function gauge(score, label = "Deal-Score") {
    const s = Math.max(0, Math.min(100, score || 0)), tone = s >= 80 ? "hot" : s >= 45 ? "ok" : "meh";
    return `<div class="gauge ${tone}" role="img" aria-label="${label} ${s} von 100"><span class="gn num" data-count="${s}">0</span><span class="gof">von 100</span></div>`;
  }

  // Detail: die Ampel mit dem Angebot als Preisschild + kurze Ansage, womit verglichen wurde
  function detailAmpel(vm) {
    const st = vm.st, cond = COND_NAME[rankGroup(vm.cond, S.search.res?.market || {}) || vm.cond] || "";
    if (vm.auction) return `<div class="acall big">Auktion: Erst der Endpreis zählt.</div>${ampel(st)}<div class="anote">${cond ? cond + " · " : ""}Mitte aus den Sofort-Kaufen-Angeboten. Jetzt steht das Gebot mit Versand bei ${eur2(vm.total)}.</div>`;
    const z = zoneOf(vm.total, st), r = vm.kind === "item" ? rankOf(vm.total, vm.cond, vm.itemId) : null;
    const note = vm.kind === "item" ? histNote(r) : "Mitte zum Zeitpunkt, als der Deal geteilt wurde";
    return `<div class="acall big z${z}">${rankCall(r) || ZONE_CALL[z]}</div>${ampel(st, { v: vm.total })}<div class="anote">${cond ? cond + " · " : ""}${note}</div>`;
  }

  // Wissens-Beiträge: nur „hilfreich“ (keine Flammen, kein kalt)
  const helpBtn = (p, big = false) => `<button class="help ${big ? "big" : ""} ${p.my_vote === 1 ? "on" : ""}" data-act="vote" data-kind="post" data-v="1" data-id="${esc(p.id)}" aria-pressed="${p.my_vote === 1}" aria-label="Hilfreich">👍 <span class="num">${p.hot || 0}</span>${big ? " hilfreich" : ""}</button>`;

  let VM = null;
  async function viewDetail(vm) {
    VM = vm;
    const o = opts(), conf = vm.confidence;
    const meta = [vm.condLabel, vm.auction && vm.endDate ? `${gebote(vm.bids)} · ${until(vm.endDate)}` : null, vm.location, vm.seller ? `${vm.seller}${vm.fb ? ` (${String(vm.fb).replace(".", ",")} %, ${vm.fbN})` : ""}` : null].filter(Boolean).join(" · ");
    const sv = saveOf(vm.total, vm.market), svPct = vm.market > 0 ? (sv / vm.market) * 100 : 0;
    const marketBid = Math.max(0, vm.market - (vm.shipping || 0));
    const offerTip = vm.bestOffer ? `<div class="tip vio">${I.tag}<div><b>VB geht.</b> Biete mal ${eur(vm.total * 0.85)}. Mehr als Nein sagen kann der Verkäufer nicht.</div></div>` : "";
    const guenstig = vm.guenstigBis ?? Math.max(0, vm.market * (1 - o.aucDiscount / 100) - (vm.shipping || 0));
    const auctionTip = vm.auction ? `<div class="tip warn">${I.info}<div><b>${vm.auctionOpen ? "Läuft noch." : "Gleich vorbei."}</b> Das Gebot jetzt ist nicht der Endpreis – da kommt meist noch was drauf. Bis <b>${eur(guenstig)}</b> Gebot (plus ${eur2(vm.shipping || 0)} Versand) ist’s ein guter Kauf. Ab ca. ${eur(marketBid)} zahlst du drauf.</div></div>` : "";
    const aucCard = vm.auction ? `<div class="card savecard auccard ${vm.room < 0 ? "over" : ""}" id="auccard"><div class="kicker">Auktion · ${esc(vm.condLabel || "")}</div>
        <div class="aucgrid"><div><div class="s">Aktuelles Gebot</div><div class="v num">${eur2(vm.bid ?? vm.total - (vm.shipping || 0))}</div><div class="tiny dim">${gebote(vm.bids)} · ${vm.endDate ? `endet ${esc(until(vm.endDate).replace(/^noch /, "in "))}` : "Ende unbekannt"}</div></div>
        <div><div class="s">Marktpreis ca.</div><div class="v num">${eur(vm.market)}</div><div class="tiny dim">Median Sofort-Kaufen${vm.st.n ? ` (${vm.st.n})` : ""}</div></div>
        <div><div class="s">Günstig bis max.</div><div class="v num ${vm.room < 0 ? "neg" : "pos"}">${eur(guenstig)}</div><div class="tiny dim">Gebot, ohne ${eur2(vm.shipping || 0)} Versand</div></div></div>
        <div class="small muted" style="margin-top:10px">${vm.room < 0 ? "Schon drüber. Mit Versand ist das kein Schnäppchen mehr." : `Bleibst du bis dahin, liegst du mit Versand mindestens ${o.aucDiscount} % unter Marktpreis.`} Was du sparst, sagen wir erst beim Endpreis – Zwischengebote steigen fast immer.</div></div>` : "";
    const saveCard = sv > 0 ? `<div class="card savecard" id="savecard"><div class="kicker">Ersparnis gegenüber Marktpreis</div>
        <div class="saverow"><div class="savebig num" data-count="${sv}" data-fmt="eur">${eur(sv)}</div><span class="under big">−${Math.round(svPct)} %</span></div>
        <div class="pricetag"><s>ca. ${eur(vm.market)}</s><b class="num">${eur2(vm.total)}</b></div>
        <div class="small muted">Du zahlst ${eur2(vm.total)} mit Versand. Der Marktpreis ist der Median${vm.st.n ? ` aus ${vm.st.n} vergleichbaren Sofort-Kaufen-Angeboten` : ""}.</div></div>`
      : `<div class="card savecard over" id="savecard"><div class="kicker">Ersparnis gegenüber Marktpreis: keine</div>
        <div class="saverow"><div class="savebig num over">+${eur(-sv)}</div><span class="under big over">+${Math.round(-svPct)} %</span></div>
        <div class="small muted">Hier zahlst du drauf. Marktpreis sind ca. ${eur(vm.market)}. Lass liegen – oder leg dich auf die Lauer, bis es billiger wird.</div></div>`;
    mount(`<button class="back" data-act="back">${I.back} zurück</button>
      <div class="dhero"><div class="thumb">${thumb(vm.image)}</div><div><h1>${esc(vm.title)}</h1><div class="small muted" style="margin-top:6px">${esc(meta)}</div>${vm.demo ? '<div style="margin-top:8px"><span class="pill demo">Beispieldaten</span></div>' : ""}</div></div>
      ${vm.auction ? aucCard : saveCard}
      ${vm.auction && vm.score == null ? `<p class="note" style="margin-top:12px"><b>Noch kein Score.</b> Bei Auktionen sag ich erst in der letzten Stunde was – vorher ist das Gebot Kaffeesatz. Leg dich auf die Lauer, dann melde ich mich kurz vor Schluss, wenn’s unter „Günstig bis“ liegt.</p>` : `
      <div class="card gaugecard" style="margin-top:12px"><div class="kicker">Deal-Score</div>${vm.auction ? '<div class="tiny dim">beim aktuellen Gebot</div>' : ""}${gauge(vm.score, "Deal-Score")}
        <div class="gverdict">${esc(vm.auction ? AUC_CALL[vm.verdict] || vm.verdict : buyVerdict(vm.score, sv, vm.under))}</div>
        <div class="gsub">${vm.under != null ? `${vm.under >= 0 ? Math.round(vm.under) + " % unter" : Math.round(-vm.under) + " % über"} Marktpreis` : ""}${conf != null ? ` · Datenbasis ${conf >= 0.9 ? "solide" : conf >= 0.6 ? "mittel" : "dünn"}${vm.st.n ? ` (${vm.st.n} Vergleiche)` : ""}` : ""}</div></div>`}
      <div class="bon slim" style="margin-top:12px"><div class="bl"><span>${vm.auction ? "Gebot + Versand, jetzt" : "Du zahlst, mit Versand"}</span><i></i><b class="num">${eur2(vm.total)}</b></div><div class="bl"><span>Marktpreis (Median)</span><i></i><b class="num">${eur(vm.market)}</b></div><div class="bl sum"><span>${vm.total <= vm.market ? "Bleibt bei dir" : "Zahlst du drauf"}</span><i></i><b class="num">${eur(Math.abs(vm.market - vm.total))}</b></div></div>
      ${vm.badges.length ? `<div class="badges" style="margin-top:12px">${badgeHtml(vm.badges)}</div>` : ""}
      <div class="sec hand"><h2>Wo das Angebot liegt</h2></div><div class="card ampcard">${detailAmpel(vm)}</div>
      ${offerTip || auctionTip || vm.flags?.length ? `<div class="stack" style="margin-top:12px">${offerTip}${auctionTip}${vm.flags?.length ? `<div class="tip warn">${I.info}<div>Schau genau hin: ${esc(vm.flags.join(", "))}.</div></div>` : ""}</div>` : ""}
      <div class="actions"><a class="btn pri" href="${esc(safeUrl(vm.url))}" target="_blank" rel="noopener sponsored">Ab zu eBay ${I.ext}</a>
        <a class="btn" href="${E.ebaySoldUrl(vm.query)}" target="_blank" rel="noopener">${I.hist}Verkaufte ansehen</a>
        <button class="btn" data-act="toInv">${I.box}Gekauft – in Bestand</button>
        <button class="btn" data-act="share" id="sharebtn">${I.share}Teilen</button>
        <button class="btn" data-act="watchFromDeal">${I.bell}Lauern</button>
        ${S.features?.ai ? `<button class="btn vio" data-act="aiCheck" id="aibtn" disabled>${I.spark}KI-Check (Demo)</button>` : ""}</div>
      ${S.features?.ai ? '<div id="aires"></div>' : ""}
      ${affNote()}
      <div class="sec hand"><h2>Was die Leute sagen</h2></div><div id="comm" class="card"><div class="sk" style="height:80px"></div></div>
      <div class="sec hand"><h2>Dafür ging’s weg</h2><span class="spacer"></span><button class="btn sm ghost" data-act="flipForm">${I.plus}Verkauf eintragen</button></div>
      <div class="card" id="soldbox"><div class="sk" style="height:60px"></div></div>
      ${vm.demo ? "" : `<p class="foot-note">Daten kommen über die offizielle eBay-Schnittstelle. Hotflip gehört nicht zu eBay.</p>`}`, route());
    loadDealCommunity(vm);
    loadSoldBox(vm);
    if (S.features?.ai) aiDetailState();
  }

  // ---------- KI-Kontingent (DEMO: keine echte KI, keine echte Zahlung) ----------
  const ct2eur = (ct) => eur(+ct / 100, 2);
  const tok = (n) => new Intl.NumberFormat("de-DE").format(n || 0);
  async function aiLoad() { try { S.ai = await S.be.aiStatus(); } catch (e) { console.warn(e); S.ai = null; } return S.ai; }
  async function aiDetailState() {
    const st = await aiLoad(), b = $("#aibtn"), box = $("#aires"); if (!b || !box) return;
    if (!st?.enabled) { b.remove(); return; }
    const v = E.AI.view(st.wallet);
    b.disabled = !v.active || v.empty;
    if (!v.active) box.innerHTML = `<div class="tip vio aihint" style="margin-top:12px">${I.spark}<div><b>KI-Check gibt’s mit Hotflip Pro (Demo).</b> Buch das Testguthaben und probier die Platzhalter-Analyse aus. <a href="#" data-act="aiOpen">Pro ansehen</a></div></div>`;
    else if (v.empty) box.innerHTML = `<div class="tip warn aihint" style="margin-top:12px">${I.info}<div><b>Guthaben leer.</b> Bis zur Aufladung am ${dateDE(v.next_refill_at)} ist Pause. <a href="#" data-act="aiOpen">Nachbuchen (Demo)</a></div></div>`;
    else if (!box.querySelector(".aicard")) box.innerHTML = `<p class="tiny dim" style="margin-top:8px">KI-Check (Demo): noch ${ct2eur(v.rest_ct)} Guthaben, ca. ${v.approx} Analysen. Antworten sind simuliert.</p>`;
  }
  function aiResultCard(r) {
    const x = r.result, u = r.usage, col = { Zugreifen: "var(--tx)", Prüfen: "var(--warn)", Vorsicht: "var(--bad)", "Eher nicht": "var(--bad)" }[x.verdict] || "inherit";
    return `<div class="card aicard" style="margin-top:12px"><div class="row" style="gap:8px">${I.spark}<b>KI-Check</b><span class="pill demo">Demo – simuliert</span><span class="spacer"></span><b style="color:${col}">${esc(x.verdict)}</b></div>
      <div class="small" style="margin-top:10px"><div class="muted">Produkt</div>${esc(x.product)}</div>
      <div class="small" style="margin-top:8px"><div class="muted">Fallen-Check</div><ul style="margin:4px 0 0 18px;padding:0">${x.risks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>
      <div class="small" style="margin-top:8px"><div class="muted">Preis-Check</div>${esc(x.price || "")}</div>
      <div class="tiny dim" style="margin-top:10px">${tok(u.tokens_in)} Tokens rein · ${tok(u.tokens_out)} raus · ${ct2eur(u.cost_ct / 1)} (${String(u.cost_ct).replace(".", ",")} ct) abgebucht · ${ct2eur(u.reserved_ct)} waren reserviert. ${esc(x.note)}</div></div>`;
  }
  function aiUsageList(list) {
    if (!list?.length) return '<p class="small muted" style="margin:6px 0 0">Noch nichts verbraucht.</p>';
    return `<div class="ailist">${list.slice(0, 12).map((u) => u.kind === "deal_check"
      ? `<div class="airow"><div><b class="small">${esc(String(u.title || "KI-Check").slice(0, 46))}</b><div class="tiny dim">${dateDE(u.created_at)} ${new Date(u.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} · ${tok(u.tokens_in)} / ${tok(u.tokens_out)} Tokens</div></div><span class="num small">−${String(Math.round(+u.cost_ct * 100) / 100).replace(".", ",")} ct</span></div>`
      : `<div class="airow"><div><b class="small">${u.kind === "book" ? "Pro gebucht (Demo)" : u.kind === "pack" ? "Nachgebucht (Demo)" : "Aufladung"}</b><div class="tiny dim">${dateDE(u.created_at)} · ohne Zahlung</div></div><span class="num small pos">+${ct2eur(u.cost_ct)}</span></div>`).join("")}</div>`;
  }
  async function renderAiProfile(box) {
    if (!box) return;
    const st = await aiLoad(); if (!box.isConnected) return;
    if (!st) { box.innerHTML = '<p class="small muted">Das Guthaben antwortet gerade nicht. Gleich nochmal.</p>'; return; }
    if (!st.enabled) { box.innerHTML = '<p class="small muted">KI-Funktionen sind gerade abgeschaltet.</p>'; return; }
    const P = st.plan, v = E.AI.view(st.wallet);
    const keyField = `<label class="f" style="margin:14px 0 0"><span>Eigener KI-Schlüssel <span class="pill">bald verfügbar</span></span><input class="in1" disabled placeholder="Kommt später – wird nicht gespeichert" aria-disabled="true"></label>`;
    const abo = `<div class="card aiabo"><div class="row" style="gap:8px">${I.spark}<b>${esc(P.name)}</b><span class="spacer"></span><b class="num">${eur(P.price_eur, 2)}</b><span class="small muted">/Monat</span></div>
      <ul class="small" style="margin:10px 0 10px 18px;padding:0;line-height:1.6"><li>KI-Check bei jedem Deal: Produkt erkennen, Fallen finden, Preis-Check</li><li>${ct2eur(P.budget_ct)} KI-Budget pro Monat, ca. ${Math.floor(P.budget_ct / st.typical_ct)} Analysen</li><li>Abgerechnet wird nur, was eine Analyse wirklich verbraucht</li></ul>
      <div class="tip warn" style="margin-bottom:10px">${I.info}<div><b>Demo – noch keine echte Buchung.</b> Es wird nichts bezahlt, und die KI-Antworten sind simuliert.</div></div>
      <button class="btn vio block" data-act="aiBook">${I.spark}Buchen (Demo)</button></div>`;
    const bal = v.active ? `<div class="card aibal ${v.empty ? "empty" : ""}"><div class="row" style="gap:8px">${I.spark}<b>KI-Guthaben</b><span class="pill demo">${esc(P.name)} · Demo</span></div>
      <div class="row" style="margin-top:12px;align-items:baseline"><b class="num" style="font-size:24px">${ct2eur(v.rest_ct)}</b><span class="small muted">&nbsp;von ${ct2eur(v.budget_ct)} übrig</span><span class="spacer"></span><span class="small ${v.empty ? "neg" : "muted"}">${v.empty ? "leer" : `ca. ${v.approx} Analysen`}</span></div>
      <div class="aibar"><i data-w="${v.pct.toFixed(1)}%" style="width:0"></i></div>
      <div class="tiny dim" style="margin-top:6px">Nächste Aufladung am ${dateDE(v.next_refill_at)} · verbraucht ${String(Math.round(v.used_ct * 100) / 100).replace(".", ",")} ct · Demo-Preis ${String(st.price.in_ct_per_1k).replace(".", ",")} ct / 1.000 Tokens rein, ${String(st.price.out_ct_per_1k).replace(".", ",")} ct raus</div>
      ${v.empty ? `<div class="tip warn" style="margin-top:10px">${I.info}<div><b>Guthaben aufgebraucht.</b> KI-Check ist gesperrt, alles andere läuft normal weiter.</div></div>` : ""}
      <button class="btn sm ${v.empty ? "vio" : ""}" style="margin-top:10px" data-act="aiBook">${I.plus}Nachbuchen (Demo, +${ct2eur(P.pack_ct)})</button>
      <div class="kicker" style="margin:16px 0 4px">Verbrauch</div>${aiUsageList(st.usage)}${keyField}
      <p class="tiny dim" style="margin-top:10px">Demo: keine echte KI, keine echte Zahlung. Jede Analyse reserviert vorher ${ct2eur(st.max_ct)} und bucht danach nur die tatsächlichen (simulierten) Kosten ab.</p></div>` : abo + `<div style="margin-top:4px">${keyField}</div>`;
    box.innerHTML = bal; animate(box);
  }
  function aiSheet() { sheet(`<h2>KI-Guthaben</h2><div id="aiprof2"><div class="sk" style="height:140px"></div></div>`, (sh) => renderAiProfile(sh.querySelector("#aiprof2"))); }

  async function loadDealCommunity(vm) {
    const box = $("#comm"); if (!box) return;
    try {
      const id = vm.dealId || (await S.be.dealByItem(vm.itemId));
      const key = E.productKey(vm.query), sales = await S.be.soldFor(key).catch(() => []);
      if (!id && vm.auction) {
        box.innerHTML = `<div class="tip warn">${I.flame}<div><b>Keine Flammen für laufende Auktionen.</b> Flammen vergleichen einen festen Preis mit echten Verkäufen – ein Zwischengebot ist kein Preis. Merk dir: günstig bis max. <b>${eur(vm.guenstigBis ?? 0)}</b>.</div></div><button class="btn vio block" style="margin-top:12px" data-act="share">${I.share}Mit der Community teilen</button>`; return;
      }
      if (!id) {
        const f = E.saleFlames(vm.total, vm.cond, sales, { exclude: S.me?.id });
        box.innerHTML = `${flamePanel(f, sales, vm.total, vm.cond, S.me?.id)}<div class="row" style="align-items:flex-start;margin-top:12px">${I.users.replace("<svg", '<svg width="22" height="22" style="flex:none;color:var(--red)"')}<div><b>Hat noch keiner geteilt.</b><div class="small muted" style="margin-top:3px">Zeig’s den anderen. Dann reden die Leute mit, und die Flammen kommen aus ihren echten Verkäufen.</div></div></div><button class="btn vio block" style="margin-top:12px" data-act="share">${I.share}Mit der Community teilen</button>`; return;
      }
      vm.dealId = id; $("#sharebtn")?.setAttribute("disabled", "");
      const d = await S.be.deal(id); if (!d) return;
      vm.shared = d;
      const fs = d.product_key && d.product_key !== key ? await S.be.soldFor(d.product_key).catch(() => []) : sales;
      const f = d.ends_at ? { members: 0, sales: 0, days: E.FLAME_WINDOW_DAYS, auction: true } : E.saleFlames(d.total, d.condition, fs, { exclude: d.shared_by });
      box.innerHTML = `${flamePanel(f, fs, d.total, d.condition, d.shared_by)}
        <div class="small muted" style="margin:12px 0 4px">Geteilt von <b>${esc(d.shared_by_name || "Ehemaliges Mitglied")}</b> · ${ago(d.created_at)}${d.note ? ` – „${esc(d.note)}“` : ""}</div>
        <div class="row" style="justify-content:flex-end;margin:-2px 0 4px">${flagBtn("deal", d.id)}</div>
        <div id="cmts" style="margin-top:6px">${d.commentList.map((c) => `<div class="cmt">${avatar(c.author)}<div><div class="h"><b>${esc(c.author)}</b>${ago(c.created_at)}${c.mine ? ` · <a href="#" data-act="cdel" data-id="${esc(c.id)}">löschen</a>` : ` · ${flagBtn("comment", c.id, true)}`}</div><p>${esc(c.body)}</p></div></div>`).join("") || '<div class="small dim">Noch still hier. Sag du was.</div>'}</div>
        <form id="cf" class="row" style="margin-top:12px"><input class="in1" name="c" maxlength="600" placeholder="Deine Meinung dazu …" aria-label="Kommentar"><button class="btn pri" style="min-height:46px">Senden</button></form>`;
      $("#cf").onsubmit = async (e) => { e.preventDefault(); const v = e.target.c.value.trim(); if (!v) return; try { await S.be.comment({ deal_id: id }, v); loadDealCommunity(vm); } catch (er) { fail(er); } };
    } catch (e) { box.innerHTML = `<div class="small muted">${esc(e.message)}</div>`; }
  }

  async function loadSoldBox(vm) {
    const box = $("#soldbox"); if (!box) return;
    try {
      const rows = await S.be.soldFor(E.productKey(vm.query));
      const same = rows.filter((r) => r.condition === vm.cond);
      const med = same.length ? E.median(same.map((r) => +r.price)) : null;
      box.innerHTML = `${med ? `<div class="row" style="margin-bottom:8px"><div><div class="small muted">Leute hier haben ${E.COND_LABEL[vm.cond]?.toLowerCase() || vm.cond} im Schnitt bekommen</div><div class="hprice num">${eur(med)}</div></div><span class="spacer"></span><span class="pill">${same.length} Meldungen</span></div>` : ""}
        ${rows.slice(0, 5).map((r) => `<div class="soldrow"><div><b class="num">${eur2(+r.price)}</b> <span class="small muted">${esc(E.COND_LABEL[r.condition])} · ${esc(r.platform)}</span></div><div class="small dim">${dateDE(r.sold_at)}</div><div class="tiny dim">${esc(r.user_name || "")}</div></div>`).join("") || '<div class="small muted">Hat noch keiner eingetragen. Du hast so eins verkauft? Trag’s ein – dann wissen alle, was es wirklich bringt.</div>'}`;
    } catch (e) { box.innerHTML = `<div class="small muted">${esc(e.message)}</div>`; }
  }

  // ---------- Community ----------
  // ---------- Flammen (rollierendes Fenster E.FLAME_WINDOW_DAYS) ----------
  // 🔥 je Mitglied, das dasselbe Produkt in den letzten 30 Tagen TEURER verkauft hat als hier angeboten. Eigene Verkäufe zählen nicht für eigene Posts.
  const flameText = (f, what = "das", price = null) => !f?.members ? `In den letzten ${f?.days || E.FLAME_WINDOW_DAYS} Tagen hat noch niemand ${what} teurer verkauft${price != null ? " als hier" : ""}` : `${f.members === 1 ? "1 Nutzer hat" : f.members + " Nutzer haben"} ${what} in den letzten ${f.days} Tagen teurer verkauft${price != null ? ` als hier (${eur2(price)})` : ""} → echtes Schnäppchen`;
  const restockKey = (r) => r.product_key || E.productKey(r.title);
  async function attachFlames(rows, keyOf, priceOf, condOf, byOf) {
    try {
      const sales = await S.be.recentSales([...new Set(rows.map(keyOf).filter(Boolean))]);
      const by = {}; for (const x of sales) (by[x.product_key] ||= []).push(x);
      for (const r of rows) r.flames = E.saleFlames(priceOf(r), condOf(r), by[keyOf(r)] || [], { exclude: byOf(r) });
    } catch { for (const r of rows) r.flames = { members: 0, sales: 0, days: E.FLAME_WINDOW_DAYS }; }
    return rows;
  }
  const withFlames = (deals) => attachFlames(deals, (d) => d.product_key, (d) => (d.ends_at ? Infinity : d.total), (d) => d.condition, (d) => d.shared_by); // Auktion: keine Flammen aus Zwischengebot
  const withRestockFlames = (rows) => attachFlames(rows, restockKey, (r) => r.price, () => "neu", (r) => r.posted_by);
  const byFlames = (a, b) => (b.flames?.members || 0) - (a.flames?.members || 0) || String(b.created_at).localeCompare(String(a.created_at));
  const flameChip = (f, what) => `<span class="temp ${f?.members ? "h" : "n"}" title="${esc(flameText(f, what))}" aria-label="${esc(flameText(f, what))}">${I.flame}${f?.members || 0}</span>`;
  // Detail-Panel: große Flammenzahl + die höheren Verkäufe, auf denen sie beruht
  function flamePanel(f, sales, price, cond, exclude, what = "das") {
    const since = E.flameSince(), hi = (sales || []).filter((x) => String(x.sold_at).slice(0, 10) >= since && (!cond || x.condition === cond) && +x.price > +price && x.user_id !== exclude).slice(0, 4);
    return `<div class="flames ${f.members ? "on" : ""}"><div class="fl-n">${I.flame}<b class="num">${f.members}</b></div>
      <div style="min-width:0"><div class="fl-t">${esc(flameText(f, what, price))}</div>
        ${hi.length ? `<div class="fl-l">${hi.map((x) => `<span>${eur(+x.price)} · ${esc(x.platform)} · ${dateDE(x.sold_at)}</span>`).join("")}</div>` : `<div class="small dim" style="margin-top:3px">Je mehr Leute ihre Verkäufe eintragen, desto ehrlicher wird das hier.</div>`}
        <a href="#" class="small" data-act="flameInfo">Flammen? Kurz erklärt</a></div></div>`;
  }

  function dealCard(d, i = 0) {
    return `<div class="deal" data-act="openDeal" data-id="${esc(d.id)}" style="animation-delay:${Math.min(i, 10) * 45}ms"><div class="thumb">${thumb(d.image)}</div>
      <div style="min-width:0"><div class="row" style="align-items:flex-start"><div class="t">${esc(d.title)}</div>${flameChip(d.flames)}</div>
        <div class="row" style="margin-top:5px;gap:8px">${d.ends_at ? `<span class="bdg auction">Auktion</span><span class="small muted">Gebot</span> <b class="num dp">${eur2(d.total)}</b><span class="small muted">${esc(until(d.ends_at))}</span>` : `<span class="bdg bin">Sofort-Kaufen</span><b class="num dp">${eur2(d.total)}</b>`}${d.ends_at ? "" : d.under_pct != null ? `<span class="under ${d.under_pct < 0 ? "over" : ""}">−${Math.round(d.under_pct)} %</span>` : ""}${!d.ends_at && d.market > d.total ? `<span class="small pos">spart ${eur(d.market - d.total)}</span>` : ""}${d.status !== "aktiv" ? `<span class="bdg">${esc(d.status)}</span>` : ""}</div>
        <div class="foot"><span>${I.chat} ${d.comments}</span>${d.flames?.members ? `<span class="small fl-why">${esc(flameText(d.flames))}</span>` : ""}<span class="spacer"></span><span>${esc(d.shared_by_name || "")} · ${ago(d.created_at)}</span></div></div></div>`;
  }
  async function viewCommunity() {
    const tab = S.feedTab, niche = S.niche || "alle";
    const TABS = [["hot", "Heiß"], ["restocks", "Restocks"], ["wissen", "Wissen"], ["new", "Neu"], ["sold", "Verkaufspreise"]];
    const H1 = { hot: "Das haben die Leute gefunden.", new: "Frisch geteilt.", restocks: "Wieder im Laden.", wissen: "Was die Leute wissen.", sold: "Dafür ging’s wirklich weg." };
    const SUB = { hot: `Oben steht, was die meisten in den letzten ${E.FLAME_WINDOW_DAYS} Tagen teurer verkauft haben. Jede Flamme ist ein Mensch, kein Algorithmus.`, new: "Neueste zuerst. Ob’s was taugt, entscheidest du.", restocks: "Limitierte Sachen und Händler-Deals. Schnell sein lohnt sich.", wissen: "Tipps, Nischen, Fragen. Von Leuten, die das schon gemacht haben.", sold: "Echte Verkaufspreise statt Wunschpreise. Jeder Eintrag macht Marktpreis und Flammen genauer." };
    const action = tab === "sold" || tab === "hot" || tab === "new" ? `<button class="btn sm ghost" data-act="flameInfo" aria-label="Was bedeuten die Flammen?">${I.flame}Flammen?</button><button class="btn sm ghost" data-act="flipForm">${I.plus}Verkauf eintragen</button>` : tab === "restocks" ? `<button class="btn sm vio" data-act="restockNew">${I.plus}Restock melden</button>` : tab === "wissen" ? `<button class="btn sm vio" data-act="postNew">${I.plus}Was schreiben</button>` : "";
    mount(`<section class="hero small" style="padding-bottom:0"><h1>${H1[tab]}</h1><p class="herosub">${SUB[tab]}</p></section>
      <div class="ctabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" class="${tab === k ? "on" : ""}" data-act="ftab" data-v="${k}">${l}</button>`).join("")}</div>
      ${tab === "wissen" || tab === "restocks" ? `<div class="chips nchips">${NICHES.map(([k, l]) => `<button class="chip ${niche === k ? "on" : ""}" data-act="niche" data-v="${k}">${l}</button>`).join("")}</div>` : ""}
      <div class="toolbar"><span class="small dim" id="fcount"></span><span class="spacer"></span>${action}</div>
      <div id="feed"><div class="sk" style="height:96px"></div><div class="sk" style="height:96px;margin-top:10px"></div><div class="sk" style="height:96px;margin-top:10px"></div></div>`, "community");
    const inNiche = (x) => niche === "alle" || x.niche === niche;
    try {
      if (tab === "sold") {
        const rows = await S.be.soldRecent();
        const by = {};
        for (const r of rows) (by[r.product_key] ||= { title: r.title, rows: [] }).rows.push(r);
        $("#feed").innerHTML = Object.values(by).map((g, i) => {
          const prices = g.rows.map((r) => +r.price), med = E.median(prices);
          return `<div class="card" style="animation:up .5s ${i * 60}ms both"><div class="row"><div style="flex:1;min-width:0"><div style="font-weight:700">${esc(g.title)}</div><div class="small muted">${g.rows.length} Verkäufe · ${eur(Math.min(...prices))}–${eur(Math.max(...prices))}</div></div><div class="ptag-s"><span>Median</span><b class="num">${eur(med)}</b></div></div>
            <div style="margin-top:8px">${g.rows.slice(0, 4).map((r) => `<div class="soldrow"><div><b class="num">${eur2(+r.price)}</b> <span class="small muted">${esc(E.COND_LABEL[r.condition])} · ${esc(r.platform)}</span></div><div class="small dim">${dateDE(r.sold_at)}</div></div>`).join("")}</div></div>`;
        }).join("") || `<p class="empty-line">Noch hat keiner was eingetragen. Fang du an.</p>`;
        return;
      }
      if (tab === "restocks") {
        const rows = sortRestocks(await withRestockFlames((await S.be.restocks()).filter(inNiche)));
        const live = rows.filter((r) => rsState(r).k !== "out").length;
        $("#fcount").textContent = `${live} aktiv · ${rows.length - live} beendet`;
        $("#feed").innerHTML = rows.map(restockCard).join("") || `<p class="empty-line">In der Nische ist gerade Ebbe.</p>`;
        return;
      }
      if (tab === "wissen") {
        const rows = (await S.be.posts()).filter(inNiche);
        const trends = rows.filter((p) => p.kind === "analyse").sort((a, b) => (b.trend === "up") - (a.trend === "up") || (b.hot || 0) - (a.hot || 0)).slice(0, 6);
        const rest = rows.filter((p) => !trends.includes(p)).sort((a, b) => ((b.hot || 0) + (b.comments || 0)) / Math.pow((Date.now() - Date.parse(b.last_at || b.created_at)) / 36e5 + 2, 0.6) - ((a.hot || 0) + (a.comments || 0)) / Math.pow((Date.now() - Date.parse(a.last_at || a.created_at)) / 36e5 + 2, 0.6));
        $("#fcount").textContent = `${rows.length} Beiträge`;
        $("#feed").innerHTML = (trends.length ? `<div class="sec hand" style="margin-top:4px"><h2>Was sich gerade gut verkauft</h2></div><div class="trends">${trends.map(trendCard).join("")}</div>` : "")
          + `<div class="sec hand"><h2>Tipps und Fragen</h2></div>` + (rest.map(postCard).join("") || `<p class="empty-line">Noch leer. Du weißt was? Raus damit.</p>`);
        return;
      }
      let rows = await withFlames(await S.be.feed());
      rows = tab === "hot" ? rows.sort(byFlames) : rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
      $("#feed").innerHTML = rows.map(dealCard).join("") || `<p class="empty-line">Noch hat keiner was geteilt. Such was Gutes und zeig’s rum.</p>`;
    } catch (e) { $("#feed").innerHTML = `<div class="card empty">${esc(e.message)}</div>`; }
  }

  // ---------- Recht & Melden ----------
  const LEGAL = `<nav class="legal-links"><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><a href="regeln.html">Nutzungsbedingungen &amp; Community-Regeln</a></nav>`;
  const affNote = () => (S.affiliate ? `<p class="affnote">${I.info}<span><b>Affiliate-Link:</b> Kaufst du über „Ab zu eBay“, erhält Hotflip ggf. eine Provision von eBay (eBay Partner Network). Für dich ändert sich der Preis nicht. Die Bewertung ist davon unabhängig.</span></p>` : "");
  const flagBtn = (kind, id, small = false) => (small ? `<a href="#" class="flag" data-act="report" data-kind="${kind}" data-id="${esc(id)}">melden</a>` : `<button class="btn sm ghost" data-act="report" data-kind="${kind}" data-id="${esc(id)}">${I.flag}Melden</button>`);
  const REASONS = [["illegal", "Illegale Ware oder Inhalte (z. B. Fälschungen, Waffen, gestohlene Ware)"], ["betrug", "Betrug / Fake-Deal"], ["spam", "Spam oder Werbung"], ["beleidigung", "Beleidigung, Hass oder Belästigung"], ["persoenlich", "Persönliche Daten Dritter"], ["sonstiges", "Sonstiges"]];
  function reportForm(kind, id) {
    sheet(`<h2>Inhalt melden</h2><p class="small muted" style="margin-top:-4px">Meldungen gehen vertraulich an den Betreiber und werden zeitnah geprüft. Bei Verstößen wird der Inhalt entfernt.</p>
      <form id="repf">${REASONS.map(([k, l], i) => `<label class="radio"><input type="radio" name="reason" value="${k}" ${i === 0 ? "checked" : ""}><span>${l}</span></label>`).join("")}
        <label class="f" style="margin-top:10px"><span>Details (optional)</span><textarea class="in1" name="note" maxlength="500" rows="3" placeholder="Was genau ist das Problem?"></textarea></label>
        <button class="btn danger block">${I.flag}Meldung absenden</button></form>
      <p class="tiny dim" style="margin-top:12px">Ohne Konto? Meldungen auch per E-Mail an die Adresse im <a href="impressum.html">Impressum</a>.</p>`, (sh) => {
      sh.querySelector("#repf").onsubmit = async (e) => {
        e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
        try { const r = await S.be.report(kind, id, f.reason, f.note.trim() || null); closeSheet(); toast(r?.duplicate ? "Hast du schon gemeldet. Wir sind dran." : "Danke. Ich schau’s mir an."); } catch (er) { fail(er); }
      };
    });
  }

  // ---------- Restocks & Neuware ----------
  const NICHES = [["alle", "Alle"], ["smartphones", "Smartphones"], ["konsolen", "Konsolen"], ["audio", "Audio"], ["lego", "LEGO"], ["sneaker", "Sneaker"], ["sammelkarten", "Sammelkarten"], ["mode", "Mode & Vintage"], ["technik", "Technik"], ["sonstiges", "Allgemein"]];
  const nicheLabel = (k) => (NICHES.find((n) => n[0] === k) || [k, k])[1];
  function rsState(r) {
    const now = Date.now(), st = r.starts_at ? Date.parse(r.starts_at) : 0, ex = r.expires_at ? Date.parse(r.expires_at) : Infinity;
    if (r.status === "ausverkauft") return { k: "out", label: "Ausverkauft" };
    if (r.status === "abgelaufen" || ex < now) return { k: "out", label: "Abgelaufen" };
    if (st > now) return { k: "soon", label: "Startet in " + span(st - now) };
    return { k: "live", label: ex === Infinity ? "Läuft" : "Noch " + span(ex - now), urgent: ex - now < 6 * 3600e3 };
  }
  function span(ms) { const m = Math.max(1, Math.round(ms / 60000)); if (m < 60) return m + " Min."; const h = Math.floor(m / 60); if (h < 48) return h + " Std." + (h < 6 && m % 60 ? " " + (m % 60) + " Min." : ""); return Math.round(h / 24) + " Tage"; }
  function restockCard(r, i = 0) {
    const s = rsState(r), off = r.regular_price && r.price < r.regular_price ? Math.round((1 - r.price / r.regular_price) * 100) : 0;
    return `<div class="rs ${s.k === "out" ? "out" : ""}" data-act="openRestock" data-id="${esc(r.id)}" style="animation-delay:${Math.min(i, 10) * 45}ms"><div class="thumb">${r.image ? thumb(r.image) : `<div class="rlogo">${esc((r.retailer || "?").slice(0, 2))}</div>`}</div>
      <div style="min-width:0"><div class="row" style="align-items:flex-start"><div class="t">${esc(r.title)}</div>${flameChip(r.flames, "das Produkt")}</div>
        <div class="row" style="margin-top:5px;gap:8px;flex-wrap:wrap"><b class="num dp">${eur2(r.price)}</b>${off ? `<s class="small dim num">${eur2(r.regular_price)}</s><span class="under">−${off} %</span>` : `<span class="small dim">UVP</span>`}</div>
        <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><span class="bdg">${esc(r.retailer)}</span><span class="bdg">${esc(nicheLabel(r.niche))}</span><span class="clock ${s.k} ${s.urgent ? "urgent" : ""}">${I.clock}${esc(s.label)}</span></div>
        <div class="foot"><span>${I.chat} ${r.comments}</span><span class="spacer"></span><span>${esc(r.posted_by_name || "Ehemaliges Mitglied")} · ${ago(r.created_at)}</span></div></div></div>`;
  }
  function sortRestocks(rows) {
    const out = (r) => rsState(r).k === "out";
    return rows.sort((a, b) => out(a) - out(b) || byFlames(a, b));
  }
  async function viewRestock(id) {
    mount(`<div class="sk" style="height:220px;margin-top:16px"></div>`, "community");
    let r, rsales = []; try { r = await S.be.restock(id); if (r) rsales = await S.be.soldFor(restockKey(r)).catch(() => []); } catch (e) { return fail(e); }
    if (!r) { location.replace("#/community"); return; }
    const rf = E.saleFlames(r.price, "neu", rsales, { exclude: r.posted_by });
    const s = rsState(r), off = r.regular_price && r.price < r.regular_price ? Math.round((1 - r.price / r.regular_price) * 100) : 0;
    const url = safeUrl(r.url);
    mount(`<button class="back" data-act="back">${I.back} Restocks</button>
      <div class="card rshero ${s.k === "out" ? "out" : ""}"><div class="thumb big">${r.image ? thumb(r.image) : `<div class="rlogo">${esc((r.retailer || "?").slice(0, 2))}</div>`}</div>
        <div class="kicker" style="margin-top:12px">${esc(r.retailer)} · ${esc(nicheLabel(r.niche))}${S.be.mode === "demo" ? " · Beispieldaten" : ""}</div><h1 class="dtitle">${esc(r.title)}</h1>
        <div class="row" style="gap:10px;flex-wrap:wrap"><b class="num ptag">${eur2(r.price)}</b>${off ? `<s class="dim num">${eur2(r.regular_price)}</s><span class="under">−${off} %</span>` : ""}</div>
        <div class="clockbar ${s.k} ${s.urgent ? "urgent" : ""}">${I.clock}<b>${esc(s.label)}</b>${r.expires_at && s.k !== "out" ? `<span class="spacer"></span><span class="small">bis ${dateTimeDE(r.expires_at)}</span>` : ""}</div>
        <div class="mx"><div><span>Preis</span><b class="num">${eur2(r.price)}</b></div><div><span>UVP</span><b class="num">${r.regular_price ? eur2(r.regular_price) : "–"}</b></div><div><span>Ersparnis</span><b class="num ${off > 0 ? "pos" : ""}">${off > 0 ? eur(r.regular_price - r.price) : "–"}</b></div></div>
        ${r.note ? `<p class="muted" style="margin:12px 0 0;line-height:1.5">${esc(r.note)}</p>` : ""}
        <div class="actions" style="margin-top:14px">${url ? `<a class="btn pri block" href="${esc(url)}" target="_blank" rel="noopener nofollow">${I.ext}Zum Händler</a>` : ""}</div>
        <div class="tip" style="margin-top:12px">${I.info}<div class="small">Den Deal kriegen viele gleichzeitig. Kauf nur, was du wirklich willst – nach einem Restock fahren die Preise Achterbahn.</div></div></div>
      <div class="card">${flamePanel(rf, rsales, r.price, "neu", r.posted_by, "das Produkt")}
        ${s.k !== "out" ? `<div class="row" style="gap:8px;margin-top:12px"><button class="btn sm ghost" data-act="rstatus" data-v="ausverkauft" data-id="${esc(r.id)}">Ausverkauft melden</button><button class="btn sm ghost" data-act="rstatus" data-v="abgelaufen" data-id="${esc(r.id)}">Abgelaufen melden</button></div>` : ""}
        <div class="row" style="gap:8px;margin-top:8px;justify-content:flex-end">${r.mine ? `<button class="btn sm ghost" data-act="rdel" data-id="${esc(r.id)}">${I.trash || ""}Löschen</button>` : flagBtn("restock", r.id)}</div></div>
      <div class="sec hand"><h2>Was die Leute sagen</h2><span class="small dim">${r.commentList.length}</span></div>
      ${commentBlock(r.commentList, { restock_id: r.id })}`, "community");
    bindComment({ restock_id: r.id });
  }
  function commentBlock(list, target) {
    const key = Object.keys(target)[0], id = target[key];
    return `<div class="card"><div>${list.map((c) => `<div class="cmt">${avatar(c.author)}<div><div class="h"><b>${esc(c.author)}</b>${ago(c.created_at)}${c.mine ? ` · <a href="#" data-act="cdel" data-id="${esc(c.id)}">löschen</a>` : ` · ${flagBtn("comment", c.id, true)}`}</div><p>${esc(c.body)}</p></div></div>`).join("") || '<div class="small dim">Noch still hier. Sag du was.</div>'}</div>
      <form id="cf2" class="row" style="margin-top:12px"><input class="in1" name="c" maxlength="600" placeholder="${key === "post_id" ? "Deine Antwort …" : "Deine Meinung dazu …"}" aria-label="Kommentar"><button class="btn pri" style="min-height:46px">Senden</button></form></div>`;
  }
  function bindComment(target) {
    const f = $("#cf2"); if (!f) return;
    f.onsubmit = async (e) => { e.preventDefault(); const v = e.target.c.value.trim(); if (!v) return; try { await S.be.comment(target, v); render(); } catch (er) { fail(er); } };
  }
  function restockForm() {
    const now = new Date(Date.now() + 24 * 3600e3), loc = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    sheet(`<h2>Was ist wieder da?</h2><p class="small muted" style="margin-top:-4px">Limitierte Releases, Restocks, Preisfehler bei Neuware – alles, was viele mitnehmen können.</p>
      <form id="rf" >
        <label class="f"><span>Titel</span><input class="in1" name="title" maxlength="160" required placeholder="z. B. Pokémon ETB – Restock"></label>
        <label class="f"><span>Produkt (für die Flammen)</span><input class="in1" name="product" maxlength="120" placeholder="z. B. Pokémon Elite-Trainer-Box – leer = Titel"></label>
        <div class="grid2"><label class="f"><span>Händler</span><input class="in1" name="retailer" maxlength="60" required placeholder="z. B. MediaMarkt"></label><label class="f"><span>Nische</span><select class="in1" name="niche">${NICHES.slice(1).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></label></div>
        <label class="f"><span>Link (https)</span><input class="in1" name="url" type="url" maxlength="500" placeholder="https://…"></label>
        <div class="grid2"><label class="f"><span>Preis €</span><input class="in1" name="price" inputmode="decimal" required></label><label class="f"><span>UVP €</span><input class="in1" name="regular_price" inputmode="decimal"></label></div>
        <label class="f"><span>Gültig bis</span><input class="in1" name="expires_at" type="datetime-local" value="${loc}"></label>
        <label class="f"><span>Hinweis</span><textarea class="in1" name="note" maxlength="600" rows="3" placeholder="Limit pro Kunde, Filialen, Gutscheincode …"></textarea></label>
        <button class="btn pri block">${I.plus}Raus damit</button></form>`);
    $("#rf").onsubmit = async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const n = (v) => (v === "" || v == null ? null : Number(String(v).replace(",", ".")));
      if (f.url && !/^https:\/\//.test(f.url)) return toast("Der Link muss mit https:// anfangen.");
      try { const r = await S.be.restockSave({ title: f.title.trim(), product: f.product.trim() || null, retailer: f.retailer.trim(), niche: f.niche, url: f.url || null, price: n(f.price), regular_price: n(f.regular_price), expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null, starts_at: null, note: f.note.trim() || null }); closeSheet(); toast("Steht drin. Danke!"); location.hash = "#/restock/" + r.id; } catch (er) { fail(er); }
    };
  }

  // ---------- Wissensecke ----------
  const KIND = { tipp: ["Tipp", "good"], analyse: ["Analyse", "vio"], frage: ["Frage", "warn"] };
  const TREND = { up: ["↗", "Steigend", "pos"], flat: ["→", "Stabil", ""], down: ["↘", "Fallend", "neg"] };
  function metricsRow(mx) {
    if (!mx) return "";
    const a = [];
    if (mx.days_to_sell != null) a.push(["Verkauft in", "Ø " + mx.days_to_sell + " T."]);
    if (mx.sell_through != null) a.push(["Verkaufsquote", mx.sell_through + " %"]);
    return a.length ? `<div class="mx">${a.map(([l, v]) => `<div><span>${l}</span><b class="num">${v}</b></div>`).join("")}</div>` : "";
  }
  function trendCard(p, i = 0) {
    const tr = TREND[p.trend] || TREND.flat;
    return `<div class="trend ${p.trend}" data-act="openPost" data-id="${esc(p.id)}" style="animation-delay:${i * 60}ms"><div class="row"><span class="kicker">${esc(nicheLabel(p.niche))}</span><span class="spacer"></span><span class="arrow ${tr[2]}">${tr[0]} ${tr[1]}</span></div>
      <div class="t">${esc(p.title)}</div>${metricsRow(p.metrics)}</div>`;
  }
  function postCard(p, i = 0) {
    const k = KIND[p.kind] || KIND.tipp;
    return `<div class="post" data-act="openPost" data-id="${esc(p.id)}" style="animation-delay:${Math.min(i, 10) * 45}ms">
      <div class="row" style="gap:6px"><span class="bdg ${k[1]}">${k[0]}</span><span class="bdg">${esc(nicheLabel(p.niche))}</span>${p.trend ? `<span class="small ${TREND[p.trend][2]}">${TREND[p.trend][0]} ${TREND[p.trend][1]}</span>` : ""}<span class="spacer"></span><span class="small dim">${ago(p.created_at)}</span></div>
      <div class="t">${esc(p.title)}</div><div class="ex">${esc(p.body)}</div>
      <div class="foot">${helpBtn(p)}
        <span>${I.chat} ${p.comments}</span><span class="spacer"></span><span>${esc(p.posted_by_name || "Ehemaliges Mitglied")}</span></div></div>`;
  }
  async function viewPost(id) {
    mount(`<div class="sk" style="height:220px;margin-top:16px"></div>`, "community");
    let p; try { p = await S.be.post(id); } catch (e) { return fail(e); }
    if (!p) { location.replace("#/community"); return; }
    const k = KIND[p.kind] || KIND.tipp, tr = p.trend ? TREND[p.trend] : null;
    mount(`<button class="back" data-act="back">${I.back} Wissen</button>
      <div class="card"><div class="row" style="gap:6px"><span class="bdg ${k[1]}">${k[0]}</span><span class="bdg">${esc(nicheLabel(p.niche))}</span>${tr ? `<span class="arrow ${tr[2]}">${tr[0]} ${tr[1]}</span>` : ""}</div>
        <h1 class="dtitle">${esc(p.title)}</h1><div class="small dim">${esc(p.posted_by_name || "Ehemaliges Mitglied")} · ${ago(p.created_at)}${S.be.mode === "demo" ? " · Beispieldaten" : ""}${p.mine ? ` · <a href="#" data-act="pdel" data-id="${esc(p.id)}">löschen</a>` : ""}</div>
        ${metricsRow(p.metrics)}
        <div style="margin-top:12px;line-height:1.6;white-space:pre-wrap">${esc(p.body)}</div></div>
      <div class="card row" style="gap:10px">${helpBtn(p, true)}<span class="small dim">Hat’s dir was gebracht?</span><span class="spacer"></span>${p.mine ? "" : flagBtn("post", p.id)}</div>
      <div class="sec hand"><h2>${p.kind === "frage" ? "Wer weiß was?" : "Was die Leute sagen"}</h2><span class="small dim">${p.commentList.length}</span></div>
      ${commentBlock(p.commentList, { post_id: p.id })}`, "community");
    bindComment({ post_id: p.id });
  }
  function postForm(x = {}) {
    sheet(`<h2>Was weißt du?</h2>
      <form id="pf" >
        <div class="seg" id="pk" style="width:100%;margin-bottom:14px">${Object.entries(KIND).map(([k, [l]]) => `<button type="button" class="${(x.kind || "tipp") === k ? "on" : ""}" data-k="${k}">${l}</button>`).join("")}</div>
        <label class="f"><span>Nische</span><select class="in1" name="niche">${NICHES.slice(1).map(([k, l]) => `<option value="${k}" ${x.niche === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="f"><span>Titel</span><input class="in1" name="title" maxlength="140" required></label>
        <label class="f"><span>Text</span><textarea class="in1" name="body" maxlength="4000" rows="6" required></textarea></label>
        <div id="ax" style="display:none"><label class="f"><span>Trend</span><select class="in1" name="trend"><option value="up">↗ Steigend</option><option value="flat">→ Stabil</option><option value="down">↘ Fallend</option></select></label>
          <div class="grid2"><label class="f"><span>Tage bis Verkauf</span><input class="in1" name="days_to_sell" inputmode="numeric"></label><label class="f"><span>Quote %</span><input class="in1" name="sell_through" inputmode="numeric"></label></div></div>
        <button class="btn pri block">Raus damit</button></form>`);
    let kind = x.kind || "tipp";
    const sync = () => { $("#ax").style.display = kind === "analyse" ? "" : "none"; $$("#pk button").forEach((b) => b.classList.toggle("on", b.dataset.k === kind)); };
    $$("#pk button").forEach((b) => (b.onclick = () => { kind = b.dataset.k; sync(); })); sync();
    $("#pf").onsubmit = async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const n = (v) => (v === "" || v == null ? undefined : Number(String(v).replace(",", ".")));
      const metrics = kind === "analyse" ? JSON.parse(JSON.stringify({ days_to_sell: n(f.days_to_sell), sell_through: n(f.sell_through) })) : {};
      try { const r = await S.be.postSave({ kind, niche: f.niche, title: f.title.trim(), body: f.body.trim(), trend: kind === "analyse" ? f.trend : null, metrics }); closeSheet(); toast("Steht drin."); location.hash = "#/post/" + r.id; } catch (er) { fail(er); }
    };
  }

  // ---------- Suchaufträge ----------
  async function viewWatch() {
    mount(`<section class="hero small" style="padding-bottom:0"><h1>Auf der Lauer.</h1><p class="herosub">Sag mir, was du willst und was es kosten darf. Ich schau alle 30 Minuten bei eBay und meld mich, wenn was passt.</p></section>
      <div class="row" style="margin-top:16px"><button class="btn pri block" data-act="watchNew">${I.plus}Neuer Suchauftrag</button></div>
      <div class="sec hand"><h2>Darauf wart ich gerade</h2></div><div id="wl"><div class="sk" style="height:90px"></div></div>
      <div class="sec hand"><h2>Hab was gefunden</h2><span class="spacer"></span><span class="small dim" id="hc"></span></div><div id="hl"><div class="sk" style="height:76px"></div></div>${affNote()}
      <p class="note" style="margin-top:16px">Push aufs Handy kommt noch. Bis dahin zeigt dir der rote Punkt am Tab, wenn’s was Neues gibt.</p>`, "watch");
    try {
      const [ws, hs] = await Promise.all([S.be.watches(), S.be.hits()]);
      $("#wl").innerHTML = ws.map((w) => `<div class="card watch"><div class="row"><div style="flex:1;min-width:0"><div class="q">${esc(w.query)}</div>
          <div class="crit"><span class="bdg">${esc(w.condition === "alle" ? "Alle Zustände" : E.COND_LABEL[w.condition])}</span>${w.max_price ? `<span class="bdg">bis ${eur(+w.max_price)}</span>` : ""}${w.min_discount != null ? `<span class="bdg under">ab −${Math.round(+w.min_discount)} %</span>` : ""}<span class="bdg good">Score ≥ ${w.min_score}</span>${w.active ? "" : '<span class="bdg warn">pausiert</span>'}</div>
          <div class="tiny dim" style="margin-top:6px">${w.last_checked_at ? "Zuletzt geschaut " + ago(w.last_checked_at) : "Noch nicht geschaut"} · ${w.hits} Treffer${w.fresh ? ` · <b class="pos">${w.fresh} neu</b>` : ""}${w.last_error ? ` · <span class="neg">${esc(w.last_error)}</span>` : ""}</div></div>
          <div class="col" style="gap:6px"><button class="btn sm" data-act="watchRun" data-id="${esc(w.id)}">Prüfen</button><button class="btn sm ghost" data-act="watchEdit" data-id="${esc(w.id)}">Ändern</button></div></div></div>`).join("") || `<p class="empty-line">Noch auf nichts angesetzt. Sag mir, was du suchst.</p>`;
      S._watches = ws;
      $("#hc").textContent = hs.length ? `${hs.filter((h) => !h.seen).length} neu` : "";
      $("#hl").innerHTML = hs.map((h) => `<a class="hit ${h.seen ? "" : "new"}" href="${esc(safeUrl(h.url))}" target="_blank" rel="noopener sponsored"><div class="thumb">${thumb(h.image)}</div><div style="min-width:0"><div class="small" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h.title)}</div><div class="row small" style="gap:8px;margin-top:3px"><b class="num">${eur2(h.total)}</b>${h.under_pct != null ? `<span class="pos">−${Math.round(+h.under_pct)} %</span>` : ""}<span class="dim tiny">${esc(h.query || "")} · ${ago(h.created_at)}</span></div></div>${ring(h.score, 42)}</a>`).join("") || `<p class="empty-line">Noch nichts dabei. Geduld – gute Deals kommen nicht auf Bestellung.</p>`;
      animate($("#hl"));
      if (hs.some((h) => !h.seen)) { await S.be.hitsSeen(); S.unseen = 0; $(".tab .dot")?.remove(); }
    } catch (e) { $("#wl").innerHTML = `<div class="card empty">${esc(e.message)}</div>`; $("#hl").innerHTML = ""; }
  }
  function watchForm(w = {}) {
    sheet(`<h2>${w.id ? "Suchauftrag ändern" : "Neuer Suchauftrag"}</h2><form id="wf">
      <label class="f"><span>Produkt</span><input class="in1" name="query" required minlength="2" maxlength="120" value="${esc(w.query || "")}" placeholder="z. B. iPhone 13 128 GB"></label>
      <div class="grid2"><label class="f"><span>Zustand</span><select class="in1" name="condition">${[["gebraucht", "Gebraucht"], ["neu", "Neu"], ["alle", "Alle"]].map(([k, l]) => `<option value="${k}" ${(w.condition || "gebraucht") === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="f"><span>Max. Preis (€)</span><input class="in1" name="max_price" type="number" inputmode="decimal" min="0" step="1" value="${esc(w.max_price ?? "")}" placeholder="egal"></label></div>
      <label class="f"><span>Mindest-Ersparnis gegenüber Marktpreis (%)</span><input class="in1" name="min_discount" type="number" inputmode="numeric" min="0" max="90" step="1" value="${esc(w.min_discount ?? "")}" placeholder="egal"></label>
      <label class="f"><span>Mindest-Score: <b id="msv">${w.min_score ?? 60}</b></span><input type="range" name="min_score" min="30" max="95" step="5" value="${w.min_score ?? 60}"></label>
      ${w.id ? `<label class="row small" style="margin-bottom:12px"><input type="checkbox" name="active" ${w.active !== false ? "checked" : ""}> Aktiv</label>` : ""}
      <button class="btn pri block">Speichern</button>${w.id ? `<button type="button" class="btn danger block" style="margin-top:10px" data-del>Löschen</button>` : ""}</form>`, (sh) => {
      const r = sh.querySelector("[name=min_score]"); const u = () => { $("#msv").textContent = r.value; r.style.setProperty("--p", ((r.value - 30) / 65) * 100 + "%"); }; r.oninput = u; u();
      sh.querySelector("#wf").onsubmit = async (e) => {
        e.preventDefault(); const f = new FormData(e.target);
        const data = { id: w.id, query: f.get("query"), condition: f.get("condition"), max_price: f.get("max_price") ? Number(f.get("max_price")) : null, min_discount: f.get("min_discount") !== "" && f.get("min_discount") != null ? Number(f.get("min_discount")) : null, min_score: Number(f.get("min_score")), active: w.id ? !!f.get("active") : true };
        try { await S.be.watchSave(data); closeSheet(); toast("Gemerkt. Ich pass auf."); if (route() === "watch") viewWatch(); else location.hash = "#/watch"; } catch (er) { fail(er); }
      };
      sh.querySelector("[data-del]")?.addEventListener("click", async () => { if (!confirm("Suchauftrag wirklich löschen?")) return; try { await S.be.watchDelete(w.id); closeSheet(); viewWatch(); } catch (er) { fail(er); } });
    });
  }

  // ---------- Bestand & Steuer ----------
  async function viewBestand() {
    mount(`<section class="hero small" style="padding-bottom:0"><h1>Bestand &amp; Steuer</h1><p class="herosub">Was du gekauft hast, was weg ist, was hängen bleibt. Und wann eBay & Co. dem Finanzamt Bescheid geben.</p></section><div id="bb"><div class="grid2" style="margin-top:16px"><div class="sk" style="height:84px"></div><div class="sk" style="height:84px"></div></div></div>`, "bestand");
    try {
      const inv = await S.be.inventory(), y = new Date().getFullYear();
      const sold = inv.filter((x) => x.status === "verkauft"), soldY = sold.filter((x) => x.sold_at && new Date(x.sold_at).getFullYear() === y);
      const stock = inv.filter((x) => x.status !== "verkauft");
      const pr = (x) => +x.sold_price - +x.sold_fees - +x.sold_shipping - +x.buy_price - +x.buy_costs;
      const gain = soldY.reduce((a, x) => a + pr(x), 0), rev = soldY.reduce((a, x) => a + +x.sold_price, 0), cost = soldY.reduce((a, x) => a + +x.buy_price + +x.buy_costs, 0);
      const capital = stock.reduce((a, x) => a + +x.buy_price + +x.buy_costs, 0);
      const d7 = E.dac7(inv.filter((x) => x.status === "verkauft"), y).sort((a, b) => b.revenue - a.revenue);
      const worst = d7.find((x) => x.level === "over") || d7.find((x) => x.level === "near");
      $("#bb").innerHTML = `<div class="grid2" style="margin-top:16px">
          <div class="stat"><div class="s">Gewinn ${y}</div><div class="v num ${gain >= 0 ? "pos" : "neg"}" data-count="${Math.round(gain)}" data-fmt="eur">${eur(gain)}</div><div class="s">${soldY.length} Verkäufe · ROI ${cost ? pct(gain / cost * 100) : "–"}</div></div>
          <div class="stat"><div class="s">Umsatz ${y}</div><div class="v num" data-count="${Math.round(rev)}" data-fmt="eur">${eur(rev)}</div><div class="s">Ø ${eur(soldY.length ? gain / soldY.length : 0)} je Verkauf</div></div>
          <div class="stat"><div class="s">Im Lager</div><div class="v num">${stock.length}</div><div class="s">${eur(capital)} gebunden</div></div>
          <div class="stat"><div class="s">Inseriert</div><div class="v num">${stock.filter((x) => x.status === "inseriert").length}</div><div class="s">${stock.filter((x) => x.status === "lager").length} warten aufs Inserat</div></div></div>
        <div class="sec hand"><h2>Wann das Finanzamt mitliest</h2><span class="spacer"></span><span class="small dim">DAC7 · ${y}</span></div>
        <div class="card">${worst ? `<div class="tip ${worst.level === "over" ? "warn" : "warn"}" style="margin-bottom:10px">${I.info}<div><b>${esc(worst.platform)}: ${worst.level === "over" ? "Meldegrenze erreicht" : "nah an der Meldegrenze"}.</b> ${worst.level === "over" ? "Die Plattform meldet deine Verkäufe dieses Jahres ans Bundeszentralamt für Steuern." : `Ab 30 Verkäufen oder 2.000 € meldet ${esc(worst.platform)} deine Verkäufe ans Bundeszentralamt für Steuern.`}</div></div>` : ""}
          ${d7.map((p) => `<div style="margin-top:12px"><div class="row"><b>${esc(p.platform)}</b><span class="spacer"></span><span class="lvl ${p.level}">${p.level === "over" ? "Grenze erreicht" : p.level === "near" ? "Nah dran" : "Alles locker"}</span></div>
            <div class="meter ${p.level}"><div class="row"><span>Verkäufe</span><span class="num">${p.count} / 30</span></div><div class="b"><i style="width:0" data-w="${Math.min(100, p.countPct)}%"></i></div></div>
            <div class="meter ${p.level}"><div class="row"><span>Erlös</span><span class="num">${eur(p.revenue)} / 2.000 €</span></div><div class="b"><i style="width:0" data-w="${Math.min(100, p.revenuePct)}%"></i></div></div></div>`).join("") || '<div class="small muted">Dieses Jahr noch nichts verkauft. Also auch nichts zu melden.</div>'}
          <p class="tiny dim" style="margin:12px 0 0">Plattformen-Steuertransparenzgesetz (DAC7): Meldung je Plattform ab 30 Verkäufen <b>oder</b> 2.000 € Erlös im Kalenderjahr. Die Meldung allein bedeutet noch keine Steuerpflicht.</p></div>
        <div class="tip vio" style="margin-top:12px">${I.shield}<div><b>Gewerbe-Hinweis:</b> Wer gezielt kauft, um mit Gewinn weiterzuverkaufen, und das regelmäßig tut, handelt meist gewerblich – dann sind Gewerbeanmeldung, Einkommensteuer und je nach Umsatz Umsatzsteuer (Kleinunternehmerregel) Thema. Der Verkauf eigener Gebrauchsgegenstände bleibt in der Regel steuerfrei. Keine Steuerberatung – im Zweifel Steuerberatung fragen.</div></div>
        <div id="ebayc"></div>
        <div class="sec hand"><h2>Dein Kram</h2><span class="spacer"></span><button class="btn sm" data-act="invNew">${I.plus}Hinzufügen</button></div>
        <div>${inv.map((x) => { const p = x.status === "verkauft" ? pr(x) : null; return `<div class="inv" data-act="invEdit" data-id="${esc(x.id)}"><div class="t">${esc(x.title)}</div><div style="text-align:right" class="num">${p != null ? `<b class="${p >= 0 ? "pos" : "neg"}">${p >= 0 ? "+" : ""}${eur(p)}</b>` : `<b>${eur(+x.buy_price + +x.buy_costs)}</b>`}</div>
          <div class="small muted"><span class="st ${x.status}">${x.status === "lager" ? "Lager" : x.status === "inseriert" ? "Inseriert" : "Verkauft"}</span>${x.status === "verkauft" ? `${esc(x.platform_sold)} · ${dateDE(x.sold_at)}` : `gekauft ${dateDE(x.bought_at)} · ${esc(x.platform_bought)}`}</div><div class="small dim" style="text-align:right">${x.status === "verkauft" ? eur(+x.sold_price) : x.list_price ? "für " + eur(+x.list_price) : ""}</div>${invProgress(x)}</div>`; }).join("") || `<p class="empty-line">Noch leer. Was gekauft? Rein damit.</p>`}</div>`;
      S._inv = inv; animate($("#bb")); loadEbayCard();
    } catch (e) { $("#bb").innerHTML = `<div class="card empty">${esc(e.message)}</div>`; }
  }
  function invForm(it = {}) {
    const P = ["eBay", "Kleinanzeigen", "Vinted", "Facebook", "Sonstige"], st = it.status || "lager";
    sheet(`<h2>${it.id ? "Artikel bearbeiten" : "Artikel hinzufügen"}</h2><form id="if">
      <label class="f"><span>Artikel</span><input class="in1" name="title" required maxlength="200" value="${esc(it.title || "")}"></label>
      <div class="grid2"><label class="f"><span>Einkauf (€)</span><input class="in1" name="buy_price" type="number" inputmode="decimal" step="0.01" min="0" required value="${esc(it.buy_price ?? "")}"></label>
        <label class="f"><span>Nebenkosten (€)</span><input class="in1" name="buy_costs" type="number" inputmode="decimal" step="0.01" min="0" value="${esc(it.buy_costs ?? 0)}"></label>
        <label class="f"><span>Gekauft am</span><input class="in1" name="bought_at" type="date" value="${esc(it.bought_at || today())}"></label>
        <label class="f"><span>Gekauft bei</span><select class="in1" name="platform_bought">${P.map((p) => `<option ${(it.platform_bought || "eBay") === p ? "selected" : ""}>${p}</option>`).join("")}</select></label></div>
      <label class="f"><span>Zustand</span><select class="in1" name="condition"><option value="gebraucht">Gebraucht</option><option value="neu" ${it.condition === "neu" ? "selected" : ""}>Neu</option></select></label>
      <div class="seg" style="width:100%;margin-bottom:12px" id="sts">${[["lager", "Lager"], ["inseriert", "Inseriert"], ["verkauft", "Verkauft"]].map(([k, l]) => `<button type="button" data-st="${k}" class="${st === k ? "on" : ""}">${l}</button>`).join("")}</div>
      <label class="f" data-show="inseriert"><span>Angebotspreis (€)</span><input class="in1" name="list_price" type="number" inputmode="decimal" step="0.01" min="0" value="${esc(it.list_price ?? "")}"></label>
      <div data-show="verkauft"><div class="grid2"><label class="f"><span>Verkauft für (€)</span><input class="in1" name="sold_price" type="number" inputmode="decimal" step="0.01" min="0" value="${esc(it.sold_price ?? "")}"></label>
        <label class="f"><span>Verkauft am</span><input class="in1" name="sold_at" type="date" value="${esc(it.sold_at || today())}"></label>
        <label class="f"><span>Plattform</span><select class="in1" name="platform_sold">${P.map((p) => `<option ${(it.platform_sold || "eBay") === p ? "selected" : ""}>${p}</option>`).join("")}</select></label>
        <label class="f"><span>Gebühren (€)</span><input class="in1" name="sold_fees" type="number" inputmode="decimal" step="0.01" min="0" value="${esc(it.sold_fees ?? 0)}"></label></div>
        <label class="f"><span>Versand bezahlt (€)</span><input class="in1" name="sold_shipping" type="number" inputmode="decimal" step="0.01" min="0" value="${esc(it.sold_shipping ?? opts().shipOut)}"></label>
        <label class="row small" style="margin-bottom:12px;align-items:flex-start;gap:8px"><input type="checkbox" name="share" ${it.id ? (it.shared ? "checked" : "") : "checked"}> <span>Verkauf mit der Community teilen – zählt für Flammen &amp; Preismodell. Sichtbar: Produkt, Zustand, Plattform, Datum, Verkaufspreis, dein Anzeigename. Der Kaufpreis bleibt privat.</span></label></div>
      <label class="f"><span>Notiz</span><input class="in1" name="note" maxlength="500" value="${esc(it.note || "")}"></label>
      <button class="btn pri block">Speichern</button>${it.id ? `<button type="button" class="btn danger block" style="margin-top:10px" data-del>Löschen</button>` : ""}</form>`, (sh) => {
      let cur = st;
      const show = () => { $$("[data-show]", sh).forEach((el) => (el.style.display = el.dataset.show === cur ? "" : "none")); $$("#sts button", sh).forEach((b) => b.classList.toggle("on", b.dataset.st === cur)); };
      $$("#sts button", sh).forEach((b) => (b.onclick = () => { cur = b.dataset.st; show(); })); show();
      sh.querySelector("#if").onsubmit = async (e) => {
        e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
        const row = { ...f, id: it.id, item_ref: it.item_ref || null, status: cur, query: it.query || f.title, share: cur === "verkauft" && !!f.share };
        if (cur === "verkauft") {
          if (!(+f.sold_price > 0)) return toast("Für wie viel ging’s weg?", true);
          const err = E.checkFlip(row, row.share ? await S.be.soldFor(E.productKey(row.query)).catch(() => []) : []); if (err) return toast(err, true);
        }
        try {
          await S.be.invSave(row);
          closeSheet(); toast(row.share ? "Gespeichert. Und die anderen wissen jetzt auch, was es bringt." : "Gespeichert."); if (route() === "bestand") viewBestand();
        } catch (er) { fail(er); }
      };
      sh.querySelector("[data-del]")?.addEventListener("click", async () => { if (!confirm("Eintrag wirklich löschen?")) return; try { await S.be.invDelete(it.id); closeSheet(); viewBestand(); } catch (er) { fail(er); } });
    });
  }

  // ---------- Bestell-Status-Zeitleiste + Sendungsverfolgung + eBay verbinden ----------
  const dtLocal = (v) => { const d = new Date(v); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  const stepWhen = (v) => (!v ? "" : String(v).length <= 10 ? dateDE(v) : new Date(v).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " Uhr");
  const shipOpen = (sh) => sh && !sh.delivered_at && sh.status !== "delivered";
  // Kompakte Fortschrittsanzeige in der Bestandsliste: Punkte je Stufe + Sendungs-Chip
  function invProgress(x) {
    const t = E.timeline(x), steps = t.sell >= 0 || x.status === "verkauft" ? E.STEPS_SELL : E.STEPS_BUY, done = t.sell >= 0 || x.status === "verkauft" ? t.sell : t.buy;
    const sh = x.ship?.out || x.ship?.in;
    const chip = sh ? `<span class="shchip ${sh.status || ""}">${I.truck}${esc(sh.status ? E.TRACK_LABEL[sh.status] || sh.status : sh.carrier)}</span>` : "";
    return `<div class="tlmini" title="${esc(t.label)}">${steps.map(([k], i) => `<i class="${i <= done ? "on" : ""}"></i>`).join("")}<span>${esc(t.label)}</span>${x.source === "ebay" ? '<span class="bdg">eBay</span>' : ""}${chip}</div>`;
  }
  function shipBlock(it, dir) {
    const sh = it.ship?.[dir], dhl = !!S.features?.dhl, url = sh ? E.trackUrl(sh.carrier, sh.tracking_no) : null;
    const canTrack = sh && E.dhlCarrier(sh.carrier) && dhl;
    const evs = (sh?.events || []).slice(0, 5);
    return `<div class="shp" data-dir="${dir}">
      <div class="row" style="gap:8px;align-items:center"><b class="small">${I.truck} ${dir === "in" ? "Sendung an dich" : "Sendung an Käufer"}</b><span class="spacer"></span>${sh ? `<button class="btn sm ghost" data-shedit="${dir}">Ändern</button>` : ""}</div>
      ${sh ? `<div class="shinfo"><div><span class="bdg">${esc(sh.carrier)}</span> <span class="num small">${esc(sh.tracking_no)}</span></div>
        ${sh.status ? `<div class="shst ${esc(sh.status)}"><b>${esc(E.TRACK_LABEL[sh.status] || sh.status)}</b>${sh.status_text ? ` – ${esc(sh.status_text)}` : ""}${sh.status_at ? `<div class="tiny dim">${esc(stepWhen(sh.status_at))}${sh.eta && shipOpen(sh) ? ` · voraussichtlich ${esc(stepWhen(sh.eta))}` : ""}</div>` : ""}</div>` : canTrack ? `<div class="tiny dim" style="margin-top:6px">Noch kein Status abgerufen.</div>` : ""}
        ${evs.length ? `<ol class="shev">${evs.map((e) => `<li><span class="tiny dim">${esc(stepWhen(e.at))}${e.place ? " · " + esc(e.place) : ""}</span><div class="small">${esc(e.text)}</div></li>`).join("")}</ol>` : ""}
        ${sh.last_error ? `<div class="tiny" style="color:var(--warn);margin-top:6px">${esc(sh.last_error)}</div>` : ""}
        <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${canTrack && shipOpen(sh) ? `<button class="btn sm" data-shref>${I.hist}Status aktualisieren</button>` : ""}${url ? `<a class="btn sm ghost" href="${esc(url)}" target="_blank" rel="noopener">${I.ext}Bei ${esc(sh.carrier === "Deutsche Post" ? "DHL" : sh.carrier)} verfolgen</a>` : ""}</div>
        ${canTrack && sh.status ? `<div class="tiny dim" style="margin-top:8px">${sh.simulated ? "Demo – simulierter Sendungsstatus. " : ""}Delivered by Deutsche Post DHL Group</div>` : E.dhlCarrier(sh.carrier) && !dhl ? `<div class="tiny dim" style="margin-top:8px">Automatischer DHL-Status ist noch nicht freigeschaltet – der Link führt zur offiziellen DHL-Sendungsverfolgung.</div>` : ""}
      </div>` : ""}
      <form class="shform" data-dir="${dir}" style="${sh ? "display:none" : ""}"><div class="grid2"><label class="f"><span>Versanddienst</span><select class="in1" name="carrier">${E.CARRIERS.map((c) => `<option ${(sh?.carrier || "DHL") === c ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        <label class="f"><span>Sendungsnummer</span><input class="in1" name="tracking_no" maxlength="60" autocomplete="off" spellcheck="false" value="${esc(sh?.tracking_no || "")}" placeholder="z. B. 00340434…"></label></div>
        <div class="row" style="gap:8px"><button class="btn sm pri">Sendung speichern</button>${sh ? `<button type="button" class="btn sm danger" data-shdel>Entfernen</button>` : ""}</div></form></div>`;
  }
  function stepList(it, steps, title) {
    const t = E.timeline(it);
    let last = -1; steps.forEach(([k], i) => { if (t.tl[k]) last = i; });
    return `<div class="tlh small muted">${title}</div><ol class="tline">${steps.map(([k, l], i) => {
      const v = t.tl[k], fixed = (k === "gekauft" && !it.timeline?.gekauft) || (k === "verkauft" && !it.timeline?.verkauft);
      return `<li class="${v ? "done" : i === last + 1 ? "next" : ""}" data-step="${k}"><span class="dot">${v ? I.check : ""}</span><div class="lbl"><b>${l}</b><div class="tiny dim">${v ? esc(stepWhen(v)) + (fixed && v ? " · aus Kauf-/Verkaufsdatum" : "") : "noch offen"}</div>
        <div class="sted" style="display:none"><input class="in1" type="datetime-local" max="${dtLocal(Date.now() + 5 * 60e3)}" value="${v ? dtLocal(v) : dtLocal(Date.now())}"><div class="row" style="gap:6px;margin-top:6px"><button class="btn sm pri" data-stsave>Speichern</button><button class="btn sm" data-stnow>Jetzt</button>${it.timeline?.[k] ? `<button class="btn sm danger" data-stclr>Entfernen</button>` : ""}</div></div></div>
        <button class="btn sm ghost" data-stedit aria-label="${l} setzen">${v ? "Ändern" : "Setzen"}</button></li>`;
    }).join("")}</ol>`;
  }
  // Detail eines Bestand-Eintrags: Zeitleiste (manuell setzbar mit Zeitstempel), Sendungen, Bearbeiten
  async function invView(it, { refreshed = false } = {}) {
    if (!it) return;
    const sold = it.status === "verkauft" || E.timeline(it).sell >= 0;
    const sh = sheet(`<h2 style="margin-bottom:4px">${esc(it.title)}</h2><div class="small muted" style="margin-bottom:12px">${it.source === "ebay" ? '<span class="bdg">aus eBay</span> ' : ""}${eur(+it.buy_price + +it.buy_costs)} Einkauf${sold && it.sold_price ? ` · ${eur(+it.sold_price)} Verkauf` : ""}</div>
      ${it.note ? `<div class="tip vio" style="margin-bottom:12px">${I.info}<div>${esc(it.note)}</div></div>` : ""}
      <div class="card" id="tlc">${stepList(it, E.STEPS_BUY, "Einkauf")}${shipBlock(it, "in")}</div>
      ${sold ? `<div class="card" style="margin-top:12px">${stepList(it, E.STEPS_SELL, "Verkauf")}${shipBlock(it, "out")}</div>` : `<p class="tiny dim" style="margin:10px 2px">Weg damit? Unter „Bearbeiten“ auf „Verkauft“ stellen und den Preis eintragen – dann kommt die Verkaufs-Zeitleiste dazu.</p>`}
      <div class="row" style="gap:10px;margin-top:14px"><button class="btn block" data-invform>Bearbeiten</button></div>`, (root) => {
      const reload = async (msg) => { const inv = await S.be.inventory(); S._inv = inv; const n = inv.find((x) => x.id === it.id); if (msg) toast(msg); invView(n, { refreshed: true }); if (route() === "bestand") viewBestandSoft(inv); };
      root.querySelector("[data-invform]").onclick = () => invForm(it);
      $$("[data-stedit]", root).forEach((b) => (b.onclick = () => { const ed = b.closest("li").querySelector(".sted"); ed.style.display = ed.style.display === "none" ? "" : "none"; }));
      $$(".tline li", root).forEach((li) => {
        const k = li.dataset.step, inp = li.querySelector("input");
        const put = async (val) => { try { await S.be.invStep(it.id, k, val); await reload(val ? "Status gesetzt" : "Status entfernt"); } catch (er) { fail(er); } };
        li.querySelector("[data-stsave]").onclick = () => { if (!inp.value) return toast("Wann denn? Zeitpunkt fehlt.", true); put(new Date(inp.value).toISOString()); };
        li.querySelector("[data-stnow]").onclick = () => put(new Date().toISOString());
        li.querySelector("[data-stclr]")?.addEventListener("click", () => put(null));
      });
      $$(".shp", root).forEach((box) => {
        const dir = box.dataset.dir, form = box.querySelector(".shform");
        box.querySelector("[data-shedit]")?.addEventListener("click", () => { form.style.display = form.style.display === "none" ? "" : "none"; });
        form.onsubmit = async (e) => { e.preventDefault(); const f = Object.fromEntries(new FormData(form));
          if (!E.cleanTracking(f.tracking_no)) return toast("Sendungsnummer: 6–40 Zeichen, nur Buchstaben, Ziffern und Bindestrich", true);
          try { await S.be.shipSave(it.id, dir, f.carrier, f.tracking_no); if (E.dhlCarrier(f.carrier) && S.features?.dhl) await S.be.trackRefresh(it.id).catch(() => {}); await reload("Sendung gespeichert"); } catch (er) { fail(er); } };
        form.querySelector("[data-shdel]")?.addEventListener("click", async () => { if (!confirm("Sendung entfernen?")) return; try { await S.be.shipSave(it.id, dir, "", ""); await reload("Sendung entfernt"); } catch (er) { fail(er); } });
        box.querySelector("[data-shref]")?.addEventListener("click", async (e) => { e.target.disabled = true; try { await S.be.trackRefresh(it.id); await reload("Status aktualisiert"); } catch (er) { fail(er); e.target.disabled = false; } });
      });
    });
    // Beim Öffnen: offene DHL-Sendungen automatisch aktualisieren (Server drosselt auf 1× je 15 Min.)
    const stale = (s) => s && E.dhlCarrier(s.carrier) && shipOpen(s) && (!s.checked_at || Date.now() - Date.parse(s.checked_at) > 15 * 60e3);
    if (!refreshed && S.features?.dhl && (stale(it.ship?.in) || stale(it.ship?.out))) {
      try { await S.be.trackRefresh(it.id); const inv = await S.be.inventory(); S._inv = inv; const n = inv.find((x) => x.id === it.id); if (sh.isConnected && n) invView(n, { refreshed: true }); } catch (e) { console.warn(e); }
    }
    return sh;
  }
  function viewBestandSoft(inv) { // Liste im Hintergrund aktualisieren, ohne das offene Blatt zu schließen
    $$(".inv[data-id]").forEach((el) => { const x = inv.find((y) => y.id === el.dataset.id); const m = el.querySelector(".tlmini"); if (x && m) m.outerHTML = invProgress(x); });
  }
  async function loadEbayCard() {
    const box = $("#ebayc"); if (!box || !S.be.ebayStatus) return;
    let st; try { st = await S.be.ebayStatus(); } catch { return; }
    if (!$("#ebayc")) return;
    const demo = st.demo ? '<span class="bdg warn">Demo</span>' : "";
    if (!st.enabled) {
      box.innerHTML = `<div class="card ebc" style="margin-top:16px"><div class="row" style="gap:10px;align-items:center">${I.link}<b>eBay verbinden</b><span class="bdg">bald verfügbar</span></div><p class="small muted" style="margin:8px 0 10px">Käufe und Verkäufe aus deinem eBay-Konto (letzte 90 Tage) automatisch mit Zahlungs-, Versand- und Zustelldatum in die Zeitleiste übernehmen.</p><button class="btn sm" disabled>eBay verbinden</button></div>`;
      return;
    }
    if (!st.connected) {
      box.innerHTML = `<div class="card ebc" style="margin-top:16px"><div class="row" style="gap:10px;align-items:center">${I.link}<b>eBay verbinden</b>${demo}</div><p class="small muted" style="margin:8px 0 10px">Käufe und Verkäufe der letzten 90 Tage werden mit Bezahlt-, Versand- und Zustelldatum sowie Sendungsnummer übernommen. Hotflip liest nur (keine Änderungen an deinem eBay-Konto), jederzeit trennbar.${st.demo ? " In der Demo werden zwei Beispiel-Bestellungen übernommen." : ""}</p><button class="btn sm pri" data-act="ebayConnect">${I.link}eBay verbinden</button></div>`;
      return;
    }
    const l = st.link || {};
    box.innerHTML = `<div class="card ebc on" style="margin-top:16px"><div class="row" style="gap:10px;align-items:center">${I.link}<b>eBay verbunden</b>${demo}<span class="spacer"></span><span class="small muted">${esc(l.ebay_user || "")}</span></div>
      <p class="small muted" style="margin:8px 0 10px">${l.last_sync_at ? `Zuletzt abgeglichen ${esc(ago(l.last_sync_at))}.` : "Noch nicht abgeglichen."}${l.last_error ? ` <span style="color:var(--warn)">${esc(l.last_error)}</span>` : ""}</p>
      <div class="row" style="gap:8px"><button class="btn sm pri" data-act="ebaySync">${I.hist}Jetzt abgleichen</button><button class="btn sm danger" data-act="ebayDisconnect">Trennen</button></div></div>`;
    // Automatischer Abgleich beim Öffnen des Bestands, wenn der letzte älter als 6 Std. ist
    if (!S._ebayAuto && (!l.last_sync_at || Date.now() - Date.parse(l.last_sync_at) > 6 * 3600e3) && !st.demo) { S._ebayAuto = true; ACT.ebaySync(null, true); }
  }
  // „Verkauf eintragen“: Kauf + Verkauf in einem Schritt → Bestand-Eintrag (privat, mit Kaufpreis) + Verkaufsmeldung (Community, ohne Kaufpreis)
  function flipForm(pre = {}) {
    const P = ["eBay", "Kleinanzeigen", "Vinted", "Facebook", "Sonstige"];
    sheet(`<h2>Verkauf eintragen</h2><p class="small muted" style="margin:-6px 0 14px">Was verkauft? Sag, was du bezahlt und was du bekommen hast. Taucht das Ding später billiger auf, kriegt das Angebot von dir eine Flamme. <a href="#" data-act="flameInfo">Wie das geht</a></p><form id="flf">
      <label class="f"><span>Produkt</span><input class="in1" name="title" required minlength="3" maxlength="120" value="${esc(pre.title || "")}" placeholder="z. B. iPhone 13 128 GB"></label>
      <label class="f"><span>Zustand beim Verkauf</span><div class="seg" id="flc" style="width:100%"><button type="button" data-v="gebraucht" class="${pre.cond !== "neu" ? "on" : ""}">Gebraucht</button><button type="button" data-v="neu" class="${pre.cond === "neu" ? "on" : ""}">Neu / OVP</button></div></label>
      <div class="grid2"><label class="f"><span>Kaufpreis (€)</span><input class="in1" name="buy_price" type="number" inputmode="decimal" step="0.01" min="0" required></label>
        <label class="f"><span>Verkaufspreis (€)</span><input class="in1" name="sold_price" type="number" inputmode="decimal" step="0.01" min="1" required></label>
        <label class="f"><span>Gekauft am</span><input class="in1" name="bought_at" type="date" max="${today()}"></label>
        <label class="f"><span>Verkauft am</span><input class="in1" name="sold_at" type="date" value="${today()}" max="${today()}" required></label>
        <label class="f"><span>Gekauft bei</span><select class="in1" name="platform_bought">${P.map((p) => `<option ${p === "Kleinanzeigen" ? "selected" : ""}>${p}</option>`).join("")}</select></label>
        <label class="f"><span>Verkauft auf</span><select class="in1" name="platform_sold">${P.map((p) => `<option>${p}</option>`).join("")}</select></label></div>
      <div id="flpv" class="flpv"></div>
      <p class="tiny dim" style="margin:0 0 12px">Landet in deinem <b>Bestand</b> (Kaufpreis bleibt privat). Mit der Community geteilt werden Produkt, Zustand, Plattform, Datum, Verkaufspreis und dein Anzeigename. Bitte nur echte eigene Verkäufe – max. 20 Einträge pro Tag.</p>
      <button class="btn pri block">${I.plus}Verkauf eintragen</button></form>`, (sh) => {
      let cond = pre.cond === "neu" ? "neu" : "gebraucht";
      const form = sh.querySelector("#flf");
      const pv = () => { const f = Object.fromEntries(new FormData(form)), b = +f.buy_price, v = +f.sold_price; $("#flpv", sh).innerHTML = b >= 0 && v > 0 && f.buy_price !== "" ? `Differenz Verkauf − Kauf (vor Gebühren &amp; Versand): <b class="num ${v - b >= 0 ? "pos" : "neg"}">${v - b >= 0 ? "+" : ""}${eur2(v - b)}</b>` : ""; };
      form.oninput = pv;
      $$("#flc button", sh).forEach((b) => (b.onclick = () => { cond = b.dataset.v; $$("#flc button", sh).forEach((x) => x.classList.toggle("on", x === b)); }));
      form.onsubmit = async (e) => {
        e.preventDefault(); const f = Object.fromEntries(new FormData(form));
        const row = { title: f.title.trim(), query: f.title.trim(), condition: cond, buy_price: f.buy_price, buy_costs: 0, bought_at: f.bought_at || f.sold_at, platform_bought: f.platform_bought,
          status: "verkauft", sold_price: f.sold_price, sold_at: f.sold_at, platform_sold: f.platform_sold, sold_fees: 0, sold_shipping: 0, list_price: null, note: null, share: true };
        const btn = form.querySelector("button.pri"); btn.disabled = true;
        try {
          const err = E.checkFlip(row, await S.be.soldFor(E.productKey(row.query)).catch(() => [])); if (err) throw new Error(err);
          await S.be.invSave(row);
          closeSheet(); toast("Eingetragen. Steht im Bestand und zählt ab jetzt für die Flammen.");
          if (S.search.res && E.productKey(row.query) === E.productKey(S.search.evalQ)) { S.search.sold = await S.be.soldFor(S.search.res.key); evaluateNow(); }
          if (VM && route() === "detail") { loadSoldBox(VM); loadDealCommunity(VM); } else if (route() === "community") viewCommunity(); else if (route() === "bestand") viewBestand();
        } catch (er) { btn.disabled = false; fail(er); }
      };
    });
  }
  function flameInfo() {
    sheet(`<h2>Flammen, kurz erklärt</h2>
      <div class="explain">
        <p class="big-call">Eine Flamme ist ein Mensch.</p>
        <p>Jemand hier hat dasselbe Ding im selben Zustand in den <b>letzten ${E.FLAME_WINDOW_DAYS} Tagen teurer verkauft</b>, als es gerade angeboten wird. Keine Abstimmung, kein Bauchgefühl – echte Verkäufe.</p>
        <p>Steht da „5 Nutzer haben das teurer verkauft → echtes Schnäppchen“, dann haben fünf verschiedene Leute mehr dafür bekommen, als du hier zahlst.</p>
        <ul><li>Nur die letzten ${E.FLAME_WINDOW_DAYS} Tage zählen. Ältere Verkäufe bleiben im Marktpreis, bringen aber keine Flamme mehr.</li>
          <li>Pro Person höchstens eine Flamme, egal wie oft sie verkauft hat. Eigene Verkäufe zählen nicht für eigene Deals oder Restocks.</li>
          <li>Bei Restocks: Leute, die das Produkt neu teurer als zum Restock-Preis verkauft haben.</li>
          <li>Eine Flamme ist ein Hinweis, kein Versprechen. Zustand, Versand und Verkäufer schaust du dir selbst an.</li></ul>
        <p class="small muted">Flammen gibt’s nur, wenn Leute ihre Verkäufe eintragen – über „Verkauf eintragen“ oder im Bestand mit „verkauft“.</p></div>
      <button class="btn block" data-act="flipForm">${I.plus}Eigenen Verkauf eintragen</button>`);
  }

  function moreSheet() {
    sheet(`<h2>Mehr</h2>
      <div class="morelist">
        <a class="morei" href="#/bestand">${I.box}<span><b>Bestand &amp; Steuer</b><span class="small muted">Was du gekauft und verkauft hast, und wann das Finanzamt Post kriegt</span></span></a>
        <button class="morei" data-act="flipForm">${I.plus}<span><b>Verkauf eintragen</b><span class="small muted">Macht Flammen und Marktpreis ehrlicher. Dein Kaufpreis bleibt bei dir.</span></span></button>
        <button class="morei" data-act="settings">${I.gear}<span><b>Einstellungen</b><span class="small muted">Wie streng ich bewerte, dein Konto${S.features?.ai ? ", KI-Guthaben (Demo)" : ""}</span></span></button>
      </div>`);
  }

  // ---------- Einstellungen ----------
  function settingsSheet() {
    const o = opts();
    const sl = (k, l, min, max, step, fmt) => `<label class="f"><span>${l}: <b data-o="${k}">${fmt(o[k])}</b></span><input type="range" name="${k}" min="${min}" max="${max}" step="${step}" value="${o[k]}" data-fmt="${k}"></label>`;
    const fm = { minDiscount: (v) => v + " %", aucDiscount: (v) => v + " %" };
    sheet(`<h2>Einstellungen</h2>
      <h3 class="h3">Wie streng ich bin</h3>
      <p class="small muted" style="margin:-4px 0 12px">Ich vergleiche den Preis mit Versand gegen den Marktpreis – den Median vergleichbarer Sofort-Kaufen-Angebote.</p>
      <form id="stf">
      ${sl("minDiscount", "Abzeichen „unter Markt“ ab", 5, 40, 1, fm.minDiscount)}
      ${sl("aucDiscount", "Auktion „Günstig bis“ = Marktpreis minus", 0, 30, 1, fm.aucDiscount)}
      <button class="btn pri block">Übernehmen</button></form>
      <h3 class="h3" style="margin-top:22px">Du</h3>
      <div class="card"><div class="row"><div>${avatar(S.me?.display_name)}</div><div style="flex:1"><b>${esc(S.me?.display_name || "")}</b><div class="small dim">${S.be.mode === "demo" ? "Demo-Modus – nichts verlässt dein Gerät" : "@" + esc(S.me?.username || "")}</div></div></div>
        <div class="btns" style="margin-top:12px">${S.be.mode === "demo" ? `<button class="btn" data-act="demoReset">Demo zurücksetzen</button><button class="btn" data-act="logout">${HAS_LIVE ? "Zur Anmeldung" : "Beenden"}</button>` : `<button class="btn" data-act="logout">Abmelden</button><button class="btn danger" data-act="delAcc">Konto löschen</button>`}</div></div>
      ${S.features?.ai ? `<h3 class="h3" style="margin-top:22px">KI-Guthaben <span class="pill demo">Demo</span></h3><div id="aiprof"><div class="sk" style="height:140px"></div></div>` : ""}
      <p class="tiny dim" style="margin-top:16px;line-height:1.55">Angebotsdaten über die offizielle eBay Browse API. Hotflip ist ein unabhängiges Werkzeug und nicht mit eBay verbunden; „eBay“ ist eine Marke der eBay Inc. Marktpreise und Ersparnisse sind Schätzungen aus aktuellen Angeboten, ohne Gewähr. Links zu eBay können Partner-Links sein (eBay Partner Network) – für dich ändert sich der Preis nicht. Keine Steuer- oder Rechtsberatung.</p>${LEGAL}`, (sh) => {
      $$("input[type=range]", sh).forEach((r) => { const u = () => { sh.querySelector(`[data-o="${r.name}"]`).textContent = fm[r.name](r.value); r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min)) * 100 + "%"); }; r.oninput = u; u(); });
      if (S.features?.ai) renderAiProfile(sh.querySelector("#aiprof"));
      sh.querySelector("#stf").onsubmit = async (e) => {
        e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const s = {};
        for (const [k, v] of Object.entries(f)) s[k] = Number(v);
        Object.assign(S.settings, s);
        try { await S.be.settingsSave(s); } catch (er) { fail(er); }
        if (S.search.res) evaluateNow();
        closeSheet(); toast("Passt. Übernommen."); render();
      };
    });
  }

  // ---------- Anmeldung ----------
  function viewAuth(tab = "login") {
    const bon = [["Was du sparst", "in €"], ["Hüllen & Kaputtes", "raus"], ["Flammen", "echte Verkäufe"], ["Lauern, Bestand, DAC7", "dabei"]];
    document.getElementById("app").innerHTML = `<div class="auth view"><div class="brandtag"><span class="hole"></span>Hotflip</div>
      <h1 class="claim">Zu teuer – oder ein&nbsp;Ding?</h1>
      <p class="claimsub">Ich kenn die eBay-Preise und sag’s dir ehrlich. Für Schnäppchenjäger und Reseller – und jeden, der nicht draufzahlen will.</p>
      <div class="bon feats">${bon.map(([a, b]) => `<div class="bl"><span>${a}</span><i></i><b>${b}</b></div>`).join("")}</div>
      ${HAS_LIVE ? `<div class="seg" style="width:100%;margin-bottom:14px"><button class="${tab === "login" ? "on" : ""}" data-act="atab" data-v="login">Anmelden</button><button class="${tab === "signup" ? "on" : ""}" data-act="atab" data-v="signup">Registrieren</button></div>
      <form id="af">${tab === "signup" ? `<label class="f"><span>Anzeigename</span><input class="in1" name="name" maxlength="40" autocomplete="nickname" placeholder="So sehen dich die anderen"></label>` : ""}
        <label class="f"><span>Benutzername</span><input class="in1" name="u" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_.\\-]{3,24}" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
        <label class="f"><span>Passwort</span><input class="in1" name="p" type="password" required minlength="8" maxlength="72" autocomplete="${tab === "signup" ? "new-password" : "current-password"}"></label>
        ${tab === "signup" ? `<label class="row small muted" style="margin-bottom:12px;align-items:flex-start"><input type="checkbox" name="c" required style="margin-top:3px"> <span>Ich habe verstanden: Benutzername, Anzeigename und meine Community-Beiträge sind für andere Mitglieder sichtbar; Suchaufträge und Bestand nur für mich.</span></label>` : ""}
        <button class="btn pri block">${tab === "signup" ? "Konto erstellen" : "Anmelden"}</button></form><div class="or">oder</div>` : ""}
      <button class="btn block ${HAS_LIVE ? "" : "pri"}" data-act="demo">Erst mal gucken – ohne Konto (Beispieldaten)</button>
      <p class="legal">Nutzt ausschließlich die offizielle eBay-Schnittstelle. Unabhängig, nicht mit eBay verbunden. Alle Werte sind Schätzungen ohne Gewähr. Mit der Registrierung akzeptierst du die <a href="regeln.html">Nutzungsbedingungen</a>; Infos zum <a href="datenschutz.html">Datenschutz</a>.</p>${LEGAL}</div>`;
    const f = $("#af");
    if (f) f.onsubmit = async (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const btn = f.querySelector("button.pri"); btn.disabled = true;
      try { S.be = liveBackend(); if (tab === "signup") await S.be.signup(d.u, d.p, d.name || d.u); else await S.be.login(d.u, d.p); localStorage.removeItem("fr_mode"); await start(); }
      catch (er) { fail(er); btn.disabled = false; }
    };
  }

  // ---------- Router ----------
  function route() { const h = location.hash || "#/"; if (h.startsWith("#/item/") || h.startsWith("#/deal/")) return "detail"; if (h.startsWith("#/restock/") || h.startsWith("#/post/")) return "community"; return { "#/community": "community", "#/watch": "watch", "#/bestand": "bestand" }[h] || "radar"; }
  async function render() {
    if (!S.be || !S.me) return;
    closeSheet();
    const h = location.hash || "#/";
    if (h.startsWith("#/item/")) {
      const id = decodeURIComponent(h.slice(7));
      let x = S.search.res?.items.find((i) => i.itemId === id);
      if (!x && id.startsWith("demo|")) {
        const p = window.FR_MOCK.PRODUCTS.find((pp) => pp.id === id.split("|")[1]);
        if (p) { S.search.q = p.q; S.search.raw = await S.be.search(p.q); S.search.evalQ = p.q; S.search.sold = await S.be.soldFor(E.productKey(p.q)); evaluateNow(); x = S.search.res.items.find((i) => i.itemId === id); }
      }
      if (!x) { const did = await S.be.dealByItem(id).catch(() => null); if (did) { location.replace("#/deal/" + did); return; } location.replace("#/"); return; }
      return viewDetail(vmFromItem(x));
    }
    if (h.startsWith("#/deal/")) {
      const d = await S.be.deal(decodeURIComponent(h.slice(7))).catch(() => null);
      if (!d) { toast("Den Deal gibt’s nicht mehr.", true); location.replace("#/community"); return; }
      const live = S.search.res?.items.find((i) => i.itemId === d.item_id);
      return viewDetail(live ? { ...vmFromItem(live), dealId: d.id } : vmFromDeal(d));
    }
    if (h.startsWith("#/restock/")) return viewRestock(decodeURIComponent(h.slice(10)));
    if (h.startsWith("#/post/")) return viewPost(decodeURIComponent(h.slice(7)));
    const r = route();
    if (r === "community") return viewCommunity();
    if (r === "watch") return viewWatch();
    if (r === "bestand") return viewBestand();
    viewRadar(); if (!S.search.res && !S.search.loading) loadHotPreview();
  }

  // ---------- Aktionen ----------
  // Auktionen: keinen Score/„unter Markt“ aus dem Zwischengebot teilen. Keine Wiederverkaufs-/Gewinnwerte mehr.
  const sharePayload = (vm, note) => ({ itemId: vm.itemId, query: vm.query, title: vm.title, image: vm.image, url: vm.url, cond: vm.cond, total: vm.total, market: vm.market, score: vm.auction ? (vm.score ?? undefined) : vm.score, under: vm.auction ? undefined : vm.under, endDate: vm.auction ? vm.endDate : null, note });
  const ACT = {
    q: (el) => runSearch(el.dataset.q),
    cond: (el) => { S.search.cond = el.dataset.v; loadFiltered(); },
    buy: (el) => { const s = S.search; s.buy = el.dataset.v;
      if (s.buy === "auktion" && s.sort === "score") { s.sort = "ending"; s.autoSort = true; } else if (s.buy !== "auktion" && s.autoSort && s.sort === "ending") { s.sort = "score"; s.autoSort = false; }
      loadFiltered(); },
    rej: () => { S.search.showRej = !S.search.showRej; viewRadar(); },
    settings: () => settingsSheet(),
    back: () => (history.length > 1 ? history.back() : (location.hash = "#/")),
    openDeal: (el) => (location.hash = "#/deal/" + encodeURIComponent(el.dataset.id)),
    ftab: (el) => { S.feedTab = el.dataset.v; if (location.hash !== "#/community") location.hash = "#/community"; else viewCommunity(); },
    atab: (el) => viewAuth(el.dataset.v),
    share: () => {
      if (!VM) return;
      sheet(`<h2>Zeig’s den anderen</h2><div class="row" style="margin-bottom:14px"><div class="thumb" style="width:56px;height:56px;border-radius:12px">${thumb(VM.image)}</div><div class="small"><b>${esc(VM.title)}</b><div class="muted">${eur2(VM.total)} · Score ${VM.score}</div></div></div>
        <form id="shf"><label class="f"><span>Notiz für die Community (optional)</span><input class="in1" name="note" maxlength="280" placeholder="z. B. Preisvorschlag lohnt sich"></label><button class="btn vio block">${I.share}Teilen</button></form>`, (sh) => {
        sh.querySelector("#shf").onsubmit = async (e) => {
          e.preventDefault();
          try { const r = await S.be.shareDeal(sharePayload(VM, e.target.note.value.trim())); VM.dealId = r.id; closeSheet(); toast(r.existed ? "Hatte schon wer geteilt." : "Geteilt. Mal sehen, was die Leute sagen."); loadDealCommunity(VM); }
          catch (er) { fail(er); }
        };
      });
    },
    vote: async (el) => { // nur noch „hilfreich“ bei Wissens-Beiträgen
      const id = el.dataset.id, on = el.classList.contains("on");
      try {
        await S.be.vote("post", id, on ? 0 : 1);
        if (location.hash.startsWith("#/post/")) return render();
        const card = el.closest(".post"); if (!card) return;
        const d = await S.be.post(id); if (!d) return;
        const tmp = document.createElement("div"); tmp.innerHTML = postCard(d);
        tmp.firstElementChild.style.animation = "none"; card.replaceWith(tmp.firstElementChild);
      } catch (er) { fail(er); }
    },
    flameInfo: () => flameInfo(),
    more: () => moreSheet(),
    flipForm: () => flipForm(route() === "detail" && VM ? { title: VM.query, cond: VM.cond } : {}),
    cdel: async (el) => { if (!confirm("Kommentar löschen?")) return; try { await S.be.commentDelete(el.dataset.id); if (/^#\/(item|deal)\//.test(location.hash) && VM) loadDealCommunity(VM); else render(); } catch (er) { fail(er); } },
    openRestock: (el) => (location.hash = "#/restock/" + encodeURIComponent(el.dataset.id)),
    openPost: (el) => (location.hash = "#/post/" + encodeURIComponent(el.dataset.id)),
    restockNew: () => restockForm(),
    postNew: () => postForm({ niche: S.niche !== "alle" ? S.niche : "sonstiges" }),
    niche: (el) => { S.niche = el.dataset.v; viewCommunity(); },
    rstatus: async (el) => { if (!confirm(el.dataset.v === "ausverkauft" ? "Als ausverkauft melden?" : "Als abgelaufen melden?")) return; try { await S.be.restockStatus(el.dataset.id, el.dataset.v); toast("Danke, ist vermerkt."); render(); } catch (er) { fail(er); } },
    rdel: async (el) => { if (!confirm("Restock-Deal löschen?")) return; try { await S.be.restockDelete(el.dataset.id); location.hash = "#/community"; } catch (er) { fail(er); } },
    report: (el) => reportForm(el.dataset.kind, el.dataset.id),
    pdel: async (el) => { if (!confirm("Beitrag löschen?")) return; try { await S.be.postDelete(el.dataset.id); location.hash = "#/community"; } catch (er) { fail(er); } },
    toInv: () => invForm({ title: VM.title, buy_price: VM.total, buy_costs: 0, platform_bought: "eBay", condition: VM.cond, query: VM.query, status: "lager", note: VM.url && VM.url !== "#" && !VM.demo ? VM.url.slice(0, 500) : "" }),
    watchFromSearch: () => watchForm({ query: S.search.evalQ, condition: S.search.cond === "neu" ? "neu" : S.search.cond === "alle" ? "alle" : "gebraucht", min_discount: opts().minDiscount }),
    watchFromDeal: () => watchForm({ query: VM.query, condition: VM.cond === "neu" ? "neu" : "gebraucht", min_discount: opts().minDiscount }),
    watchNew: () => watchForm(),
    watchEdit: (el) => watchForm(S._watches.find((w) => w.id === el.dataset.id)),
    watchRun: async (el) => { el.disabled = true; el.textContent = "…"; try { const r = await S.be.watchRun(el.dataset.id); toast(r.added ? `${r.added} neu gefunden!` : r.error ? r.error : "Nix Neues. Ich bleib dran."); viewWatch(); } catch (er) { fail(er); el.disabled = false; el.textContent = "Prüfen"; } },
    invNew: () => invForm(),
    invEdit: (el) => invView(S._inv.find((x) => x.id === el.dataset.id)),
    ebayConnect: async (el) => {
      el.disabled = true;
      try { const r = await S.be.ebayConnect(); if (r.url) { location.href = r.url; return; } toast("eBay verbunden (Demo)"); await ACT.ebaySync(null, true); } catch (er) { fail(er); el.disabled = false; }
    },
    ebaySync: async (el, quiet = false) => {
      if (el) { el.disabled = true; el.textContent = "Gleiche ab …"; }
      try { const r = await S.be.ebaySync(); toast(`eBay abgeglichen: ${r.created} neu, ${r.updated} aktualisiert`); } catch (er) { if (!quiet || el) fail(er); else console.warn(er); }
      if (route() === "bestand") viewBestand();
    },
    ebayDisconnect: async () => {
      if (!confirm("eBay-Verbindung trennen? Die Zugangs-Tokens werden sofort gelöscht. Bereits übernommene Einträge bleiben im Bestand.")) return;
      try { await S.be.ebayDisconnect(); toast("eBay getrennt – Tokens gelöscht"); viewBestand(); } catch (er) { fail(er); }
    },
    aiOpen: () => aiSheet(),
    aiBook: async (el) => {
      el.disabled = true;
      try { const r = await S.be.aiBook(); toast(r.kind === "book" ? "Hotflip Pro (Demo) gebucht – Testguthaben freigeschaltet, nichts bezahlt" : "Testguthaben nachgebucht (Demo, ohne Zahlung)"); }
      catch (er) { fail(er); }
      for (const id of ["#aiprof", "#aiprof2"]) if ($(id)) renderAiProfile($(id));
      if (route() === "detail") aiDetailState();
    },
    aiCheck: async (el) => {
      if (!VM) return; el.disabled = true; const label = el.innerHTML; el.innerHTML = `${I.spark}Analysiere …`;
      const box = $("#aires");
      try {
        const r = await S.be.aiCheck({ itemId: VM.itemId, title: VM.title, query: VM.query, cond: VM.cond, total: VM.total, market: VM.market, under: VM.under, flags: VM.flags || [] });
        if (box) box.innerHTML = aiResultCard(r);
        const v = E.AI.view(r.wallet); toast(`KI-Check (Demo): ${String(r.usage.cost_ct).replace(".", ",")} ct abgebucht – noch ${ct2eur(v.rest_ct)}`);
      } catch (er) { fail(er); }
      el.innerHTML = label; await aiDetailState();
    },
    soldForm: () => flipForm(route() === "detail" && VM ? { title: VM.query, cond: VM.cond } : { title: S.search.evalQ || "" }),
    demo: async () => { localStorage.setItem("fr_mode", "demo"); S.be = window.FR_DEMO_BACKEND(); await start(); },
    demoReset: async () => { await S.be.reset(); Object.assign(S.search, { res: null, raw: null, q: "" }); S.settings = {}; closeSheet(); toast("Alles auf Anfang."); await start(); },
    logout: async () => { await S.be.logout(); localStorage.removeItem("fr_mode"); S.me = null; S.be = null; closeSheet(); Object.assign(S.search, { res: null, raw: null, q: "" }); location.hash = "#/"; viewAuth(); },
    delAcc: async () => {
      if (!confirm("Konto endgültig löschen? Suchaufträge und Bestand werden gelöscht, Community-Beiträge bleiben anonym erhalten.")) return;
      try { await S.be.deleteAccount(); S.me = null; closeSheet(); toast("Konto gelöscht"); viewAuth(); } catch (er) { fail(er); }
    },
  };
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const fn = ACT[el.dataset.act]; if (!fn) return;
    e.preventDefault(); e.stopPropagation(); fn(el);
  });
  document.addEventListener("change", (e) => { if (e.target.id === "sort") { S.search.sort = e.target.value; S.search.autoSort = false; viewRadar(); } });
  window.addEventListener("hashchange", render);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

  // ---------- Start ----------
  async function start() {
    const m = await S.be.me();
    S.me = m.profile; S.settings = m.settings || {}; S.ebay = !!m.ebay; S.features = m.features || {}; S.affiliate = m.affiliate ?? S.be.mode === "demo";
    try { S.unseen = (await S.be.hits()).filter((h) => !h.seen).length; } catch { S.unseen = 0; }
    const eb = new URLSearchParams(location.search).get("ebay");
    if (eb) {
      history.replaceState(null, "", location.pathname + (location.hash || "#/bestand"));
      const msg = { verbunden: ["eBay verbunden – Bestellungen werden abgeglichen", false], abgelehnt: ["eBay-Verbindung abgebrochen", true], abgelaufen: ["Anfrage abgelaufen – bitte erneut verbinden", true], aus: ["„eBay verbinden“ ist noch nicht freigeschaltet", true] }[eb] || ["eBay-Verbindung fehlgeschlagen", true];
      setTimeout(() => toast(...msg), 400);
    }
    await render();
  }
  async function boot() {
    window.addEventListener("error", (e) => S.be?.logError?.(String(e.message)));
    window.addEventListener("unhandledrejection", (e) => S.be?.logError?.(String(e.reason?.message || e.reason)));
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
    if (localStorage.getItem("fr_mode") === "demo" || !HAS_LIVE) {
      if (localStorage.getItem("fr_mode") === "demo") { S.be = window.FR_DEMO_BACKEND(); return start(); }
      return viewAuth();
    }
    S.be = liveBackend();
    try { if (await S.be.session()) return await start(); } catch (e) { console.warn(e); }
    viewAuth();
  }
  boot();
})();
