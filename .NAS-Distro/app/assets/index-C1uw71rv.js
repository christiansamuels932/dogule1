import { a as A, e as U, c as X, d as N, b as O, f as Se, g as _e } from "./components-CDhMLcLx.js";
import { getKunde as Te } from "./kunden-BBFUy98K.js";
import { a as ae, l as Ie, d as ke, e as Ae, f as Ne, u as Le } from "./kurse-BUlwv0_9.js";
import { l as Ke, a as Re } from "./finanzen-C7TK8AhO.js";
import { l as Fe } from "./trainer-BTYLIueh.js";
import { r as he } from "./index-Cx63mBGt.js";
import "./httpClient-DjX31kqd.js";
const He = X,
  G = () => Se("Keine Daten vorhanden.", "", {}),
  Y = () => U("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" });
let K = [],
  q = [];
const ne = "__DOGULE_KURSE_TOAST__",
  pe = [
    { value: "aktiv", label: "Aktiv" },
    { value: "deaktiviert", label: "Deaktiviert" },
  ];
async function W(e = !1) {
  if (q.length && !e) return q;
  try {
    q = await Fe();
  } catch (n) {
    (console.error("[KURSE_ERR_TRAINER_FETCH]", n), (q = []));
  }
  return q;
}
async function be(e = []) {
  const n = await W(),
    r = new Map(n.map((t) => [t.id, t]));
  return (Array.isArray(e) ? e : []).map((t) => {
    const a = Array.isArray(t == null ? void 0 : t.trainerIds)
        ? t.trainerIds.filter(Boolean)
        : t != null && t.trainerId
          ? [t.trainerId]
          : [],
      o = a
        .map((l) => {
          var c;
          return (c = r.get(l)) == null ? void 0 : c.name;
        })
        .filter(Boolean),
      i = (t != null && t.trainerId && r.get(t.trainerId)) || null,
      s = o.length
        ? o.join(", ")
        : D(i, t == null ? void 0 : t.trainerName, t == null ? void 0 : t.trainerId);
    return {
      ...t,
      trainer: i,
      trainerName: (i == null ? void 0 : i.name) || t.trainerName || "",
      trainerCode: (i == null ? void 0 : i.code) || "",
      trainerIds: a,
      trainerNames: o,
      trainerLabel: s,
    };
  });
}
function ye(e, n = q) {
  const r = (e || "").trim();
  return (r && (Array.isArray(n) ? n : q).find((a) => a.id === r)) || null;
}
function Ce(e, n = "") {
  const r = X({ title: e, subtitle: n, level: 1 }),
    t = r.querySelector(".ui-section") || r.firstElementChild,
    a = (t == null ? void 0 : t.querySelector(".ui-section__subtitle")) || null,
    o = (t == null ? void 0 : t.querySelector(".ui-section__title")) || null,
    i = document.createElement("h1");
  return (
    (i.className = (o == null ? void 0 : o.className) || "ui-section__title"),
    (i.textContent = (o == null ? void 0 : o.textContent) || e || ""),
    o != null && o.id && (i.id = o.id),
    o ? o.replaceWith(i) : t && (t.querySelector(".ui-section__header") || t).prepend(i),
    a && ((a.textContent = n || ""), (a.hidden = !n)),
    { fragment: r, sectionEl: t, heading: i, subtitleEl: a }
  );
}
function te(e = "", n = "") {
  const r = A({ eyebrow: n, title: e, body: "", footer: "" });
  return r.querySelector(".ui-card") || r.firstElementChild;
}
async function _t(e, n = { segments: [] }) {
  e.innerHTML = "";
  const r = document.createElement("section");
  ((r.className = "dogule-section kurse-view"), e.appendChild(r));
  const { view: t, id: a } = Be(n);
  try {
    t === "detail" && a
      ? await ze(r, a)
      : t === "create" || (t === "edit" && a)
        ? await et(r, t, a)
        : await qe(r);
  } catch (o) {
    (console.error("[KURSE_ERR_VIEW]", o), (r.innerHTML = ""), ee());
    const { fragment: i } = Ce("Kurse", "Fehler beim Laden");
    r.appendChild(i);
    const s = A({ eyebrow: "", title: "", body: "", footer: "" }),
      l = s.querySelector(".ui-card") || s.firstElementChild;
    if (l) {
      const c = l.querySelector(".ui-card__body");
      ((c.innerHTML = ""), c.appendChild(Y()));
      const m = l.querySelector(".ui-card__footer");
      (m && (m.innerHTML = ""), r.appendChild(l));
    }
    $(r);
  }
}
function Be(e = {}) {
  const n = e.segments || [];
  if (!n.length) return { view: "list" };
  const [r, t] = n;
  return r === "new"
    ? { view: "create" }
    : t === "edit"
      ? { view: "edit", id: r }
      : { view: "detail", id: r };
}
async function qe(e) {
  if (!e) return;
  ((e.innerHTML = ""), ee(), await W(!0), x(e));
  const n = tt();
  n && e.appendChild(n);
  const r = A({ eyebrow: "", title: "Kursübersicht", body: "", footer: "" }),
    t = r.querySelector(".ui-card") || r.firstElementChild;
  if (t) {
    const a = t.querySelector(".ui-card__body");
    ((a.innerHTML = ""), e.appendChild(t), await nt(a));
  }
  $(e);
}
async function ze(e, n) {
  if (!e) return;
  ((e.innerHTML = ""), ee(), await W(!0));
  const r = document.createElement("section");
  ((r.className = "dogule-section kurse-section kurse-detail"),
    r.appendChild(X({ title: "Kurs", subtitle: "", level: 1 })),
    e.appendChild(r));
  try {
    K.length || (await P());
    let t = K.find((k) => k.id === n);
    if ((t || (t = await ae(n)), !t)) throw new Error(`Kurs ${n} nicht gefunden`);
    (t != null && t.trainer) || (t = (await be([t]))[0] || t);
    const a = r.querySelector(".ui-section__subtitle");
    (a && (a.textContent = t.title || ""), x(r));
    const o = te("Stammdaten"),
      i = o.querySelector(".ui-card__body"),
      s = [
        { label: "ID", value: t.id },
        { label: "Kurscode", value: t.code },
        { label: "Kursname", value: t.title },
        { label: "Trainer", render: () => Xe(t) },
        { label: "Abo-Form", value: t.aboForm },
        { label: "Alter Hund", value: t.alterHund },
        { label: "Aufbauend", value: t.aufbauend },
        { label: "Preis", value: Ee(t.price) },
        { label: "Status", value: rt(t.status) },
        { label: "Notizen", value: t.notes },
        { label: "Kursinhalt Theorie", value: t.inhaltTheorie },
        { label: "Kursinhalt Praxis", value: t.inhaltPraxis },
        { label: "Erstellt am", value: j(t.createdAt) },
        { label: "Aktualisiert am", value: j(t.updatedAt) },
      ];
    ((i.innerHTML = ""), i.appendChild(st(s)), r.appendChild(o));
    const l = await Me(t),
      c = await Ze(l.participants);
    e.__kursFinanzen = c;
    const m = te("Aktionen"),
      h = m.querySelector(".ui-card__body"),
      C = document.createElement("div");
    C.className = "module-actions";
    const _ = N({ label: "Kurs bearbeiten", variant: "primary" });
    ((_.type = "button"),
      _.addEventListener("click", () => {
        window.location.hash = `#/kurse/${t.id}/edit`;
      }));
    const v = N({ label: "Zertifikat erstellen", variant: "secondary" });
    ((v.type = "button"),
      v.addEventListener("click", () => {
        window.location.hash = `#/zertifikate/new?kursId=${encodeURIComponent(t.id)}`;
      }));
    const b = N({ label: "Kurs löschen", variant: "secondary" });
    ((b.type = "button"), b.addEventListener("click", () => ht(e, t.id, b)));
    const S = N({ label: "Zur Übersicht", variant: "quiet" });
    ((S.type = "button"),
      S.addEventListener("click", () => {
        window.location.hash = "#/kurse";
      }),
      C.append(_, v, b, S),
      h.appendChild(C),
      r.appendChild(m),
      Oe(r, l),
      Ve(r, c));
  } catch (t) {
    console.error("[KURSE_ERR_DETAIL]", t);
    const a = te("Stammdaten"),
      o = a.querySelector(".ui-card__body");
    (o && ((o.innerHTML = ""), o.appendChild(Y())), r.appendChild(a));
  }
  $(e);
}
async function Me(e = {}) {
  const n = { participants: [], hasMissing: !1, loadError: !1 };
  if (!(e != null && e.id)) return n;
  try {
    const r = await ke(e.id);
    ((n.participants = Array.isArray(r) ? r : []),
      (n.hasMissing = n.participants.some((t) => (t == null ? void 0 : t._missing))));
  } catch (r) {
    (console.error("[KURSE_ERR_LINKED_HUNDE]", r), (n.loadError = !0));
  }
  return n;
}
function Oe(e, { participants: n = [], hasMissing: r = !1, loadError: t } = {}) {
  const a = document.createElement("section");
  ((a.className = "kurse-linked-section"),
    a.appendChild(X({ title: "Teilnehmende Hunde", subtitle: "", level: 2 })));
  const o = A({ eyebrow: "", title: "", body: "", footer: "" }),
    i = o.querySelector(".ui-card") || o.firstElementChild;
  if (i) {
    const s = i.querySelector(".ui-card__body");
    ((s.innerHTML = ""),
      t
        ? s.appendChild(Y())
        : (r &&
            s.appendChild(
              U("Teilnehmerliste enthält ungültige Einträge. Bitte Kurs bearbeiten.", {
                variant: "warn",
                role: "alert",
              })
            ),
          n.length
            ? [...n].sort($e).forEach((c) => {
                const m = De(c);
                m && s.appendChild(m);
              })
            : s.appendChild(G())),
      a.appendChild(i));
  }
  e.appendChild(a);
}
function $e(e, n) {
  if (e != null && e._missing && n != null && n._missing) return 0;
  if (e != null && e._missing) return 1;
  if (n != null && n._missing) return -1;
  const r = ((e == null ? void 0 : e.code) || (e == null ? void 0 : e.id) || "").toLowerCase(),
    t = ((n == null ? void 0 : n.code) || (n == null ? void 0 : n.id) || "").toLowerCase();
  return r === t ? 0 : r > t ? 1 : -1;
}
function De(e) {
  if (e != null && e._missing) {
    const l = document.createElement("div");
    l.className = "kurse-participant kurse-participant--missing";
    const c = _e("!", "warn");
    c.classList.add("kurse-participant__warning");
    const m = document.createElement("span");
    ((m.className = "kurse-participant__label"),
      (m.textContent = "Unbekannter Hund (verwaiste Zuordnung)"));
    const h = document.createElement("span");
    return (
      (h.className = "kurse-participant__meta"),
      (h.textContent = e.id ? `ID: ${e.id}` : ""),
      l.append(c, m),
      e.id && l.appendChild(h),
      l
    );
  }
  const n = e.code || e.id || "–",
    r = e.name || "Unbenannter Hund",
    t = Pe(e.owner, e.kundenId),
    a = A({ eyebrow: n, title: r, body: "", footer: "" }),
    o = a.querySelector(".ui-card") || a.firstElementChild;
  if (!o) return null;
  o.classList.add("kurse-linked-hund");
  const i = o.querySelector(".ui-card__body");
  if (i) {
    i.innerHTML = "";
    const l = document.createElement("div");
    l.className = "kurse-linked-hund__meta";
    const c = document.createElement("p");
    c.textContent = `Besitzer: ${t}`;
    const m = document.createElement("p");
    ((m.textContent = `ID: ${e.id || "–"}`), l.append(c, m), i.appendChild(l));
  }
  const s = document.createElement("a");
  return (
    (s.href = `#/hunde/${e.id}`),
    (s.className = "kurse-linked-hund__link"),
    s.appendChild(o),
    s
  );
}
function Pe(e, n) {
  if (!e && !n) return "–";
  if (e) {
    const r = ge(e),
      t = we(e),
      a = Qe(e),
      o = a ? ` · ${a}` : "";
    return `${t} · ${r}${o}`;
  }
  return n;
}
const Ue = ["Finanzübersicht", "Offene Beträge", "Zahlungshistorie"];
async function Ze(e = []) {
  const n = new Set(),
    r = [];
  (Array.isArray(e) ? e : []).forEach((a) => {
    if (a != null && a._missing) return;
    const o = a == null ? void 0 : a.owner,
      i = (o == null ? void 0 : o.id) || (a == null ? void 0 : a.kundenId);
    !i || n.has(i) || (n.add(i), r.push(o != null && o.id ? o : { id: i }));
  });
  const t = [];
  if (!r.length) return t;
  for (const a of r) {
    const o = a == null ? void 0 : a.id;
    if (!o) continue;
    let i = a;
    if (!i.vorname && !i.nachname && !i.code && i.id)
      try {
        const h = await Te(i.id);
        h && (i = h);
      } catch (h) {
        console.error("[KURSE_ERR_FINANZ_KUNDE]", h);
      }
    let s = [];
    try {
      s = await Ke(o);
    } catch (h) {
      console.error("[KURSE_ERR_FINANZ_FETCH]", h);
    }
    const l = s.filter((h) => h.typ === "bezahlt"),
      c = s.filter((h) => h.typ === "offen"),
      m = l.length ? l[l.length - 1] : null;
    t.push({
      kundeId: o,
      label: ge(i) || `Kunde ${o}`,
      code: we(i),
      offeneBetraege: c,
      zahlungen: l,
      lastZahlung: m,
    });
  }
  return t;
}
function Ve(e, n = []) {
  if (!e) return;
  const r = Array.isArray(n) ? n : [],
    t = { Finanzübersicht: We, "Offene Beträge": je, Zahlungshistorie: Ge };
  Ue.forEach((a) => {
    const o = document.createElement("section");
    ((o.className = "kurse-linked-section kurse-finanz-section"),
      o.appendChild(He({ title: a, subtitle: "", level: 2 })));
    const i = A({ eyebrow: "", title: "", body: "", footer: "" }),
      s = i.querySelector(".ui-card") || i.firstElementChild;
    if (!s) return;
    const l = s.querySelector(".ui-card__body");
    if (l) {
      l.innerHTML = "";
      const c = t[a];
      (typeof c == "function" ? c(l, r) : !1) || l.appendChild(G());
    }
    (o.appendChild(s), e.appendChild(o));
  });
}
function We(e, n = []) {
  return n.length
    ? (n.forEach((r) => {
        const t = oe(r, n),
          a = ie(
            t,
            r.lastZahlung
              ? `Letzte Zahlung: ${le(r.lastZahlung.betrag)} · Datum: ${j(r.lastZahlung.datum)}`
              : "Keine letzte Zahlung"
          );
        e.appendChild(a);
      }),
      !0)
    : !1;
}
function je(e, n = []) {
  const r = [];
  return (
    n.forEach((t) => {
      t.offeneBetraege.forEach((a) => {
        r.push({ kundeId: t.kundeId, label: t.label, code: t.code, eintrag: a });
      });
    }),
    r.length
      ? (r.forEach(({ kundeId: t, label: a, code: o, eintrag: i }) => {
          const s = oe({ kundeId: t, label: a, code: o }, n),
            l = ie(s, `Betrag: ${le(i.betrag)} · Datum: ${j(i.datum)}`);
          e.appendChild(l);
        }),
        !0)
      : (e.appendChild(G()), !0)
  );
}
function Ge(e, n = []) {
  const r = [];
  return (
    n.forEach((t) => {
      t.zahlungen.forEach((a) => {
        r.push({ kundeId: t.kundeId, label: t.label, code: t.code, eintrag: a });
      });
    }),
    r.sort((t, a) => {
      const o = new Date(t.eintrag.datum).getTime(),
        i = new Date(a.eintrag.datum).getTime();
      return Number.isNaN(i) ? 1 : Number.isNaN(o) ? -1 : i - o;
    }),
    r.length
      ? (r.forEach(({ kundeId: t, label: a, code: o, eintrag: i }) => {
          const s = oe({ kundeId: t, label: a, code: o }, n),
            l = ie(s, `Zahlung: ${le(i.betrag)} · Datum: ${j(i.datum)}`);
          e.appendChild(l);
        }),
        !0)
      : (e.appendChild(G()), !0)
  );
}
function oe(e, n = []) {
  const r = e.label || `Kunde ${e.kundeId}`,
    t = e.code || Ye(n, e.kundeId);
  return t ? `${t} · ${r}` : r;
}
function Ye(e = [], n = "") {
  const r = e.find((t) => t.kundeId === n);
  return (r == null ? void 0 : r.code) || "";
}
function ie(e, n) {
  const r = document.createElement("div");
  r.className = "kurse-finanz-row";
  const t = document.createElement("strong");
  t.textContent = e;
  const a = document.createElement("span");
  return ((a.textContent = n), r.append(t, a), r);
}
function ge(e = {}) {
  return `${e.nachname ?? ""} ${e.vorname ?? ""}`.trim() || e.email || "Unbenannter Kunde";
}
function Je(e = "") {
  if (typeof e != "string") return "";
  const n = e
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  if (!n.length) return "";
  const r = n[n.length - 1];
  return r.replace(/^\d+\s*/, "").trim() || r;
}
function Qe(e = {}) {
  return Je(e.adresse || e.address || "");
}
function we(e = {}) {
  return e.code || e.kundenCode || e.id || "–";
}
function D(e = {}, n = "", r = "") {
  const t = (e == null ? void 0 : e.name) || n || "",
    a = (e == null ? void 0 : e.code) || "";
  return t && a ? `${a} · ${t}` : t || a || r || "Noch nicht zugewiesen";
}
function Xe(e = {}) {
  const n = Array.isArray(e.trainerIds)
    ? e.trainerIds.filter(Boolean)
    : e.trainerId
      ? [e.trainerId]
      : [];
  if (!n.length) {
    const t = document.createElement("span");
    return ((t.textContent = "Noch nicht zugewiesen"), t);
  }
  if (n.length === 1) {
    const t = D(e.trainer, e.trainerName, e.trainerId),
      a = document.createElement("a");
    return ((a.href = `#/trainer/${n[0]}`), (a.textContent = t), a);
  }
  const r = document.createElement("span");
  return (
    n.forEach((t, a) => {
      const o = ye(t, q),
        i = D(o, "", t),
        s = document.createElement("a");
      ((s.href = `#/trainer/${t}`),
        (s.textContent = i),
        r.appendChild(s),
        a < n.length - 1 && r.appendChild(document.createTextNode(", ")));
    }),
    r
  );
}
function xe(e = {}) {
  if (!e.id) return null;
  const n = document.createElement("a");
  ((n.href = `#/kurse/${e.id}`), (n.className = "kurse-list__item"));
  const r = A({
      eyebrow: e.code || "Code folgt",
      title: e.title || "Ohne Titel",
      body: "",
      footer: "",
    }),
    t = r.querySelector(".ui-card") || r.firstElementChild;
  if (!t) return null;
  t.classList.add("kurse-list-item");
  const a = t.querySelector(".ui-card__body"),
    o = t.querySelector(".ui-card__footer");
  if (a) {
    a.innerHTML = "";
    const i = document.createElement("ul");
    ((i.className = "kurse-list__meta"),
      [
        {
          label: "Trainer",
          value: e.trainerLabel || D(e.trainer, e.trainerName, e.trainerId),
          link: e.trainerId ? `#/trainer/${e.trainerId}` : "",
        },
        { label: "Alter Hund", value: e.alterHund || "–" },
        { label: "Preis", value: Ee(e.price) },
      ].forEach(({ label: l, value: c, link: m }) => {
        const h = document.createElement("li"),
          C = document.createElement("strong");
        C.textContent = `${l}: `;
        const _ = document.createElement("span");
        if (m) {
          const v = document.createElement("a");
          ((v.href = m), (v.textContent = c), _.appendChild(v));
        } else _.textContent = c;
        (h.append(C, _), i.appendChild(h));
      }),
      a.appendChild(i));
  }
  return (o && (o.innerHTML = ""), n.appendChild(t), n);
}
async function et(e, n, r) {
  if (!e) return;
  const t = n === "create" ? "create" : "edit";
  ((e.innerHTML = ""), ee());
  const { fragment: a } = Ce(
    t === "create" ? "Kurs erstellen" : "Kurs bearbeiten",
    t === "create" ? "Lege einen neuen Kurs an." : "Passe die Kursdaten an."
  );
  (e.appendChild(a), x(e), await W(!0));
  let o = null;
  if (t === "edit") {
    const u = A({ eyebrow: "", title: "", body: "<p>Kurs wird geladen ...</p>", footer: "" }),
      y = u.querySelector(".ui-card") || u.firstElementChild;
    y && e.appendChild(y);
    try {
      if ((K.length || (await P()), (o = K.find((f) => f.id === r) || (await ae(r))), !o))
        throw new Error(`Kurs ${r} nicht gefunden`);
    } catch (f) {
      (console.error("[KURSE_ERR_FORM_LOAD]", f),
        (y == null ? void 0 : y.parentNode) === e && e.removeChild(y));
      const T = A({ eyebrow: "", title: "", body: "", footer: "" }),
        E = T.querySelector(".ui-card") || T.firstElementChild;
      if (E) {
        const R = E.querySelector(".ui-card__body");
        ((R.innerHTML = ""), R.appendChild(Y()));
        const J = E.querySelector(".ui-card__footer");
        (J && (J.innerHTML = ""), e.appendChild(E));
      }
      $(e);
      return;
    }
    (y == null ? void 0 : y.parentNode) === e && e.removeChild(y);
  }
  if (t === "create" && !K.length)
    try {
      await P();
    } catch (u) {
      console.error("[KURSE_ERR_FORM_INIT_FETCH]", u);
    }
  const i = A({ eyebrow: "", title: "Stammdaten", body: "", footer: "" }),
    s = i.querySelector(".ui-card") || i.firstElementChild;
  if (!s) return;
  e.appendChild(s);
  const l = document.createElement("form"),
    c = `kurse-form-${t}-${r || "new"}`;
  ((l.id = c), (l.noValidate = !0), (l.dataset.kursForm = "true"));
  const m = s.querySelector(".ui-card__body");
  ((m.innerHTML = ""), m.appendChild(l));
  const h = t === "edit" ? ((o == null ? void 0 : o.code) ?? "") : se(K);
  let C = [],
    _ = [];
  try {
    ((_ = await W()), (C = at(_, o)));
  } catch (u) {
    console.error("[KURSE_ERR_FORM_TRAINER]", u);
  }
  if (!C.length) {
    const u = A({ eyebrow: "", title: "Keine Trainer gefunden", body: "", footer: "" }),
      y = u.querySelector(".ui-card") || u.firstElementChild;
    if (y) {
      const f = y.querySelector(".ui-card__body");
      ((f.innerHTML = ""),
        f.appendChild(
          U("Ohne Trainer kann kein Kurs erstellt werden. Bitte zuerst einen Trainer anlegen.", {
            variant: "warn",
            role: "alert",
          })
        ));
      const T = y.querySelector(".ui-card__footer");
      if (T) {
        const E = N({ label: "Zur Trainer-Übersicht", variant: "secondary" });
        ((E.type = "button"),
          E.addEventListener("click", () => {
            window.location.hash = "#/trainer";
          }),
          T.appendChild(E));
      }
      (e.appendChild(y), $(e));
      return;
    }
  }
  let v = !1;
  const b = dt(o, { defaultCode: h, trainerOptions: C }),
    S = {};
  b.forEach((u) => {
    const y = O(u.config),
      f = y.querySelector("input, select, textarea");
    if (
      ((f.name = u.name),
      u.multiple && f && f.tagName === "SELECT" && (f.multiple = !0),
      u.readOnly && ((f.readOnly = !0), f.setAttribute("aria-readonly", "true")),
      u.config.type === "number" &&
        (u.min !== void 0 && (f.min = u.min),
        u.max !== void 0 && (f.max = u.max),
        u.step && (f.step = u.step)),
      u.setValue)
    )
      u.setValue(f);
    else if (u.value !== void 0)
      if (f.multiple && Array.isArray(u.value)) {
        const E = new Set(u.value.map((R) => String(R)));
        Array.from(f.options).forEach((R) => {
          R.selected = E.has(R.value);
        });
      } else f.value = u.value;
    const T = y.querySelector(".ui-form-row__hint");
    if (
      (u.config.describedByText || T.classList.add("sr-only"),
      (S[u.name] = { input: f, hint: T }),
      u.name === "kursCode")
    ) {
      f.setAttribute("aria-readonly", "true");
      const E = N({ label: "Code manuell ändern", variant: "secondary" });
      ((E.type = "button"),
        E.addEventListener("click", () => {
          ((v = !v),
            v
              ? ((f.readOnly = !1),
                f.removeAttribute("aria-readonly"),
                (E.textContent = "Automatischen Code verwenden"),
                f.focus())
              : ((f.readOnly = !0),
                f.setAttribute("aria-readonly", "true"),
                (E.textContent = "Code manuell ändern"),
                f.value.trim() || (f.value = h)));
        }),
        y.appendChild(E));
    }
    l.appendChild(y);
  });
  const k = document.createElement("div");
  k.className = "module-actions kurse-form-actions";
  const L = N({ label: t === "create" ? "Erstellen" : "Speichern", variant: "primary" });
  ((L.type = "submit"), L.setAttribute("form", c));
  const H = N({ label: "Abbrechen", variant: "quiet" });
  ((H.type = "button"),
    H.setAttribute("form", c),
    H.addEventListener("click", (u) => {
      u.preventDefault();
      const y = t === "create" ? "#/kurse" : `#/kurse/${r}`;
      typeof window < "u" && (window.location.hash = y);
    }),
    k.append(L, H));
  const z = s.querySelector(".ui-card__footer");
  ((z.innerHTML = ""), z.appendChild(k));
  const Z = { mode: t, id: r, refs: S, section: e, submit: L, trainerList: _ };
  (l.addEventListener("submit", (u) => mt(u, Z)), $(e));
}
async function P() {
  try {
    const e = await Ie();
    return ((K = await be(e)), K);
  } catch (e) {
    throw (console.error("[KURSE_ERR_FETCH_LIST]", e), (K = []), e);
  }
}
function tt() {
  const e = A({ eyebrow: "", title: "Aktionen", body: "", footer: "" }),
    n = e.querySelector(".ui-card") || e.firstElementChild;
  if (!n) return document.createDocumentFragment();
  const r = n.querySelector(".ui-card__body");
  r.innerHTML = "";
  const t = document.createElement("div");
  return (
    (t.className = "module-actions"),
    t.appendChild(
      N({
        label: "Neuer Kurs",
        variant: "primary",
        onClick: () => {
          window.location.hash = "#/kurse/new";
        },
      })
    ),
    t.appendChild(N({ label: "Plan exportieren", variant: "secondary" })),
    r.appendChild(t),
    n
  );
}
async function nt(e) {
  if (!e) return;
  e.innerHTML = "";
  const n = document.createElement("p");
  ((n.textContent = "Kurse werden geladen ..."), e.appendChild(n));
  try {
    let T = function (d) {
        return String(d || "")
          .trim()
          .toLowerCase();
      },
      E = function (d) {
        const p = T(d);
        return ["geplant", "offen", "ausgebucht"].includes(p)
          ? "aktiv"
          : p === "abgesagt"
            ? "deaktiviert"
            : p;
      },
      R = function (d, p) {
        return p
          ? [
              d.code,
              d.title,
              d.trainerName,
              d.trainerCode,
              d.trainerLabel,
              d.status,
              d.aboForm,
              d.alterHund,
              d.aufbauend,
              d.price,
            ]
              .filter(Boolean)
              .map(T)
              .join(" ")
              .includes(p)
          : !0;
      },
      J = function (d) {
        return a.status === "all" ? !0 : E(d.status) === a.status;
      },
      ve = function (d) {
        const p = E(d.status),
          I = { aktiv: 0, deaktiviert: 1 }[p] ?? 9,
          F = T(d.title);
        return `${String(I).padStart(2, "0")}|${F}`;
      },
      de = function (d) {
        switch (o.key) {
          case "title":
            return T(d.title);
          case "code":
            return T(d.code);
          case "trainer":
            return T(d.trainerName || d.trainerCode);
          case "createdAt": {
            const p = new Date(d.createdAt || "");
            return Number.isNaN(p.getTime()) ? "" : p.toISOString();
          }
          case "status":
          default:
            return ve(d);
        }
      },
      ce = function () {
        const d = T(t.query),
          p = r.filter((w) => R(w, d) && J(w));
        return p.length
          ? p
              .map((w, I) => ({ course: w, index: I }))
              .sort((w, I) => {
                const F = de(w.course),
                  M = de(I.course),
                  V = String(F).localeCompare(String(M), "de", { sensitivity: "base" });
                return V !== 0 ? (o.direction === "asc" ? V : -V) : w.index - I.index;
              })
              .map(({ course: w }) => w)
          : [];
      },
      ue = function (d) {
        const p = d.length,
          w = i.pageSize,
          I = Math.max(1, Math.ceil(p / w));
        if ((i.page > I && (i.page = I), i.page < 1 && (i.page = 1), !p))
          return { rows: [], total: p, totalPages: I, startIndex: 0, endIndex: 0 };
        const F = (i.page - 1) * w,
          M = Math.min(F + w, p);
        return { rows: d.slice(F, M), total: p, totalPages: I, startIndex: F, endIndex: M };
      },
      fe = function (d = ce()) {
        const { total: p, totalPages: w, startIndex: I, endIndex: F } = ue(d),
          M = p ? I + 1 : 0,
          V = p ? F : 0;
        ((z.textContent = `Zeige ${M}–${V} von ${p}`),
          (y.textContent = `Seite ${i.page} von ${w}`),
          (u.disabled = !p || i.page <= 1),
          (f.disabled = !p || i.page >= w));
      },
      B = function () {
        L.innerHTML = "";
        const d = ce(),
          { rows: p } = ue(d);
        if (!p.length) {
          (L.appendChild(U("Keine Treffer.", { variant: "info" })), fe(d));
          return;
        }
        (p.forEach((w) => {
          const I = xe(w);
          I && L.appendChild(I);
        }),
          fe(d));
      };
    const r = await P();
    if (((e.innerHTML = ""), !r.length)) {
      e.appendChild(G());
      return;
    }
    const t = { query: "" },
      a = { status: "all" },
      o = { key: "status", direction: "asc" },
      i = { page: 1, pageSize: 25 },
      s = document.createElement("div");
    s.className = "list-controls";
    const l = O({
        id: "kurse-search",
        label: "Suche",
        placeholder: "Titel, Code, Trainer ...",
        value: "",
        required: !1,
      }),
      c = l.querySelector("input");
    (c &&
      ((c.type = "search"),
      c.addEventListener("input", (d) => {
        ((t.query = d.target.value || ""), (i.page = 1), B());
      })),
      s.appendChild(l));
    const m = O({
        id: "kurse-status-filter",
        label: "Status",
        control: "select",
        options: [
          { value: "all", label: "Alle", selected: !0 },
          ...pe.map((d) => ({ value: d.value, label: d.label })),
        ],
      }),
      h = m.querySelector("select");
    (h &&
      h.addEventListener("change", (d) => {
        ((a.status = d.target.value || "all"), (i.page = 1), B());
      }),
      s.appendChild(m));
    const C = O({
        id: "kurse-sort-key",
        label: "Sortierung",
        control: "select",
        options: [
          { value: "status", label: "Status", selected: !0 },
          { value: "title", label: "Titel" },
          { value: "code", label: "Code" },
          { value: "trainer", label: "Trainer" },
          { value: "createdAt", label: "Erstellt am" },
        ],
      }),
      _ = C.querySelector("select");
    (_ &&
      _.addEventListener("change", (d) => {
        ((o.key = d.target.value || "status"), (i.page = 1), B());
      }),
      s.appendChild(C));
    const v = O({
        id: "kurse-sort-dir",
        label: "Richtung",
        control: "select",
        options: [
          { value: "asc", label: "Aufsteigend", selected: !0 },
          { value: "desc", label: "Absteigend" },
        ],
      }),
      b = v.querySelector("select");
    (b &&
      b.addEventListener("change", (d) => {
        ((o.direction = d.target.value === "desc" ? "desc" : "asc"), B());
      }),
      s.appendChild(v));
    const S = O({
        id: "kurse-page-size",
        label: "Pro Seite",
        control: "select",
        options: [
          { value: "25", label: "25", selected: !0 },
          { value: "50", label: "50" },
          { value: "100", label: "100" },
        ],
      }),
      k = S.querySelector("select");
    (k &&
      k.addEventListener("change", (d) => {
        const p = Number(d.target.value) || 25;
        ((i.pageSize = p), (i.page = 1), B());
      }),
      s.appendChild(S),
      e.appendChild(s));
    const L = document.createElement("div");
    ((L.className = "kurse-list"), e.appendChild(L));
    const H = document.createElement("div");
    H.className = "list-pagination";
    const z = document.createElement("div");
    z.className = "list-pagination__info";
    const Z = document.createElement("div");
    Z.className = "list-pagination__actions";
    const u = N({ label: "Zurück", variant: "secondary" });
    u.type = "button";
    const y = document.createElement("span");
    y.className = "list-pagination__page";
    const f = N({ label: "Weiter", variant: "secondary" });
    ((f.type = "button"),
      u.addEventListener("click", () => {
        i.page > 1 && ((i.page -= 1), B());
      }),
      f.addEventListener("click", () => {
        ((i.page += 1), B());
      }),
      Z.append(u, y, f),
      H.append(z, Z),
      e.appendChild(H),
      B());
  } catch (r) {
    (console.error("[KURSE_ERR_LIST_FETCH]", r), (e.innerHTML = ""), e.appendChild(Y()));
  }
}
function rt(e) {
  switch ((e || "").toLowerCase()) {
    case "aktiv":
      return "Aktiv";
    case "deaktiviert":
    case "abgesagt":
      return "Deaktiviert";
    case "geplant":
    case "offen":
    case "ausgebucht":
      return "Aktiv";
    default:
      return "Aktiv";
  }
}
function Ee(e) {
  if (typeof e == "string") {
    const r = e.trim();
    if (r) return r;
  }
  const n = Number(e);
  return !Number.isFinite(n) || n <= 0
    ? "–"
    : new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
        minimumFractionDigits: 2,
      }).format(n);
}
function le(e) {
  const n = Number(e);
  return Number.isFinite(n) ? `CHF ${n.toFixed(2)}` : "CHF 0.00";
}
function se(e = []) {
  let n = 0;
  e.forEach((t) => {
    const o = (t.code || "").trim().match(/(\d+)/);
    if (!o) return;
    const i = Number.parseInt(o[1], 10);
    Number.isFinite(i) && i > n && (n = i);
  });
  const r = n + 1;
  return `KS-${String(r).padStart(3, "0")}`;
}
function at(e = [], n = {}) {
  const r = (Array.isArray(e) ? e : []).map((t) => ({ value: t.id, label: D(t, "", t.id) }));
  return (
    n != null &&
      n.trainerId &&
      !r.some((t) => t.value === n.trainerId) &&
      n.trainerName &&
      r.push({ value: n.trainerId, label: D({ name: n.trainerName }, "", n.trainerId) }),
    r.some((t) => t.value === "") || r.unshift({ value: "", label: "Bitte wählen" }),
    r
  );
}
function ot(e = [], n = "") {
  const r = Array.isArray(e) ? e : [];
  return (r.some((o) => o.value === "") ? r : [{ value: "", label: "Bitte wählen" }, ...r]).map(
    (o) => ({ value: o.value, label: o.label, selected: o.value === n })
  );
}
function it(e = [], n = "") {
  const t = (Array.isArray(e) ? e : []).filter((a) => a.value !== "");
  return [{ value: "", label: "Keiner" }, ...t].map((a) => ({
    value: a.value,
    label: a.label,
    selected: a.value === n,
  }));
}
function j(e) {
  if (!e) return "–";
  const n = new Date(e);
  return Number.isNaN(n.getTime())
    ? "–"
    : n.toLocaleString("de-CH", { dateStyle: "medium", timeStyle: "short" });
}
function lt(e) {
  return e == null ? "–" : (typeof e == "string" ? e.trim() : String(e)) || "–";
}
function st(e = []) {
  const n = document.createElement("dl");
  return (
    (n.className = "kunden-details"),
    e.forEach(({ label: r, value: t, render: a }) => {
      const o = document.createElement("dt");
      o.textContent = r;
      const i = document.createElement("dd");
      (typeof a == "function" ? i.appendChild(a()) : (i.textContent = lt(t)), n.append(o, i));
    }),
    n
  );
}
function dt(e = {}, { defaultCode: n = "", trainerOptions: r = [] } = {}) {
  const t = (e == null ? void 0 : e.status) ?? "aktiv",
    a = (e == null ? void 0 : e.aufbauend) ?? "",
    o = (e == null ? void 0 : e.trainerId) ?? "",
    l =
      (Array.isArray(e == null ? void 0 : e.trainerIds)
        ? e.trainerIds.filter(Boolean)
        : o
          ? [o]
          : []
      ).filter((c) => c !== o)[0] || "";
  return [
    {
      name: "kursId",
      value: (e == null ? void 0 : e.id) ?? "",
      readOnly: !0,
      config: {
        id: "kurs-id",
        label: "Kurs-ID",
        placeholder: "Wird automatisch vergeben",
        describedByText: "ID ist schreibgeschützt und wird vom System vergeben.",
        required: !1,
      },
    },
    {
      name: "kursCode",
      value: (e == null ? void 0 : e.code) ?? n,
      readOnly: !0,
      config: {
        id: "kurs-code",
        label: "Kurscode",
        placeholder: "Wird automatisch vergeben",
        describedByText:
          'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
        required: !1,
      },
    },
    {
      name: "title",
      value: (e == null ? void 0 : e.title) ?? "",
      config: {
        id: "kurs-title",
        label: "Kursname",
        placeholder: "z. B. Welpenschule & Prägung",
        required: !0,
      },
    },
    {
      name: "ort",
      value: (e == null ? void 0 : e.ort) ?? (e == null ? void 0 : e.location) ?? "",
      config: {
        id: "kurs-ort",
        label: "Ort",
        placeholder: "z. B. Platz Nord, Zürich",
        required: !0,
      },
    },
    {
      name: "trainerId",
      value: o,
      config: {
        id: "kurs-trainer-id",
        label: "Haupttrainer",
        control: "select",
        required: !0,
        describedByText: "Trainer ist Pflichtfeld. Bitte auswählen.",
        options: ot(r, e == null ? void 0 : e.trainerId),
      },
    },
    {
      name: "trainerIds",
      value: l,
      config: {
        id: "kurs-trainer-ids",
        label: "Weitere Trainer",
        control: "select",
        required: !1,
        describedByText: "Optional.",
        options: it(r, l),
      },
    },
    {
      name: "aboForm",
      value: (e == null ? void 0 : e.aboForm) ?? "",
      config: {
        id: "kurs-abo-form",
        label: "Abo-Form",
        placeholder: "z. B. 10er-Abo / Einzel / 6 Stunden",
      },
    },
    {
      name: "alterHund",
      value: (e == null ? void 0 : e.alterHund) ?? "",
      config: { id: "kurs-alter-hund", label: "Alter Hund", placeholder: "z. B. Ab 9 Monaten" },
    },
    {
      name: "price",
      value: e != null && e.price ? String(e.price) : "",
      config: { id: "kurs-price", label: "Preis", placeholder: "z. B. 380.- / 38.-" },
    },
    {
      name: "aufbauend",
      value: a,
      config: {
        id: "kurs-aufbauend",
        label: "Aufbauend",
        control: "select",
        options: [
          { value: "", label: "Bitte wählen", selected: !a },
          { value: "aufbauend", label: "Aufbauend", selected: a === "aufbauend" },
          { value: "nicht aufbauend", label: "Nicht aufbauend", selected: a === "nicht aufbauend" },
        ],
      },
    },
    {
      name: "status",
      config: {
        id: "kurs-status",
        label: "Status",
        control: "select",
        required: !1,
        options: pe.map((c) => ({ value: c.value, label: c.label, selected: c.value === t })),
      },
    },
    {
      name: "notes",
      value: (e == null ? void 0 : e.notes) ?? "",
      config: {
        id: "kurs-notes",
        label: "Notizen",
        control: "textarea",
        placeholder: "Besondere Hinweise zum Ablauf",
      },
    },
    {
      name: "inhaltTheorie",
      value: (e == null ? void 0 : e.inhaltTheorie) ?? "",
      config: {
        id: "kurs-inhalt-theorie",
        label: "Kursinhalt Theorie",
        control: "textarea",
        placeholder: "Eine Zeile pro Bullet",
      },
    },
    {
      name: "inhaltPraxis",
      value: (e == null ? void 0 : e.inhaltPraxis) ?? "",
      config: {
        id: "kurs-inhalt-praxis",
        label: "Kursinhalt Praxis",
        control: "textarea",
        placeholder: "Eine Zeile pro Bullet",
      },
    },
  ];
}
function g(e, n = "") {
  return typeof e == "string" ? e : e == null ? n : String(e);
}
function ct(e) {
  const n = {};
  return (
    Object.entries(e).forEach(([r, t]) => {
      var o;
      if (typeof t.getValue == "function") {
        n[r] = t.getValue();
        return;
      }
      if (t.inputs) {
        n[r] = t.inputs.filter((i) => i.checked).map((i) => i.value);
        return;
      }
      const a = t.input ? t.input.value : "";
      (o = t.input) != null && o.multiple
        ? (n[r] = Array.from(t.input.selectedOptions || []).map((i) => i.value))
        : (n[r] = typeof a == "string" ? a.trim() : a);
    }),
    n
  );
}
function ut(e = {}, { trainers: n = [] } = {}) {
  const r = { ...e };
  r.kursCode = g(e.kursCode).trim();
  const t = {};
  ((r.title = g(e.title, "").trim()),
    r.title || (t.title = "Bitte Kursnamen eingeben."),
    (r.ort = g(e.ort, "").trim()),
    r.ort || (t.ort = "Bitte Ort angeben."));
  const a = g(e.trainerId).trim(),
    o = Array.isArray(e.trainerIds)
      ? e.trainerIds.map((l) => g(l).trim()).filter(Boolean)
      : g(e.trainerIds).trim()
        ? [g(e.trainerIds).trim()]
        : [],
    i = Array.isArray(n) ? n.map((l) => l.id) : [];
  return (
    a
      ? i.length && !i.includes(a) && (t.trainerId = "Ausgewählter Trainer ist ungültig.")
      : (t.trainerId = "Bitte Trainer auswählen."),
    o.filter((l) => i.length && !i.includes(l)).length &&
      (t.trainerIds = "Ausgewählte Zusatz-Trainer sind ungültig."),
    (r.trainerId = a),
    (r.trainerIds = o),
    r.kursCode || (r.kursCode = se(K)),
    { errors: t, values: r }
  );
}
function me(e, n) {
  Object.entries(e).forEach(([r, t]) => {
    const a = t.hint,
      o = t.inputs || (t.input ? [t.input] : []),
      i = !!n[r];
    (a && ((a.textContent = i ? n[r] : ""), a.classList.toggle("sr-only", !i)),
      o.forEach((s) => {
        s.setAttribute("aria-invalid", i ? "true" : "false");
      }));
  });
}
function ft(e, n = []) {
  const r = ye(e.trainerId, n),
    t = Array.isArray(e.trainerIds)
      ? e.trainerIds.map((a) => g(a).trim()).filter(Boolean)
      : g(e.trainerIds).trim()
        ? [g(e.trainerIds).trim()]
        : [];
  return (
    e.trainerId && !t.includes(e.trainerId) && t.unshift(e.trainerId),
    {
      code: g(e.kursCode, ""),
      title: g(e.title, ""),
      ort: g(e.ort, ""),
      location: g(e.ort, ""),
      trainerName: (r == null ? void 0 : r.name) || g(e.trainerName, ""),
      trainerId: g(e.trainerId, ""),
      trainerIds: t,
      status: g(e.status, ""),
      aboForm: g(e.aboForm, ""),
      alterHund: g(e.alterHund, ""),
      aufbauend: g(e.aufbauend, ""),
      price: g(e.price, ""),
      notes: g(e.notes, ""),
      inhaltTheorie: g(e.inhaltTheorie, ""),
      inhaltPraxis: g(e.inhaltPraxis, ""),
    }
  );
}
function Q(e, n = "info") {
  window[ne] = { message: e, tone: n };
}
function x(e) {
  e.querySelectorAll(".kurse-toast").forEach((o) => o.remove());
  const n = window[ne];
  if (!n) return;
  delete window[ne];
  const { message: r, tone: t = "info" } = typeof n == "string" ? { message: n, tone: "info" } : n,
    a = document.createElement("p");
  ((a.className = `kurse-toast kurse-toast--${t}`),
    a.setAttribute("role", "status"),
    (a.textContent = r),
    e.prepend(a));
}
function re(e, n, r = "info") {
  (Q(n, r), x(e));
}
async function mt(e, { mode: n, id: r, refs: t, section: a, submit: o, trainerList: i = [] }) {
  var v;
  e.preventDefault();
  const s = ct(t),
    l = (v = t.kursCode) == null ? void 0 : v.input;
  if (!(l ? !l.readOnly : !1) && !s.kursCode) {
    const b = se(K);
    ((s.kursCode = b), l && (l.value = b));
  }
  const { errors: m, values: h } = ut(s, { trainers: i });
  if ((me(t, m), Object.keys(m).length)) {
    const b = Object.values(t).find((S) => !S.hint.classList.contains("sr-only"));
    b == null || b.input.focus();
    return;
  }
  const C = ft(h, i),
    _ = o.textContent;
  ((o.disabled = !0), (o.textContent = n === "create" ? "Erstelle ..." : "Speichere ..."));
  try {
    let b;
    n === "create" ? (b = await Ne(C)) : (b = await Le(r, C));
    const S = b == null ? void 0 : b.id;
    if (!S) {
      const k = new Error("Kurs result missing ID");
      throw ((k.code = "FORM_RESULT_EMPTY"), k);
    }
    (await P(),
      he(),
      Q(n === "create" ? "Kurs wurde erstellt." : "Kurs wurde aktualisiert.", "success"),
      (window.location.hash = `#/kurse/${S}`));
  } catch (b) {
    const S = (b == null ? void 0 : b.code) === "FORM_RESULT_EMPTY",
      k = (b == null ? void 0 : b.code) === "KURS_TRAINER_INVALID";
    (k && me(t, { trainerId: "Ausgewählter Trainer ist ungültig oder gelöscht." }),
      console.error(S ? "[KURSE_ERR_FORM_RESULT]" : "[KURSE_ERR_FORM_SUBMIT]", b),
      re(
        a,
        S
          ? "Kurs konnte nach dem Speichern nicht geladen werden."
          : k
            ? "Trainer-Auswahl ist ungültig. Bitte einen vorhandenen Trainer wählen."
            : n === "create"
              ? "Kurs konnte nicht erstellt werden."
              : "Fehler beim Speichern des Kurses.",
        "error"
      ));
  } finally {
    ((o.disabled = !1), (o.textContent = _));
  }
}
async function ht(e, n, r) {
  if (r != null && r.disabled) return;
  const t = r.textContent,
    a = pt(e),
    o = () => {
      r && ((r.disabled = !1), (r.textContent = t));
    };
  ((r.disabled = !0), (r.textContent = "Prüfe ..."));
  try {
    const [i, s] = await Promise.all([ae(n), Re().catch(() => [])]);
    if (!i) throw new Error("Kurs nicht gefunden");
    const l = Array.isArray(i.hundIds) && i.hundIds.length > 0,
      c = Array.isArray(s) && s.some((C) => (C == null ? void 0 : C.kursId) === i.id);
    if (l || c) {
      const C = [];
      (l && C.push("Teilnehmer (Hunde) sind zugeordnet."),
        c && C.push("Finanzbuchungen verknüpfen diesen Kurs (kursId in Zahlungen)."),
        (a.innerHTML = ""),
        a.appendChild(bt(C)),
        re(e, "Löschen blockiert: Bitte zuerst Verknüpfungen entfernen.", "error"),
        o());
      return;
    }
    if (
      !window.confirm(`Kurs löschen?
Möchtest du diesen Kurs wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`)
    ) {
      o();
      return;
    }
    r.textContent = "Lösche ...";
    const h = await Ae(n);
    if (!(h != null && h.ok)) throw new Error("Delete failed");
    (await P(), he(), Q("Kurs wurde gelöscht.", "success"), (window.location.hash = "#/kurse"));
  } catch (i) {
    (console.error("[KURSE_ERR_DELETE]", i),
      (a.innerHTML = ""),
      a.appendChild(U("Fehler beim Löschen des Kurses.", { variant: "warn", role: "alert" })),
      re(e, "Fehler beim Löschen des Kurses.", "error"),
      o());
  }
}
function pt(e) {
  if (!e) {
    const r = document.createElement("div");
    return ((r.className = "kurse-delete-guard"), r);
  }
  let n = e.querySelector(".kurse-delete-guard");
  return (
    n || ((n = document.createElement("div")), (n.className = "kurse-delete-guard"), e.prepend(n)),
    (n.innerHTML = ""),
    n
  );
}
function bt(e = []) {
  const n = document.createElement("div");
  n.className = "kurse-delete-guard";
  const r = U("Der Kurs kann nicht gelöscht werden, da noch verknüpfte Daten existieren.", {
    variant: "warn",
    role: "alert",
  });
  if ((n.appendChild(r), Array.isArray(e) && e.length)) {
    const t = document.createElement("ul");
    ((t.className = "kurse-delete-guard__list"),
      e.forEach((a) => {
        const o = document.createElement("li");
        ((o.textContent = a), t.appendChild(o));
      }),
      n.appendChild(t));
  }
  return n;
}
function $(e) {
  if (!e) return;
  const n = e.querySelector("h1") || e.querySelector("h2");
  n && (n.setAttribute("tabindex", "-1"), n.focus());
}
function ee() {
  typeof window > "u" ||
    typeof window.scrollTo != "function" ||
    window.scrollTo({ top: 0, behavior: "smooth" });
}
export { _t as initModule };
