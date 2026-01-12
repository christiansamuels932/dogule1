const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./index-CSMdsR7_.js",
      "./components-CDhMLcLx.js",
      "./index-XUogh3Lo.js",
      "./kunden-BBFUy98K.js",
      "./httpClient-DjX31kqd.js",
      "./hunde-Df0udqB2.js",
      "./kurse-BUlwv0_9.js",
      "./index-DdAeRUoi.js",
      "./finanzen-C7TK8AhO.js",
      "./trainer-BTYLIueh.js",
      "./index-BGQHmloT.js",
      "./xlsxExport-4x6MQqhX.js",
      "./client-DHiLuc54.js",
      "./index-C2O-6xbA.js",
      "./routes-BDgDrvEz.js",
      "./index-CY7m1wBo.css",
      "./index-7ASn_Lh7.js",
      "./index-vXgh6eyi.js",
      "./waren-ruasiTJW.js",
      "./index-C1uw71rv.js",
      "./index-BwzW7Nmn.js",
      "./index-BaWoTqGQ.js",
      "./index-Cw88CSUk.js",
    ])
) => i.map((i) => d[i]);
(function () {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const a of document.querySelectorAll('link[rel="modulepreload"]')) i(a);
  new MutationObserver((a) => {
    for (const o of a)
      if (o.type === "childList")
        for (const d of o.addedNodes) d.tagName === "LINK" && d.rel === "modulepreload" && i(d);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(a) {
    const o = {};
    return (
      a.integrity && (o.integrity = a.integrity),
      a.referrerPolicy && (o.referrerPolicy = a.referrerPolicy),
      a.crossOrigin === "use-credentials"
        ? (o.credentials = "include")
        : a.crossOrigin === "anonymous"
          ? (o.credentials = "omit")
          : (o.credentials = "same-origin"),
      o
    );
  }
  function i(a) {
    if (a.ep) return;
    a.ep = !0;
    const o = n(a);
    fetch(a.href, o);
  }
})();
const G = "modulepreload",
  H = function (e, t) {
    return new URL(e, t).href;
  },
  N = {},
  c = function (t, n, i) {
    let a = Promise.resolve();
    if (n && n.length > 0) {
      let d = function (u) {
        return Promise.all(
          u.map((g) =>
            Promise.resolve(g).then(
              (_) => ({ status: "fulfilled", value: _ }),
              (_) => ({ status: "rejected", reason: _ })
            )
          )
        );
      };
      const r = document.getElementsByTagName("link"),
        l = document.querySelector("meta[property=csp-nonce]"),
        f = (l == null ? void 0 : l.nonce) || (l == null ? void 0 : l.getAttribute("nonce"));
      a = d(
        n.map((u) => {
          if (((u = H(u, i)), u in N)) return;
          N[u] = !0;
          const g = u.endsWith(".css"),
            _ = g ? '[rel="stylesheet"]' : "";
          if (!!i)
            for (let k = r.length - 1; k >= 0; k--) {
              const w = r[k];
              if (w.href === u && (!g || w.rel === "stylesheet")) return;
            }
          else if (document.querySelector(`link[href="${u}"]${_}`)) return;
          const m = document.createElement("link");
          if (
            ((m.rel = g ? "stylesheet" : G),
            g || (m.as = "script"),
            (m.crossOrigin = ""),
            (m.href = u),
            f && m.setAttribute("nonce", f),
            document.head.appendChild(m),
            g)
          )
            return new Promise((k, w) => {
              (m.addEventListener("load", k),
                m.addEventListener("error", () => w(new Error(`Unable to preload CSS for ${u}`))));
            });
        })
      );
    }
    function o(d) {
      const r = new Event("vite:preloadError", { cancelable: !0 });
      if (((r.payload = d), window.dispatchEvent(r), !r.defaultPrevented)) throw d;
    }
    return a.then((d) => {
      for (const r of d || []) r.status === "rejected" && o(r.reason);
      return t().catch(o);
    });
  },
  M = "" + new URL("fontanas-logo-BHHYmOkI.png", import.meta.url).href,
  $ = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <title>Dogule Layout</title>
    <link rel="stylesheet" href="../../modules/shared/shared.css" />
    <link rel="stylesheet" href="../../modules/shared/layout.css" />
  </head>
  <body class="dogule-layout">
    <header class="dogule-header">
      <div class="dogule-header-inner">
        <div class="dogule-header-bar">
          <div class="dogule-brand-card" aria-label="Dogule App Title">
            <img class="dogule-brand-logo" id="dogule-logo" alt="Fontanas DogWorld Logo" />
            <div class="dogule-brand-text">DOGULE</div>
          </div>
          <div class="dogule-auth" id="dogule-auth"></div>
        </div>
        <nav class="dogule-nav" aria-label="Layout Navigation">
          <a href="#/dashboard" class="nav__link" data-route="dashboard">Dashboard</a>
          <a href="#/kunden" class="nav__link" data-route="kunden">Kunden</a>
          <a href="#/hunde" class="nav__link" data-route="hunde">Hunde</a>
          <a href="#/kurse" class="nav__link" data-route="kurse">Kurse</a>
          <a href="#/trainer" class="nav__link" data-route="trainer">Trainer</a>
          <a href="#/zertifikate" class="nav__link" data-route="zertifikate">Zertifikate</a>
          <a href="#/kommunikation" class="nav__link" data-route="kommunikation"
            >Kommunikation</a
          >
          <a href="#/kalender" class="nav__link" data-route="kalender">Kalender</a>
          <a href="#/finanzen" class="nav__link" data-route="finanzen">Finanzen</a>
          <a href="#/waren" class="nav__link" data-route="waren">Waren</a>
        </nav>
      </div>
    </header>
    <main class="dogule-main" id="dogule-main" aria-live="polite">
      <h1>Layoutvorschau</h1>
      <p>
        Diese Seite demonstriert die gemeinsame Layoutstruktur mit Header, Navigation, Hauptbereich
        und Footer.
      </p>
      <p>
        Verwende die Klassen aus <code>layout.css</code>, um konsistente Oberflächen quer über alle
        Module zu gewährleisten.
      </p>
    </main>
    <footer class="dogule-footer">&copy; Dogule1 &ndash; Interne Werkzeuge</footer>
  </body>
</html>
`,
  U = `<!-- Shared UI templates for Dogule1 modules -->
<template id="dogule-card">
  <article class="dogule-card">
    <header class="dogule-card__header">
      <h3 class="dogule-card__title"></h3>
      <p class="dogule-card__subtitle"></p>
    </header>
    <div class="dogule-card__body"></div>
  </article>
</template>

<template id="dogule-alert">
  <section class="dogule-alert" role="status" aria-live="polite">
    <strong class="dogule-alert__title"></strong>
    <p class="dogule-alert__message"></p>
  </section>
</template>

<template id="ui-btn">
  <button class="ui-btn" type="button"></button>
</template>

<template id="ui-card">
  <article class="ui-card">
    <header class="ui-card__header">
      <p class="ui-card__eyebrow"></p>
      <h3 class="ui-card__title"></h3>
    </header>
    <div class="ui-card__body"></div>
    <footer class="ui-card__footer"></footer>
  </article>
</template>

<template id="ui-section">
  <section class="ui-section">
    <header class="ui-section__header">
      <h2 class="ui-section__title"></h2>
      <p class="ui-section__subtitle"></p>
    </header>
  </section>
</template>

<template id="ui-badge">
  <span class="ui-badge ui-badge--default"></span>
</template>

<template id="ui-notice">
  <section class="ui-notice ui-notice--info" role="status">
    <div class="ui-notice__content"></div>
  </section>
</template>

<template id="ui-empty">
  <section class="ui-empty">
    <h3 class="ui-empty__title"></h3>
    <p class="ui-empty__hint"></p>
    <div class="ui-empty__actions"></div>
  </section>
</template>

<template id="ui-form-row-template">
  <div class="ui-form-row">
    <label class="ui-form-row__label" for=""></label>
    <div class="ui-form-row__control"></div>
    <div class="ui-form-row__hint sr-only"></div>
  </div>
</template>
`,
  s = {
    kunden: [
      {
        id: "k1",
        code: "K-001",
        vorname: "Andrea",
        nachname: "Müller",
        geschlecht: "weiblich",
        email: "andrea.mueller@hundeschule.ch",
        telefon: "+41 44 123 45 67",
        adresse: "Bahnhofstrasse 12, 8001 Zürich",
        notizen: "Bringt Labrador Bello in den Kurs Anfänger 1 mit.",
        createdAt: "2025-01-10T08:30:00.000Z",
        updatedAt: "2025-02-05T17:45:00.000Z",
      },
      {
        id: "k2",
        code: "K-002",
        vorname: "Thomas",
        nachname: "Keller",
        geschlecht: "männlich",
        email: "thomas.keller@example.com",
        telefon: "+41 79 555 98 22",
        adresse: "Kirchweg 7, 8400 Winterthur",
        notizen: "Hund Rex reagiert sensibel auf laute Trainingsplätze.",
        createdAt: "2024-12-22T14:15:00.000Z",
        updatedAt: "2025-01-30T09:10:00.000Z",
      },
      {
        id: "k3",
        code: "K-003",
        vorname: "Lea",
        nachname: "Sommer",
        geschlecht: "weiblich",
        email: "lea.sommer@posteo.de",
        telefon: "+49 30 321 09 87",
        adresse: "Am Viktoriapark 3, 10965 Berlin",
        notizen: "Einzelcoaching mit Hündin Nala, arbeitet an Rückruf.",
        createdAt: "2025-02-01T10:00:00.000Z",
        updatedAt: "2025-02-12T16:20:00.000Z",
      },
    ],
    hunde: [
      {
        id: "hund-001",
        code: "H-001",
        name: "Bello vom Greifensee",
        rufname: "Bello",
        rasse: "Labrador Retriever",
        geschlecht: "Rüde",
        geburtsdatum: "2021-09-14",
        herkunft: "züchter",
        kastriert: !1,
        felltyp: "Kurzhaar",
        fellfarbe: "Gold",
        groesseTyp: "Groß",
        chipNummer: "978000000000001",
        gewichtKg: 30,
        groesseCm: 58,
        kundenId: "k1",
        trainingsziele: "Locker an der Leine, Impulskontrolle",
        notizen: "Sehr wasserfreudig, braucht Pausen nach Sprinteinheiten.",
        createdAt: "2024-11-20T09:00:00.000Z",
        updatedAt: "2025-02-04T15:35:00.000Z",
      },
      {
        id: "hund-002",
        code: "H-002",
        name: "Rex vom Stadtpark",
        rufname: "Rex",
        rasse: "Deutscher Schäferhund",
        geschlecht: "Rüde",
        geburtsdatum: "2020-03-02",
        herkunft: "privat",
        kastriert: !0,
        felltyp: "Langhaar",
        fellfarbe: "Schwarz",
        groesseTyp: "Groß",
        chipNummer: "978000000000002",
        gewichtKg: 34,
        groesseCm: 62,
        kundenId: "k2",
        trainingsziele: "Stadtsicherheit, Ruhe in Wartebereichen",
        notizen: "Reagiert sensibel auf laute Plätze, braucht klare Signale.",
        createdAt: "2024-10-12T11:45:00.000Z",
        updatedAt: "2025-01-15T08:10:00.000Z",
      },
      {
        id: "hund-003",
        code: "H-003",
        name: "Nala vom Viktoriapark",
        rufname: "Nala",
        rasse: "Border Collie",
        geschlecht: "Hündin",
        geburtsdatum: "2022-06-25",
        herkunft: "tierheim",
        kastriert: !1,
        felltyp: "Kurzhaar",
        fellfarbe: "Weiß-Schwarz",
        groesseTyp: "Mittel",
        chipNummer: "978000000000003",
        gewichtKg: 18,
        groesseCm: 52,
        kundenId: "k3",
        trainingsziele: "Rückruf, Impulskontrolle",
        notizen: "Braucht geistige Auslastung, liebt Nasenarbeit.",
        createdAt: "2024-12-05T07:30:00.000Z",
        updatedAt: "2025-02-11T13:20:00.000Z",
      },
    ],
    kurse: [
      {
        id: "course-001",
        code: "KS-001",
        title: "Welpentraining Kompakt",
        trainerName: "Martina Frei",
        trainerId: "t1",
        date: "2025-02-10",
        startTime: "09:00",
        endTime: "10:30",
        location: "Platz Nord, Zürich",
        ort: "Platz Nord, Zürich",
        status: "offen",
        capacity: 10,
        bookedCount: 6,
        level: "Welpen",
        price: 120,
        notes: "Fokus auf Bindung und Ruheübungen.",
        hundIds: ["hund-001"],
        createdAt: "2024-12-15T08:00:00.000Z",
        updatedAt: "2025-01-28T11:30:00.000Z",
      },
      {
        id: "course-002",
        code: "KS-002",
        title: "Junghunde Alltag",
        trainerName: "Jonas Graf",
        trainerId: "t2",
        date: "2025-03-05",
        startTime: "18:00",
        endTime: "19:30",
        location: "Citypark Winterthur",
        ort: "Citypark Winterthur",
        status: "ausgebucht",
        capacity: 8,
        bookedCount: 8,
        level: "Junghunde",
        price: 150,
        notes: "Stadttraining mit Ablenkung.",
        hundIds: ["hund-002"],
        createdAt: "2025-01-02T09:45:00.000Z",
        updatedAt: "2025-02-01T10:10:00.000Z",
      },
      {
        id: "course-003",
        code: "KS-003",
        title: "Mantrailing Einsteiger",
        trainerName: "Lena Vogt",
        trainerId: "t3",
        date: "2025-01-18",
        startTime: "14:00",
        endTime: "16:00",
        location: "Altstadt Bern",
        ort: "Altstadt Bern",
        status: "abgesagt",
        capacity: 6,
        bookedCount: 4,
        level: "Fortgeschrittene",
        price: 180,
        notes: "Abgesagt wegen Unwetterwarnung.",
        hundIds: [],
        createdAt: "2024-11-20T13:00:00.000Z",
        updatedAt: "2025-01-15T07:20:00.000Z",
      },
      {
        id: "course-004",
        code: "KS-004",
        title: "Agility Sprint",
        trainerName: "Jonas Graf",
        trainerId: "t2",
        date: "2025-04-22",
        startTime: "17:30",
        endTime: "19:00",
        location: "Trainingshalle Dübendorf",
        ort: "Trainingshalle Dübendorf",
        status: "geplant",
        capacity: 12,
        bookedCount: 3,
        level: "Sporthunde",
        price: 160,
        notes: "Benötigt Grundkenntnisse Parcours.",
        hundIds: [],
        createdAt: "2025-02-10T12:00:00.000Z",
        updatedAt: "2025-02-10T12:00:00.000Z",
      },
      {
        id: "course-005",
        code: "KS-005",
        title: "Entspannter Rückruf",
        trainerName: "Martina Frei",
        trainerId: "t1",
        date: "2025-05-08",
        startTime: "08:30",
        endTime: "10:00",
        location: "Greifensee Uferweg",
        ort: "Greifensee Uferweg",
        status: "offen",
        capacity: 15,
        bookedCount: 5,
        level: "Alltag",
        price: 140,
        notes: "Mit Wasserpausen für Hunde.",
        hundIds: [],
        createdAt: "2025-02-05T10:00:00.000Z",
        updatedAt: "2025-02-12T09:15:00.000Z",
      },
      {
        id: "course-006",
        code: "KS-006",
        title: "Hoopers Aufbau",
        trainerName: "Lena Vogt",
        trainerId: "t3",
        date: "2025-01-05",
        startTime: "11:00",
        endTime: "12:30",
        location: "Indoor-Halle Basel",
        ort: "Indoor-Halle Basel",
        status: "offen",
        capacity: 8,
        bookedCount: 2,
        level: "Fortgeschrittene",
        price: 130,
        notes: "Rückblick auf Basics + neue Parcourslinien.",
        hundIds: [],
        createdAt: "2024-12-01T09:30:00.000Z",
        updatedAt: "2024-12-20T15:40:00.000Z",
      },
    ],
    trainer: [
      {
        id: "t1",
        code: "TR-001",
        name: "Martina Frei",
        titel: "Trainerin",
        email: "martina.frei@hundeschule.ch",
        telefon: "+41 44 700 00 01",
        notizen: "Leitet Welpen- und Alltagskurse.",
        verfuegbarkeiten: [
          { weekday: 1, startTime: "08:00", endTime: "14:00" },
          { weekday: 3, startTime: "12:00", endTime: "18:00" },
        ],
        createdAt: "2024-11-01T08:00:00.000Z",
        updatedAt: "2025-02-10T10:00:00.000Z",
      },
      {
        id: "t2",
        code: "TR-002",
        name: "Jonas Graf",
        titel: "Trainer",
        email: "jonas.graf@hundeschule.ch",
        telefon: "+41 79 888 77 66",
        notizen: "Spezialist für Agility und Sporthunde.",
        verfuegbarkeiten: [
          { weekday: 2, startTime: "10:00", endTime: "16:00" },
          { weekday: 4, startTime: "14:00", endTime: "20:00" },
        ],
        createdAt: "2024-11-15T09:30:00.000Z",
        updatedAt: "2025-02-08T14:45:00.000Z",
      },
      {
        id: "t3",
        code: "TR-003",
        name: "Lena Vogt",
        titel: "Trainerin",
        email: "lena.vogt@hundeschule.ch",
        telefon: "+41 32 555 44 33",
        notizen: "Fokus Alltagstraining & Nasenarbeit.",
        verfuegbarkeiten: [
          { weekday: 1, startTime: "10:00", endTime: "16:00" },
          { weekday: 5, startTime: "08:00", endTime: "13:00" },
        ],
        createdAt: "2024-12-02T11:00:00.000Z",
        updatedAt: "2025-02-12T16:30:00.000Z",
      },
    ],
    kalender: [
      {
        id: "cal-001",
        code: "CAL-001",
        kursId: "course-001",
        title: "Welpentraining Kompakt",
        start: "2025-02-10T09:00:00.000Z",
        end: "2025-02-10T10:30:00.000Z",
        location: "Platz Nord, Zürich",
        notes: "Treffpunkt 15 Minuten vor Beginn.",
      },
      {
        id: "cal-002",
        code: "CAL-002",
        kursId: "course-002",
        title: "Junghunde Alltag",
        start: "2025-03-05T18:00:00.000Z",
        end: "2025-03-05T19:30:00.000Z",
        location: "Citypark Winterthur",
        notes: "Bitte City-Halstuch mitbringen.",
      },
    ],
    zahlungen: [
      {
        id: "pay-001",
        code: "PAY-001",
        kundenId: "k1",
        kursId: "course-001",
        typ: "zahlung",
        betrag: 150,
        datum: "2025-02-01",
        beschreibung: "Kursgebühr Welpen",
      },
      {
        id: "pay-002",
        code: "PAY-002",
        kundenId: "k1",
        typ: "offen",
        betrag: 90,
        datum: "2025-02-15",
        beschreibung: "Offene Privatstunde",
      },
      {
        id: "pay-003",
        code: "PAY-003",
        kundenId: "k2",
        kursId: "course-002",
        typ: "zahlung",
        betrag: 200,
        datum: "2025-01-20",
        beschreibung: "Junghunde Block",
      },
      {
        id: "pay-004",
        code: "PAY-004",
        kundenId: "k2",
        typ: "offen",
        betrag: 50,
        datum: "2025-02-05",
        beschreibung: "Materialkosten",
      },
      {
        id: "pay-005",
        code: "PAY-005",
        kundenId: "k3",
        typ: "zahlung",
        betrag: 110,
        datum: "2025-01-28",
        beschreibung: "Einzelcoaching",
      },
    ],
    waren: [
      {
        id: "ware-001",
        code: "WAR-001",
        kundenId: "k1",
        produktName: "Trainingsleine Biothane",
        menge: 1,
        preis: 45,
        datum: "2025-01-18",
        beschreibung: "Leichte Leine für Alltagstraining",
      },
      {
        id: "ware-002",
        code: "WAR-002",
        kundenId: "k2",
        produktName: "Snackpaket Fokus",
        menge: 2,
        preis: 25,
        datum: "2025-02-02",
        beschreibung: "Belohnungspaket für Stadttraining",
      },
    ],
    zertifikate: [],
  };
function h(e, t = []) {
  const n = new Set();
  for (const i of t) {
    if (!(i != null && i.id)) throw new Error(`[INTEGRITY] ${e} record missing id`);
    if (n.has(i.id)) throw new Error(`[INTEGRITY] Duplicate id "${i.id}" in ${e}`);
    n.add(i.id);
  }
}
function B() {
  var t, n, i, a, o, d;
  const e = (r, l) => {
    var f;
    return (f = s[r]) == null ? void 0 : f.some((u) => u.id === l);
  };
  (F(e),
    (t = s.hunde) == null ||
      t.forEach((r) => {
        if (!e("kunden", r.kundenId))
          throw new Error(`[INTEGRITY] Hund ${r.id} references missing Kunde ${r.kundenId}`);
      }),
    (n = s.kurse) == null ||
      n.forEach((r) => {
        if (!r.trainerId) throw new Error(`[INTEGRITY][IC-32] Kurs ${r.id} missing trainerId`);
        if (!e("trainer", r.trainerId))
          throw new Error(
            `[INTEGRITY][IC-32] Kurs ${r.id} references missing Trainer ${r.trainerId}`
          );
        if (Array.isArray(r.trainerIds)) {
          const l = r.trainerIds.filter((f) => !e("trainer", f));
          if (l.length)
            throw new Error(
              `[INTEGRITY][IC-32] Kurs ${r.id} references missing Trainer IDs: ${l.join(", ")}`
            );
        }
      }),
    (i = s.kalender) == null ||
      i.forEach((r) => {
        if (r.kursId && !e("kurse", r.kursId))
          throw new Error(`[INTEGRITY] Kalender ${r.id} references missing Kurs ${r.kursId}`);
        if (r.trainerId && !e("trainer", r.trainerId))
          throw new Error(`[INTEGRITY] Kalender ${r.id} references missing Trainer ${r.trainerId}`);
      }),
    (a = s.zahlungen) == null ||
      a.forEach((r) => {
        const l = r.kundenId ?? r.kundeId;
        if (!e("kunden", l))
          throw new Error(`[INTEGRITY] Zahlung ${r.id} references missing Kunde ${l}`);
        if (r.kursId && !e("kurse", r.kursId))
          throw new Error(`[INTEGRITY] Zahlung ${r.id} references missing Kurs ${r.kursId}`);
      }),
    (o = s.waren) == null ||
      o.forEach((r) => {
        if (!e("kunden", r.kundenId))
          throw new Error(
            `[INTEGRITY] Warenverkauf ${r.id} references missing Kunde ${r.kundenId}`
          );
      }),
    (d = s.zertifikate) == null ||
      d.forEach((r) => {
        if (!e("kunden", r.kundeId))
          throw new Error(`[INTEGRITY] Zertifikat ${r.id} references missing Kunde ${r.kundeId}`);
        if (!e("hunde", r.hundId))
          throw new Error(`[INTEGRITY] Zertifikat ${r.id} references missing Hund ${r.hundId}`);
        if (!e("kurse", r.kursId))
          throw new Error(`[INTEGRITY] Zertifikat ${r.id} references missing Kurs ${r.kursId}`);
      }));
}
function x() {
  typeof process < "u" ||
    (h("kunden", s.kunden),
    h("hunde", s.hunde),
    h("kurse", s.kurse),
    h("trainer", s.trainer),
    h("kalender", s.kalender),
    h("zahlungen", s.zahlungen),
    h("waren", s.waren),
    h("zertifikate", s.zertifikate),
    B());
}
function F(e) {
  const t = [];
  if (
    ((s.kurse || []).forEach((n) => {
      const a = (Array.isArray(n.hundIds) ? n.hundIds.filter(Boolean) : []).filter(
        (o) => !e("hunde", o)
      );
      a.length &&
        t.push(`[INTEGRITY][IC-31.1] Kurs ${n.id} references missing Hund IDs: ${a.join(", ")}`);
    }),
    t.length)
  )
    throw new Error(t.join(" | "));
}
const b = [
    "dashboard",
    "kunden",
    "hunde",
    "kurse",
    "trainer",
    "zertifikate",
    "kommunikation",
    "kalender",
    "finanzen",
    "waren",
  ],
  A = {
    admin: b,
    staff: b,
    developer: b,
    trainer: ["dashboard", "kurse", "kalender", "kommunikation"],
  },
  D = {
    admin: ["*"],
    staff: ["*"],
    developer: ["*"],
    trainer: [
      "kommunikation.chat.read",
      "kommunikation.chat.send",
      "kommunikation.chat.readMarker.set",
      "kommunikation.infochannel.view",
      "kommunikation.infochannel.confirm",
    ],
  };
function E(e) {
  return (e && String(e).trim().toLowerCase()) || null;
}
function C(e) {
  const t = E(e);
  return A[t] ? [...A[t]] : [];
}
function Y(e, t) {
  const n = E(e);
  return !n || !t ? !1 : (A[n] || []).includes(t);
}
function j(e) {
  const t = E(e);
  return D[t] ? [...D[t]] : [];
}
const S = "dogule1.auth.session";
let p = null;
function V(e) {
  if (!e) return null;
  try {
    return JSON.parse(e);
  } catch {
    return null;
  }
}
function R() {
  if (p) return p;
  if (typeof localStorage > "u") return null;
  const e = localStorage.getItem(S),
    t = V(e);
  return ((p = t && t.accessToken ? t : null), p);
}
function ke(e) {
  ((p = e), typeof localStorage < "u" && localStorage.setItem(S, JSON.stringify(e)), O(e));
}
function K() {
  ((p = null), typeof localStorage < "u" && localStorage.removeItem(S), O(null));
}
function P() {
  return R();
}
function W() {
  var t, n;
  const e = R();
  return e != null && e.accessToken
    ? {
        Authorization: `Bearer ${e.accessToken}`,
        "x-dogule-actor-id": ((t = e.user) == null ? void 0 : t.id) || "",
        "x-dogule-actor-role": ((n = e.user) == null ? void 0 : n.role) || "",
      }
    : {};
}
function q(e) {
  return C(e);
}
function O(e = R()) {
  if (typeof window > "u") return;
  if (!e || !e.user) {
    ((window.__DOGULE_AUTH__ = null),
      (window.__DOGULE_ACTOR__ = null),
      (window.__DOGULE_AUTHZ__ = null));
    return;
  }
  const t = e.user.role || "",
    n = j(t);
  ((window.__DOGULE_AUTH__ = e),
    (window.__DOGULE_ACTOR__ = { id: e.user.id, role: t }),
    (window.__DOGULE_AUTHZ__ = { allowedActions: n }));
}
function J(e) {
  const t = C(e);
  return t.includes("dashboard") ? "dashboard" : t[0] || "auth";
}
const Q = new Set([
    "auth",
    "dashboard",
    "kommunikation",
    "kurse",
    "kunden",
    "hunde",
    "kalender",
    "trainer",
    "finanzen",
    "waren",
    "zertifikate",
  ]),
  z = "dashboard";
function X(e = "") {
  const t = e.replace(/^#\/?/, "").trim().toLowerCase(),
    n = t ? t.split("/").filter(Boolean) : [],
    i = n[0] || z,
    a = Q.has(i) ? i : z,
    o = a === i ? n.slice(1) : [];
  return { module: a, segments: o, raw: t };
}
const ee = Object.assign({
    "../../modules/auth/index.js": () =>
      c(() => import("./index-CSMdsR7_.js"), __vite__mapDeps([0, 1]), import.meta.url),
    "../../modules/dashboard/index.js": () =>
      c(() => import("./index-XUogh3Lo.js"), __vite__mapDeps([2, 1, 3, 4, 5, 6]), import.meta.url),
    "../../modules/finanzen/index.js": () =>
      c(
        () => import("./index-DdAeRUoi.js"),
        __vite__mapDeps([7, 8, 4, 6, 9, 3, 1]),
        import.meta.url
      ),
    "../../modules/hunde/index.js": () =>
      c(
        () => import("./index-BGQHmloT.js"),
        __vite__mapDeps([10, 1, 5, 4, 11, 3, 12, 6, 8, 9]),
        import.meta.url
      ),
    "../../modules/kalender/index.js": () =>
      c(
        () => import("./index-C2O-6xbA.js"),
        __vite__mapDeps([13, 1, 6, 4, 9, 14, 15]),
        import.meta.url
      ),
    "../../modules/kommunikation/index.js": () =>
      c(() => import("./index-7ASn_Lh7.js"), __vite__mapDeps([16, 1, 12]), import.meta.url),
    "../../modules/kunden/index.js": () =>
      c(
        () => import("./index-vXgh6eyi.js"),
        __vite__mapDeps([17, 3, 4, 5, 6, 8, 9, 18, 11, 1]),
        import.meta.url
      ),
    "../../modules/kurse/index.js": () =>
      c(
        () => import("./index-C1uw71rv.js"),
        __vite__mapDeps([19, 1, 3, 4, 6, 8, 9]),
        import.meta.url
      ),
    "../../modules/trainer/index.js": () =>
      c(
        () => import("./index-BwzW7Nmn.js"),
        __vite__mapDeps([20, 9, 4, 6, 3, 8, 1, 14]),
        import.meta.url
      ),
    "../../modules/waren/index.js": () =>
      c(() => import("./index-BaWoTqGQ.js"), __vite__mapDeps([21, 18, 4, 3, 1]), import.meta.url),
    "../../modules/zertifikate/index.js": () =>
      c(
        () => import("./index-Cw88CSUk.js"),
        __vite__mapDeps([22, 4, 3, 5, 6, 9, 1, 12]),
        import.meta.url
      ),
  }),
  v = "dogule-shared-templates",
  Z = "__DOGULE_INTEGRITY_CHECK_DONE__";
let T = null,
  I = null,
  y = null;
function te() {
  var t, n;
  if (!((n = (t = import.meta) == null ? void 0 : t.env) != null && n.DEV)) return;
  const e = typeof globalThis < "u" ? globalThis : window;
  e[Z] || (x(), (e[Z] = !0));
}
te();
de();
async function ne(e) {
  const t = e.module,
    n = await se();
  if (!n) {
    console.error("Router error: #dogule-main not found in layout.");
    return;
  }
  await fe();
  try {
    const i = ee[`../../modules/${t}/index.js`];
    if (!i) throw new Error(`Module loader for "${t}" not found`);
    const a = await i(),
      o = typeof a.initModule == "function" ? a.initModule : a.default;
    if (typeof o != "function")
      throw new Error(`Module "${t}" missing export initModule(container) or default export`);
    const d = await o(n, e);
    n &&
      d &&
      (d instanceof window.Node
        ? ((n.innerHTML = ""), n.appendChild(d))
        : typeof d == "string" && (n.innerHTML = d));
  } catch (i) {
    (console.error(i),
      (n.innerHTML = `
      <section class="dogule-section">
        <h1>Fehler</h1>
        <p>Konnte Modul <code>${t}</code> nicht laden.</p>
      </section>
    `));
  } finally {
    re(t);
  }
}
function re(e) {
  document.querySelectorAll("a.nav__link[data-route]").forEach((n) => {
    n.dataset.route === e
      ? (n.classList.add("nav__link--active"), n.setAttribute("aria-current", "page"))
      : (n.classList.remove("nav__link--active"), n.removeAttribute("aria-current"));
  });
}
function ae(e) {
  const t = document.querySelectorAll("a.nav__link[data-route]"),
    n = q(e);
  t.forEach((i) => {
    const a = n.includes(i.dataset.route);
    ((i.hidden = !a), i.setAttribute("aria-hidden", a ? "false" : "true"));
  });
}
async function ie(e) {
  if (!(e != null && e.refreshToken)) {
    (K(), (window.location.hash = "#/auth"));
    return;
  }
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: e.refreshToken }),
    });
  } catch (t) {
    console.warn("[AUTH_LOGOUT_FAILED]", t);
  } finally {
    (K(), (window.location.hash = "#/auth"));
  }
}
function oe(e) {
  O(e);
  const t = document.getElementById("dogule-auth");
  if (!t) return;
  if (((t.innerHTML = ""), !(e != null && e.user))) {
    const o = document.createElement("button");
    ((o.type = "button"),
      (o.className = "dogule-auth__btn"),
      (o.textContent = "Anmelden"),
      o.addEventListener("click", () => {
        window.location.hash = "#/auth";
      }),
      t.appendChild(o));
    return;
  }
  const n = document.createElement("span");
  ((n.className = "dogule-auth__user"), (n.textContent = e.user.username || e.user.id || "User"));
  const i = document.createElement("span");
  ((i.className = "dogule-auth__role"), (i.textContent = e.user.role || ""));
  const a = document.createElement("button");
  ((a.type = "button"),
    (a.className = "dogule-auth__btn"),
    (a.textContent = "Abmelden"),
    a.addEventListener("click", () => ie(e)),
    t.append(n, i, a));
}
function de() {
  typeof window > "u" ||
    (window.__DOGULE_STORAGE_PROBE__ = async () => {
      const e = P();
      if (!(e != null && e.accessToken)) return;
      const t = await fetch("/api/kommunikation/infochannel/notices?limit=1", {
        method: "GET",
        headers: { ...W() },
      });
      if (!(t.status === 401 || t.status === 403) && !t.ok)
        throw new Error(`storage_probe_failed:${t.status}`);
    });
}
async function L() {
  var a, o, d;
  const e = window.location.hash || "",
    t = X(e);
  window.__DOGULE_ROUTE__ = t;
  const n = P(),
    i = E((a = n == null ? void 0 : n.user) == null ? void 0 : a.role);
  if (
    (oe(n), ae(i), !((o = n == null ? void 0 : n.user) != null && o.role) && t.module !== "auth")
  ) {
    window.location.hash = "#/auth";
    return;
  }
  if (
    (d = n == null ? void 0 : n.user) != null &&
    d.role &&
    t.module !== "auth" &&
    !Y(i, t.module)
  ) {
    const r = J(i);
    window.location.hash = `#/${r}`;
    return;
  }
  await ne(t);
}
window.addEventListener("hashchange", L);
document.readyState === "loading" ? window.addEventListener("DOMContentLoaded", L) : L();
async function se() {
  const e = await le();
  return (await pe(), document.getElementById("dogule-main") || e);
}
async function le() {
  return T || (I || (I = ue()), I);
}
async function ue() {
  try {
    const t = new DOMParser().parseFromString($, "text/html");
    if (!t) throw new Error("Failed to parse layout HTML");
    if (
      (t.querySelectorAll("link[href]").forEach((n) => n.remove()),
      me(t),
      he(t.body),
      ce(),
      (T = document.getElementById("dogule-main")),
      !T)
    )
      throw new Error("Missing #dogule-main in layout");
    return T;
  } catch (e) {
    return (console.error("DOGULE1_ROUTER_002 layout bootstrap failed", e), (I = null), null);
  }
}
function ce() {
  const e = document.getElementById("dogule-logo");
  e && (e.src = M);
}
function me(e) {
  const t = e.querySelector("title");
  t && (document.title = t.textContent || document.title);
  const n = new Set(
    Array.from(document.head.querySelectorAll("link[href]")).map((i) => i.getAttribute("href"))
  );
  e.querySelectorAll("link[href]").forEach((i) => {
    const a = i.getAttribute("href");
    if (!a || n.has(a)) return;
    const o = i.cloneNode(!0);
    (document.head.appendChild(o), n.add(a));
  });
}
function he(e) {
  e &&
    ((document.body.className = e.className),
    (document.body.id = e.id || ""),
    (document.body.innerHTML = e.innerHTML));
}
async function fe() {
  return document.getElementById(v) ? !0 : (y || (y = ge()), y);
}
async function ge() {
  try {
    let e = document.getElementById(v);
    return (
      e ||
        ((e = document.createElement("div")),
        (e.id = v),
        (e.hidden = !0),
        document.body.appendChild(e)),
      (e.innerHTML = U),
      !0
    );
  } catch (e) {
    return (console.error("DOGULE1_TEMPLATES_FAILED", e), (y = null), !1);
  }
}
function pe() {
  return new Promise((e) => {
    requestAnimationFrame(() => requestAnimationFrame(e));
  });
}
export { c as _, J as a, W as b, K as c, s as d, P as g, x as r, ke as s };
