/* Hotflip – Beispieldaten für den Demo-Modus (keine echten eBay-Angebote!).
 * Vier Produkte mit realistischen Angebotsmustern (Stand Nov. 2026, Preise geschätzt): normale Angebote,
 * echte Schnäppchen, Auktionen, Zubehör, Defektes, falsche Modelle/Speicher, Bundles, Gesuche.
 * Seeded Zufall → bei jedem Aufruf dieselben Daten. Zeitangaben relativ zu „jetzt“. */
(function () {
  "use strict";
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const CITIES = [["10115", "Berlin"], ["20095", "Hamburg"], ["80331", "München"], ["50667", "Köln"], ["60311", "Frankfurt"], ["70173", "Stuttgart"], ["04109", "Leipzig"], ["44135", "Dortmund"], ["28195", "Bremen"], ["01067", "Dresden"], ["30159", "Hannover"], ["90402", "Nürnberg"], ["24103", "Kiel"], ["48143", "Münster"], ["66111", "Saarbrücken"], ["18055", "Rostock"]];
  const SELLERS = ["technik-kiste", "maxi_m84", "lena.verkauft", "retro-hub", "s.krueger", "flohmarkt_queen", "gadgetwerk", "jonas_b", "ankauf-nord", "miri_1990", "pixelbox", "der.hannes", "kiezfund", "elektro-erbe", "sabine.k", "tom-trader", "mobilfix24", "konsolenecke", "nordlicht_87", "secondloop"];
  const COND = { 1000: "Neu", 1500: "Neu: Sonstige (siehe Artikelbeschreibung)", 2010: "Hervorragend – Refurbished", 3000: "Gebraucht", 4000: "Sehr gut", 5000: "Gut", 6000: "Akzeptabel", 7000: "Als Ersatzteil / defekt" };

  const PRODUCTS = [
    {
      id: "iphone13", q: "iPhone 13 128 GB", kind: "phone", hue: 212, used: 335, neu: 489, ship: [0, 0, 4.99, 5.49, 6.99],
      used_titles: ["Apple iPhone 13 128GB Mitternacht – Top Zustand", "iPhone 13 128 GB Blau, Akku 89 %", "Apple iPhone 13 128GB Polarstern sehr gut", "iPhone 13 128GB (PRODUCT)RED gebraucht", "Apple iPhone 13 – 128 GB – Grün – entsperrt", "iPhone 13 128GB Rosé mit OVP", "Apple iPhone 13 128GB Schwarz, Akku 92%", "iPhone 13 128 GB Mitternacht inkl. Hülle", "Apple iPhone 13 128GB Blau – kleine Kratzer", "iPhone 13 128GB weiß – wie neu", "Apple iPhone 13 128 GB Polarstern, Rechnung vorhanden", "iPhone 13 128GB Mitternacht Akku 86%", "Apple iPhone 13 128GB Grün, Displayschutz drauf", "iPhone 13 128GB rot guter Zustand"],
      new_titles: ["Apple iPhone 13 128GB Mitternacht NEU OVP versiegelt", "iPhone 13 128 GB Blau – neu & ungeöffnet", "Apple iPhone 13 128GB Polarstern NEU"],
      deal_titles: ["iPhone 13 128GB Blau – Umzug, muss weg", "Apple iPhone 13 128 GB Mitternacht, Akku 88 %", "iPhone 13 128GB Polarstern – Schnellverkauf"],
      auction: ["Apple iPhone 13 128GB Grün – Auktion ab 1 €", "iPhone 13 128GB Mitternacht Auktion"],
      junk: [["Silikon Hülle für iPhone 13 MagSafe Schwarz", 12.99, 3000], ["2x Panzerglas iPhone 13 Schutzglas 9H", 6.49, 1000], ["iPhone 13 128GB Display defekt, iCloud frei", 129, 7000], ["Apple iPhone 13 Pro 128GB Graphit", 449, 3000], ["iPhone 13 mini 128 GB Rosé", 279, 3000], ["Apple iPhone 13 256GB Blau", 389, 3000], ["Suche iPhone 13 128GB – zahle bar", 300, 3000], ["iPhone 12 128GB Schwarz", 239, 3000], ["iPhone 13 128GB Bastler – Face ID geht nicht", 169, 3000]],
    },
    {
      id: "ps5", q: "PlayStation 5 Disc Edition", kind: "console", hue: 228, used: 339, neu: 469, ship: [0, 6.99, 7.49, 9.99],
      used_titles: ["Sony PlayStation 5 Disc Edition 825GB – inkl. Controller", "PS5 Disc Edition Konsole, sehr guter Zustand", "PlayStation 5 Standard (Disc) mit OVP", "Sony PS5 Disc Edition CFI-1216A gebraucht", "PlayStation 5 Disc Edition – kaum benutzt", "PS5 Konsole Disc Edition weiß, Rechnung", "Sony PlayStation 5 Disc Edition 825 GB", "PS5 Disc Edition inkl. Originalverpackung", "PlayStation 5 Disc Edition, leise, top", "Sony PS5 Disc Edition – gereinigt & getestet", "PlayStation 5 Disc Edition 1. Gen", "PS5 Disc Edition guter Zustand, Abholung möglich"],
      new_titles: ["Sony PlayStation 5 Disc Edition NEU OVP", "PS5 Disc Edition Slim NEU versiegelt", "PlayStation 5 Disc Edition – neu, Garantie"],
      deal_titles: ["PS5 Disc Edition – Sohn zieht aus, schnell weg", "PlayStation 5 Disc Edition mit Controller, wenig genutzt"],
      auction: ["Sony PS5 Disc Edition – Auktion", "PlayStation 5 Disc Edition 825GB Auktion ab 1 €"],
      junk: [["DualSense Wireless Controller für PS5 Weiß", 49.99, 3000], ["PS5 Ladestation für 2 Controller", 17.99, 1000], ["PlayStation 5 Digital Edition 825GB", 279, 3000], ["PS5 Disc Edition defekt – kein Bild (HDMI)", 119, 7000], ["PS5 Disc Edition Bundle + 5 Spiele + 2 Controller", 489, 3000], ["Nur OVP / Karton PlayStation 5 Disc", 14.5, 3000], ["Suche PS5 Disc – bis 300 €", 300, 3000], ["PS5 Disc Bastler – Laufwerk liest nicht", 149, 3000]],
    },
    {
      id: "switcholed", q: "Nintendo Switch OLED", kind: "handheld", hue: 0, used: 219, neu: 299, ship: [0, 5.49, 6.99],
      used_titles: ["Nintendo Switch OLED Weiß – sehr gut", "Nintendo Switch OLED Neon-Rot/Neon-Blau mit OVP", "Switch OLED Modell, wenig gespielt", "Nintendo Switch (OLED-Modell) weiß gebraucht", "Nintendo Switch OLED Konsole + Dock", "Nintendo Switch OLED – Schutzfolie seit Tag 1", "Nintendo Switch OLED weiß, Rechnung 2024", "Switch OLED Neon gebraucht, voll funktionsfähig", "Nintendo Switch OLED – top gepflegt", "Nintendo Switch OLED Zelda Edition", "Nintendo Switch OLED Weiß, kleine Gebrauchsspuren", "Nintendo Switch OLED komplett"],
      new_titles: ["Nintendo Switch OLED Weiß NEU OVP", "Nintendo Switch OLED-Modell Neon NEU", "Switch OLED neu & versiegelt"],
      deal_titles: ["Nintendo Switch OLED weiß – Kind spielt nicht mehr", "Switch OLED Neon, Akku top – schnell weg"],
      auction: ["Nintendo Switch OLED – Auktion", "Nintendo Switch OLED Weiß Auktion"],
      junk: [["Nintendo Switch Lite Türkis", 129, 3000], ["Nintendo Switch Konsole Neon (2019)", 169, 3000], ["Joy-Con Paar Neon für Switch OLED", 49, 3000], ["Tragetasche Switch OLED Hartschale", 11.99, 1000], ["Switch OLED defekt – Joy-Con Drift, Display Riss", 89, 7000], ["Nintendo Switch OLED + 4 Spiele Paket", 329, 3000], ["Tausche Switch OLED gegen PS5", 0, 3000]],
    },
    {
      id: "xm4", q: "Sony WH-1000XM4", kind: "headphones", hue: 30, used: 124, neu: 219, ship: [0, 4.99, 5.49],
      used_titles: ["Sony WH-1000XM4 Noise Cancelling Kopfhörer Schwarz", "Sony WH-1000XM4 Silber – sehr gut", "WH-1000XM4 Bluetooth Kopfhörer mit Case", "Sony WH-1000XM4 schwarz gebraucht, OVP", "Sony WH1000XM4 Over-Ear, top Klang", "Sony WH-1000XM4 Mitternachtsblau", "Sony WH-1000XM4 – wenig genutzt, Rechnung", "WH-1000XM4 Kopfhörer, neue Polster", "Sony WH-1000XM4 Silber mit Kabel & Etui", "Sony WH-1000XM4 Kopfhörer, gepflegt", "Sony WH-1000XM4 schwarz – leichte Spuren", "Sony WH-1000XM4 ANC, komplett"],
      new_titles: ["Sony WH-1000XM4 Schwarz NEU OVP", "Sony WH-1000XM4 Silber – neu, ungeöffnet"],
      deal_titles: ["Sony WH-1000XM4 schwarz – Fehlkauf, kaum getragen", "Sony WH-1000XM4 Silber, Haushaltsauflösung"],
      auction: ["Sony WH-1000XM4 – Auktion ab 1 €", "Sony WH-1000XM4 Kopfhörer Auktion"],
      junk: [["Ersatz Ohrpolster für Sony WH-1000XM4", 13.99, 1000], ["Sony WH-1000XM5 Schwarz", 189, 3000], ["Sony WH-1000XM3 Kopfhörer", 79, 3000], ["Sony WH-1000XM4 defekt – linke Seite stumm", 39, 7000], ["Hartschalen Case für WH-1000XM4", 9.99, 1000], ["Sony WH-1000XM4 Bastler – knackt", 45, 3000]],
    },
  ];

  function gauss(r) { return (r() + r() + r() - 1.5) / 1.5; }
  const r2 = (x) => Math.round(x * 100) / 100;
  const psy = (x) => { const e = Math.floor(x); const c = [0, 0.5, 0.9, 0.99][Math.floor((x - e) * 4) % 4]; return Math.max(1, e - (e % 5 === 0 ? 1 : 0) + c); };

  function listingsFor(p, now = Date.now()) {
    const r = rng(p.id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
    const out = []; let n = 0;
    const add = (title, price, condId, extra = {}) => {
      n++;
      const city = CITIES[Math.floor(r() * CITIES.length)];
      const fbN = Math.floor(Math.pow(10, 0.5 + r() * 3.4));
      const pick = (a) => a[Math.floor(r() * a.length)];
      out.push({
        itemId: `demo|${p.id}|${n}`, title, price: r2(price), currency: "EUR",
        shipping: extra.shipping ?? pick(p.ship), conditionId: condId, condition: COND[condId] || "Gebraucht",
        buyingOption: extra.auction ? "AUCTION" : "FIXED_PRICE", currentBid: extra.auction ? r2(price) : null, bids: extra.auction ? 1 + Math.floor(r() * 14) : null,
        endDate: extra.auction ? new Date(now + extra.endsIn).toISOString() : null,
        bestOffer: !extra.auction && r() < 0.35,
        seller: pick(SELLERS) + (r() < 0.3 ? String(Math.floor(r() * 90 + 10)) : ""), sellerFeedbackPct: r2(Math.min(100, 96 + r() * 4.2)), sellerFeedbackScore: fbN,
        location: `${city[0]} ${city[1]}`, createdAt: new Date(now - (extra.fresh ? r() * 4 : 6 + r() * 260) * 3600e3).toISOString(),
        image: `demo:${p.kind}:${p.hue}:${n % 5}`, url: `https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(p.q)}`, demo: true,
      });
    };
    for (const t of p.used_titles) add(t, psy(p.used * (1 + gauss(r) * 0.09) + 6), [3000, 4000, 5000, 3000, 2010][Math.floor(r() * 5)]);
    for (const t of p.new_titles) add(t, psy(p.neu * (1 + gauss(r) * 0.05)), r() < 0.7 ? 1000 : 1500);
    p.deal_titles.forEach((t, i) => add(t, psy(p.used * [0.64, 0.74, 0.79][i % 3]), 3000, { fresh: i === 0, shipping: 0 }));
    add(p.auction[0], psy(p.used * 0.71), 3000, { auction: true, endsIn: 95 * 60e3 });
    add(p.auction[1], psy(p.used * 0.38), 4000, { auction: true, endsIn: 3.2 * 864e5 });
    for (const [t, price, c] of p.junk) add(t, price || 1, c);
    // „Neu“ laut eBay-Zustand, Titel verrät Gebrauch → zählt als gebraucht („Neu laut Verkäufer?“)
    add(`${p.q} – ausgepackt, 2 Wochen alt, mit Rechnung`, psy(p.neu * 0.8), 1500);
    // Auktionen: Neuware mit niedrigem Zwischengebot (läuft noch 2 Tage) und eine, die in 40 Min. endet
    add(`${p.q} NEU – Auktion`, psy(p.neu * 0.42), 1500, { auction: true, endsIn: 2.1 * 864e5 });
    add(`${p.q} – Auktion endet heute`, psy(p.used * 0.66), 3000, { auction: true, endsIn: 40 * 60e3, shipping: 4.99 });
    // gemischte Reihenfolge wie bei eBay „Beste Ergebnisse“
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  // Community-Beispiele: gemeldete Verkaufspreise (price inkl. Versand, den der Käufer zahlte)
  const SOLD = {
    iphone13: [[309, "gebraucht", "eBay", 3], [319, "gebraucht", "eBay", 6], [295, "gebraucht", "Kleinanzeigen", 9], [329, "gebraucht", "eBay", 12], [314, "gebraucht", "Vinted", 15], [305, "gebraucht", "eBay", 21], [449, "neu", "eBay", 8]],
    ps5: [[319, "gebraucht", "eBay", 2], [329, "gebraucht", "Kleinanzeigen", 5], [309, "gebraucht", "eBay", 9], [335, "gebraucht", "eBay", 14], [299, "gebraucht", "Kleinanzeigen", 25]],
    switcholed: [[205, "gebraucht", "eBay", 4], [215, "gebraucht", "Kleinanzeigen", 7], [199, "gebraucht", "Vinted", 11], [225, "gebraucht", "eBay", 19], [279, "neu", "eBay", 10]],
    xm4: [[115, "gebraucht", "eBay", 3], [109, "gebraucht", "Vinted", 6], [119, "gebraucht", "Kleinanzeigen", 13], [105, "gebraucht", "eBay", 22]],
  };
  // Wiederverkäufe von Restock-Produkten (Neuware): [Restock-Index, Produkt, [[Preis, Tage her], …]] – Tage > 30 zählen nicht mehr für Flammen
  const RESTOCK_SOLD = [
    [0, "Pokémon Elite-Trainer-Box", [[79, 3], [84, 6], [89, 12], [95, 41]]],
    [1, "PlayStation 5 Pro", [[789, 4], [769, 9]]],
    [2, "LEGO Titanic 10294", [[799, 5], [829, 14], [845, 20]]],
    [3, "Nike Dunk Low Panda", [[149, 2], [139, 8], [159, 11], [135, 17]]],
    [4, "Sony WH-1000XM5", [[259, 10]]],
    [5, "Nintendo Switch OLED Zelda Edition", [[379, 6]]],
    [6, "LEGO Star Wars AT-AT 75313", []],
  ];
  const USERS = [["kiezfund", "Kiezfund"], ["resell_rike", "Rike"], ["flip.jo", "Jo"], ["techtom", "Tom"], ["nina_n", "Nina"], ["boxstopper", "Boxstopper"], ["haendler_hans", "Hans"]];
  const COMMENTS = [
    "Preis ist fair, aber auf den Akkuzustand achten – unter 85 % geht's schnell 30 € runter.",
    "Hab letzte Woche fast das gleiche für 315 € verkauft. Lohnt sich.",
    "Verkäufer hat gute Bewertungen, Preisvorschlag 10 % drunter klappt oft.",
    "Achtung, auf den Fotos sieht man einen Kratzer am Display.",
    "Schon weg 😅",
    "Lass dir die Rechnung schicken, dann kriegst du beim Wiederverkauf mehr.",
    "Bei Kleinanzeigen geht das Modell aktuell eher für 290–300 weg.",
  ];


  // Restocks & Neuware (Beispieldaten): [Titel, Händler, Link, Nische, Preis, UVP, Wiederverkauf geschätzt, Start in h, Ende in h, Status, Notiz, Bild]
  const RESTOCKS = [
    ["Pokémon TCG Elite-Trainer-Box – Restock", "Smyths Toys", "https://www.smythstoys.com/de/de-de", "sammelkarten", 54.99, 59.99, 84, -2, 6, "aktiv", "Max. 2 pro Kunde. Online und in vielen Filialen, Abholung möglich.", "demo:cards:350:1"],
    ["PS5 Pro wieder lieferbar – 50 € unter UVP", "MediaMarkt", "https://www.mediamarkt.de/", "konsolen", 749, 799, 780, -5, 14, "aktiv", "Lieferung in 2–3 Tagen. Mit Gutschein-Newsletter nochmal 5 % drauf.", "demo:console:230:2"],
    ["LEGO Icons Titanic 10294 wieder auf Lager", "LEGO Store", "https://www.lego.com/de-de", "lego", 679.99, 679.99, 820, -10, 52, "aktiv", "Mit Insiders-Punkten effektiv ~5 % günstiger. Läuft 2027 aus – langfristig spannend.", "demo:lego:12:0"],
    ["Nike Dunk Low „Panda“ – SNKRS-Drop", "Nike", "https://www.nike.com/de/launch", "sneaker", 119.99, 119.99, 155, 3, 27, "aktiv", "Drop um 9 Uhr. Größen 42–44 gehen am schnellsten.", "demo:sneaker:0:3"],
    ["Sony WH-1000XM5 Tagesdeal", "Otto", "https://www.otto.de/", "audio", 249, 349, 268, -8, 4, "aktiv", "Neuware, Händlergarantie. Marge dünn – eher für Bundles.", "demo:headphones:30:0"],
    ["Switch OLED Zelda Edition – Restock", "Amazon", "https://www.amazon.de/", "konsolen", 349.99, 359.99, 380, -40, -16, "abgelaufen", "War nach 20 Minuten weg.", "demo:handheld:0:1"],
    ["LEGO Star Wars UCS AT-AT – Aktion", "Galeria", "https://www.galeria.de/", "lego", 679.99, 849.99, 850, -30, 20, "ausverkauft", "Online ausverkauft, in Filialen evtl. noch Restbestand.", "demo:lego:210:2"],
  ];
  // Wissensecke (Beispieldaten): [Nische, Art, Titel, Text, Trend, Kennzahlen, Stunden her, Antworten]
  const POSTS = [
    ["lego", "analyse", "Auslaufende LEGO-Sets jetzt einlagern", "Sets mit offiziellem End-of-Life-Datum steigen nach dem Auslaufen im Schnitt um 20–40 % in 12 Monaten. Besonders gut: Icons, Technic-Supercars und UCS. Wichtig: OVP ohne Knicke – Sammler zahlen dafür.", "up", { avg_profit: 85, days_to_sell: 21, sell_through: 72 }, 5, ["Kann ich bestätigen, die Bugatti-Technic ging bei mir +60 % weg.", "Lagerplatz einrechnen! Große Kartons kosten auch beim Versand ordentlich."]],
    ["sammelkarten", "analyse", "Pokémon ETB: Restock-Boxen bringen 40–60 % Aufschlag", "Elite-Trainer-Boxen neuer Sets sind in den ersten 4 Wochen knapp. Wer zur UVP kauft, verkauft versiegelt mit deutlichem Aufschlag. Nach ca. 3 Monaten pendelt sich der Preis ein – nicht zu lange halten.", "up", { avg_profit: 28, days_to_sell: 6, sell_through: 88 }, 9, ["Achtung bei Kleinanzeigen: viele Fake-Folien. Nur mit Sicher bezahlen."]],
    ["konsolen", "analyse", "PS5 Disc nach dem Pro-Release: stabil bei ~320 €", "Die gebrauchte Disc-Edition hält sich seit Wochen bei 310–330 € Verkaufspreis. Einkauf unter 260 € inkl. Versand lohnt sich, darüber wird es eng. Controller-Drift ist der häufigste Rückgabegrund – vorher testen.", "flat", { avg_profit: 42, days_to_sell: 5, sell_through: 81 }, 20, []],
    ["audio", "analyse", "Sony XM4 rutscht – XM5-Angebote drücken den Preis", "Seit die XM5 öfter für unter 260 € neu zu haben sind, fallen gebrauchte XM4 Richtung 110 €. Nur noch mit Schnäppchen unter 80 € einsteigen.", "down", { avg_profit: 18, days_to_sell: 9, sell_through: 64 }, 30, ["Neue Ohrpolster für 12 € machen bei mir 15–20 € Unterschied im Verkauf."]],
    ["smartphones", "analyse", "iPhone 13: Akkuzustand ist der Preistreiber", "Unter 85 % Akkukapazität geht ein iPhone 13 rund 30–40 € günstiger weg. Ein neuer Akku kostet 60–90 € – lohnt sich meist nur bei 128 GB in Top-Zustand.", "up", { avg_profit: 55, days_to_sell: 4, sell_through: 86 }, 44, []],
    ["smartphones", "tipp", "iPhone-Ankauf: Checkliste in 2 Minuten", "1) iCloud abgemeldet? (Einstellungen → Name oben) 2) Akkuzustand ablesen 3) Face ID + Kameras testen 4) IMEI mit Karton vergleichen 5) Kein „Unbekanntes Teil“-Hinweis bei Display/Akku.", null, {}, 70, ["Ergänzung: Lautsprecher mit einer Sprachmemo testen.", "Und immer die Seriennummer bei Apple prüfen."]],
    ["sonstiges", "tipp", "Preisvorschlag: erst 85 %, dann auf 90 % gehen", "Bei Angeboten mit Preisvorschlag nehmen viele Verkäufer 90 % an. Starte bei 85 % mit freundlicher Nachricht („Abholung/Sofortzahlung“). Immer unter deinem Preislimit bleiben.", null, {}, 96, []],
    ["technik", "tipp", "Bessere Fotos = schneller verkauft", "Tageslicht, neutraler Hintergrund, 8–10 Fotos inkl. Seriennummer und Mängeln. Erstes Foto im Querformat mit Zubehör. Bringt bei mir im Schnitt 2–3 Tage schnelleren Verkauf.", null, {}, 120, []],
    ["konsolen", "frage", "Lohnt sich die Konsolenreinigung vor dem Verkauf?", "Hat jemand Erfahrung, ob eine gereinigte PS5 (Staub, Wärmeleitpaste) spürbar mehr bringt? Ich schwanke, ob sich die halbe Stunde lohnt.", null, {}, 3, ["Reinigen ja, aufschrauben nein – das Garantie-Siegel ist für Käufer wichtiger.", "„Gereinigt & getestet“ im Titel bringt bei mir mehr Klicks."]],
    ["sneaker", "frage", "Legit-Check für Dunks – was nutzt ihr?", "Kaufe öfter auf Vinted und will mich vor Fakes schützen. Welche Apps oder Merkmale prüft ihr?", null, {}, 14, ["Vinted bietet für Sneaker eine Echtheitsprüfung an, kostet aber extra.", "Innenlabel + Stitching an der Ferse. Und Box-Label mit Nike-Seite abgleichen."]],
  ];

  window.FR_MOCK = { PRODUCTS, listingsFor, SOLD, RESTOCK_SOLD, USERS, COMMENTS, RESTOCKS, POSTS, rng };
})();
