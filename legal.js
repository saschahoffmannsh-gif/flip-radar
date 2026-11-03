// Zeigt in der Datenschutzerklärung live an, ob Affiliate-Links, KI-Filter, DHL-Sendungsverfolgung und „eBay verbinden“ gerade aktiv sind (ohne JS bleibt der Text gültig).
(async () => {
  const c = window.FR_CONFIG || {}, set = (id, on, txt) => { const el = document.getElementById(id); if (el) { el.textContent = txt; el.classList.toggle("on", on); } };
  if (!c.supabaseUrl) { set("st-aff", false, "Status: Demo-Modus, keine echten Links"); set("st-llm", false, "Status: nicht aktiv"); set("st-dhl", false, "Status: Demo-Modus, simulierter Status – keine Übermittlung"); set("st-ebc", false, "Status: Demo-Modus, Beispieldaten – keine Verbindung zu eBay"); return; }
  try {
    const r = await fetch(`${c.supabaseUrl}/functions/v1/${c.searchFunction || "fr-search"}`, { method: "POST", headers: { "content-type": "application/json", apikey: c.supabaseAnonKey }, body: '{"action":"status"}' });
    const s = await r.json();
    set("st-aff", !!s.affiliate, s.affiliate ? "Status: aktiv" : "Status: derzeit nicht aktiv");
    set("st-dhl", !!s.dhl, s.dhl ? "Status: aktiv" : "Status: derzeit nicht aktiv (nur Link zur DHL-Seite)");
    set("st-ebc", !!s.ebayConnect, s.ebayConnect ? "Status: aktiv" : "Status: derzeit nicht aktiv");
    set("st-llm", !!s.llm, s.llm ? `Status: aktiv (Anbieter-Server: ${s.llm})` : "Status: derzeit nicht aktiv");
  } catch { /* Status unbekannt – Text gilt unverändert */ }
})();
