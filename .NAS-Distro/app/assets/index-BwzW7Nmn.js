import { l as X, g as ee, d as pe, c as he, u as fe } from "./trainer-BTYLIueh.js";
import { listKunden as be } from "./kunden-BBFUy98K.js";
import { h as Q, b as ye } from "./kurse-BUlwv0_9.js";
import { b as Ce } from "./finanzen-C7TK8AhO.js";
import { r as Ee } from "./index-Cx63mBGt.js";
import { a as A, d as k, e as _, f as J, c as O, b as T } from "./components-CDhMLcLx.js";
import { c as we } from "./routes-BDgDrvEz.js";
import "./httpClient-DjX31kqd.js";
const re = {
  list: "Übersicht",
  detail: "Details",
  create: "Neu",
  edit: "Bearbeiten",
  delete: "Löschen",
};
let j = null;
async function tt(t, e) {
  if (!t) return;
  ((t.innerHTML = ""), t.classList.add("trainer-view"));
  const { view: n, id: r } = ve(e),
    a = document.createElement("section");
  a.className = "dogule-section trainer-section";
  try {
    n === "list"
      ? await ge(a)
      : n === "detail" && r
        ? await _e(a, r)
        : n === "create"
          ? await qe(a)
          : n === "edit" && r
            ? await We(a, r)
            : n === "delete" && r
              ? await Ze(a, r)
              : Te(a, re[n] || re.list);
  } catch (l) {
    (console.error("[TRAINER_LIST_ERROR]", l), Se(a));
  }
  (t.appendChild(a), Ve(t, a), K(a));
}
function ve(t) {
  const e = (t == null ? void 0 : t.segments) || [];
  return e.length === 0
    ? { view: "list" }
    : e[0] === "new"
      ? { view: "create" }
      : e.length === 1
        ? { view: "detail", id: e[0] }
        : e[1] === "edit"
          ? { view: "edit", id: e[0] }
          : e[1] === "delete"
            ? { view: "delete", id: e[0] }
            : { view: "list" };
}
async function ge(t) {
  const e = A({ eyebrow: "", title: "Aktionen", body: "", footer: "" }),
    n = e.querySelector(".ui-card__body");
  n.innerHTML = "";
  const r = document.createElement("div");
  r.className = "module-actions";
  const a = k({
    label: "Neuer Trainer",
    variant: "primary",
    onClick: () => {
      window.location.hash = "#/trainer/new";
    },
  });
  (r.appendChild(a), n.appendChild(r));
  const l = A({ eyebrow: "", title: "Trainerliste", body: "", footer: "" }),
    p = l.querySelector(".ui-card__body");
  p.innerHTML = "";
  let m = [];
  try {
    m = await X();
  } catch (i) {
    (console.error("[TRAINER_LIST_LOAD_FAIL]", i),
      p.appendChild(_("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      t.append(e, l));
    return;
  }
  if (!m.length) p.appendChild(J("Keine Daten vorhanden.", ""));
  else {
    let h = function () {
        C.querySelectorAll("th").forEach((o) => {
          const u = o.dataset.sortKey;
          if (!u) return;
          const b = u === i.key;
          o.setAttribute(
            "aria-sort",
            b ? (i.direction === "asc" ? "ascending" : "descending") : "none"
          );
          const E = o.querySelector("button");
          if (!E) return;
          const v = b ? (i.direction === "asc" ? "↑" : "↓") : "";
          E.textContent = v ? `${o.dataset.label} ${v}` : o.dataset.label || "";
        });
      },
      f = function () {
        ((y.innerHTML = ""),
          m
            .map((u, b) => ({ entry: u, index: b }))
            .sort((u, b) => {
              const E = w.find((L) => L.key === i.key),
                v = (E == null ? void 0 : E.sortValue) || (E == null ? void 0 : E.value),
                g = (v ? v(u.entry) : "").toString(),
                N = (v ? v(b.entry) : "").toString(),
                S = g.localeCompare(N, "de", { sensitivity: "base" });
              return S !== 0 ? (i.direction === "asc" ? S : -S) : u.index - b.index;
            })
            .forEach(({ entry: u }) => {
              const b = document.createElement("tr");
              ((b.className = "trainer-list-row"),
                w.forEach((E) => {
                  const v = document.createElement("td");
                  if (E.isLink) {
                    const g = document.createElement("a");
                    ((g.href = `#/trainer/${u.id}`),
                      (g.className = "trainer-list__link"),
                      (g.textContent = E.value(u)),
                      g.setAttribute("aria-label", `${u.name || u.code || u.id} öffnen`),
                      v.appendChild(g));
                  } else v.textContent = E.value(u);
                  b.appendChild(v);
                }),
                y.appendChild(b));
            }));
      };
    const i = { key: "name", direction: "asc" },
      c = document.createElement("div");
    c.className = "trainer-list-scroll";
    const d = document.createElement("table");
    d.className = "trainer-list-table";
    const s = document.createElement("thead"),
      C = document.createElement("tr"),
      y = document.createElement("tbody"),
      w = [
        {
          key: "name",
          label: "Name",
          value: (o) => Y(o.name),
          sortValue: (o) => (o.name || "").toLowerCase(),
          isLink: !0,
        },
        {
          key: "telefon",
          label: "Telefon",
          value: (o) => Y(o.telefon),
          sortValue: (o) => (o.telefon || "").toLowerCase(),
        },
        {
          key: "email",
          label: "E-Mail",
          value: (o) => Y(o.email),
          sortValue: (o) => (o.email || "").toLowerCase(),
        },
        {
          key: "code",
          label: "Code",
          value: (o) => Y(o.code),
          sortValue: (o) => (o.code || "").toLowerCase(),
        },
      ];
    (w.forEach((o) => {
      const u = document.createElement("th");
      ((u.dataset.sortKey = o.key), (u.dataset.label = o.label));
      const b = document.createElement("button");
      ((b.type = "button"),
        (b.className = "trainer-sort-btn"),
        b.addEventListener("click", () => {
          (i.key === o.key
            ? (i.direction = i.direction === "asc" ? "desc" : "asc")
            : ((i.key = o.key), (i.direction = "asc")),
            h(),
            f());
        }),
        u.appendChild(b),
        C.appendChild(u));
    }),
      s.appendChild(C),
      d.append(s, y),
      c.appendChild(d),
      p.appendChild(c),
      h(),
      f());
  }
  t.append(e, l);
}
async function _e(t, e) {
  var f;
  const n = O({ title: "Trainer", subtitle: "Details", level: 2 });
  t.appendChild(n);
  const r = A({ eyebrow: "", title: "Aktionen", body: "", footer: "" }),
    a = r.querySelector(".ui-card__body");
  a.innerHTML = "";
  const l = document.createElement("div");
  ((l.className = "module-actions"),
    l.appendChild(
      k({
        label: "Bearbeiten",
        variant: "primary",
        onClick: () => {
          window.location.hash = `#/trainer/${e}/edit`;
        },
      })
    ),
    l.appendChild(
      k({
        label: "Löschen",
        variant: "warn",
        onClick: () => {
          window.location.hash = `#/trainer/${e}/delete`;
        },
      })
    ),
    a.appendChild(l));
  const p = A({ eyebrow: "", title: "Stammdaten", body: "", footer: "" }),
    m = p.querySelector(".ui-card__body");
  m.innerHTML = "";
  let i = null;
  try {
    i = await ee(e);
  } catch (o) {
    (console.error("[TRAINER_DETAIL_ERROR]", o),
      m.appendChild(_("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      t.append(r, p));
    return;
  }
  if (!i) {
    t.appendChild(_("Datensatz nicht gefunden.", { variant: "warn", role: "alert" }));
    const o = document.createElement("a");
    ((o.href = "#/trainer"),
      (o.className = "ui-btn ui-btn--quiet"),
      (o.textContent = "Zur Übersicht"),
      t.appendChild(o));
    return;
  }
  i.titel || m.appendChild(_("Titel fehlt. Für Zertifikate erforderlich.", { variant: "info" }));
  const c = [
      ["ID", i.id],
      ["Code", i.code || "—"],
      ["Name", i.name || "—"],
      ["Titel", i.titel || "—"],
      ["Telefon", i.telefon || "—"],
      ["E-Mail", i.email || "—"],
      ["Ausbildungshistorie", i.ausbildungshistorie || i.ausbildung || "—"],
      ["Stundenerfassung", oe(i.stundenerfassung)],
      ["Lohnabrechnung", oe(i.lohnabrechnung)],
      ["Notizen", i.notizen || "—"],
      [
        "Verfügbarkeiten",
        (f = i.verfuegbarkeiten) != null && f.length
          ? i.verfuegbarkeiten
              .map((o) => `${He(o.weekday)}, ${o.startTime || "??:??"}–${o.endTime || "??:??"}`)
              .join("<br>")
          : "Keine Angaben",
      ],
      ["Erstellt am", i.createdAt || "—"],
      ["Aktualisiert am", i.updatedAt || "—"],
    ],
    d = document.createElement("dl");
  ((d.className = "trainer-details"),
    c.forEach(([o, u]) => {
      const b = document.createElement("dt");
      b.textContent = o;
      const E = document.createElement("dd");
      ((E.innerHTML = u || "—"), d.append(b, E));
    }),
    m.appendChild(d),
    t.append(r, p));
  let s = [],
    C = !1;
  try {
    s = await Q(e);
  } catch (o) {
    ((C = !0), console.error("[TRAINER_KURSE_LOAD_FAIL]", o));
  }
  const y = Ne(s, C);
  y && t.appendChild(y);
  const w = await Le(e);
  w && t.appendChild(w);
  const h = await ke(e);
  h && t.appendChild(h);
}
function Te(t, e) {
  const n = document.createElement("div");
  ((n.className = "trainer-placeholder"),
    (n.textContent = `Platzhalter für ${e}`),
    t.appendChild(n));
}
function Se(t) {
  t.appendChild(_("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" }));
}
function Ne(t = [], e = !1) {
  const n = document.createElement("section");
  ((n.className = "trainer-linked-kurse"),
    n.appendChild(O({ title: "Kurse dieses Trainers", subtitle: "", level: 2 })));
  const r = A({ eyebrow: "", title: "", body: "", footer: "" }),
    a = r.querySelector(".ui-card") || r.firstElementChild;
  if (!a) return n;
  const l = a.querySelector(".ui-card__body");
  return (
    (l.innerHTML = ""),
    e
      ? l.appendChild(_("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" }))
      : t.length
        ? Fe(t).forEach((m) => {
            const i = A({
                eyebrow: m.code || m.id,
                title: m.title || "Ohne Titel",
                body: "",
                footer: "",
              }),
              c = i.querySelector(".ui-card") || i.firstElementChild;
            if (!c) return;
            c.classList.add("trainer-linked-kurs");
            const d = c.querySelector(".ui-card__body");
            d.innerHTML = "";
            const s = document.createElement("div");
            s.className = "trainer-linked-kurs__info";
            const C = document.createElement("p");
            C.textContent = `${ne(m.date)} · ${m.location || "Ort offen"}`;
            const y = document.createElement("p");
            ((y.textContent = `Zeit: ${$e(m.startTime, m.endTime)}`),
              s.append(C, y),
              d.appendChild(s));
            const w = document.createElement("a");
            ((w.href = `#/kurse/${m.id}`),
              (w.className = "trainer-linked-kurs__link"),
              w.appendChild(c),
              l.appendChild(w));
          })
        : l.appendChild(J("Keine Daten vorhanden.", "")),
    n.appendChild(a),
    n
  );
}
async function Le(t) {
  const e = document.createElement("section");
  ((e.className = "trainer-linked-kalender"),
    e.appendChild(O({ title: "Kalendereinsätze", subtitle: "", level: 2 })));
  const n = A({ eyebrow: "", title: "", body: "", footer: "" }),
    r = n.querySelector(".ui-card") || n.firstElementChild;
  if (!r) return e;
  const a = r.querySelector(".ui-card__body");
  a.innerHTML = "";
  let l = [],
    p = !1;
  try {
    l = ((await ye()) || []).filter((i) => String(i.trainerId || "") === String(t));
  } catch (m) {
    ((p = !0), console.error("[TRAINER_KALENDER_LOAD_FAIL]", m));
  }
  if (p)
    a.appendChild(_("Fehler beim Laden der Kalenderdaten.", { variant: "warn", role: "alert" }));
  else if (!l.length) a.appendChild(J("Keine Kalenderereignisse für diesen Trainer.", ""));
  else {
    const m = ze(l),
      i = document.createElement("div");
    ((i.className = "trainer-kalender__list"),
      m.forEach((c) => {
        const d = document.createElement("div");
        d.className = "trainer-kalender__row";
        const s = document.createElement("div");
        ((s.className = "trainer-kalender__time"),
          (s.textContent = `${ne(c.start)} · ${Be(c.start, c.end)}`));
        const C = document.createElement("div");
        ((C.className = "trainer-kalender__title"),
          (C.textContent = c.title || c.code || "Ereignis"));
        const y = document.createElement("div");
        y.className = "trainer-kalender__actions";
        const w = [];
        if (c.kursId) {
          const h = document.createElement("a");
          ((h.href = `#/kurse/${encodeURIComponent(c.kursId)}`),
            (h.className = "ui-btn ui-btn--ghost"),
            (h.textContent = "Zum Kurs"),
            w.push(h));
        }
        if (c.id) {
          const h = document.createElement("a");
          ((h.href = we({ mode: "event", eventId: c.id })),
            (h.className = "ui-btn ui-btn--ghost"),
            (h.textContent = "Ereignis"),
            w.push(h));
        }
        if (w.length) w.forEach((h) => y.appendChild(h));
        else {
          const h = document.createElement("span");
          ((h.textContent = "Keine Links verfügbar"), y.appendChild(h));
        }
        (d.append(s, C, y), i.appendChild(d));
      }),
      a.appendChild(i));
  }
  return (e.appendChild(r), e);
}
async function ke(t) {
  const e = document.createElement("section");
  ((e.className = "trainer-revenue"),
    e.appendChild(O({ title: "Umsatz aus Kursen", subtitle: "", level: 2 })));
  const n = A({ eyebrow: "", title: "", body: "", footer: "" }),
    r = n.querySelector(".ui-card") || n.firstElementChild;
  if (!r) return e;
  const a = r.querySelector(".ui-card__body");
  a.innerHTML = "";
  let l = { entries: [], totals: { bezahlt: 0, offen: 0, saldo: 0 } },
    p = new Map(),
    m = !1;
  try {
    const [i, c] = await Promise.all([Ce(t), Ae()]);
    ((l = i || l), (p = c || p));
  } catch (i) {
    ((m = !0), console.error("[TRAINER_FINANZEN_LOAD_FAIL]", i));
  }
  if (m) a.appendChild(_("Fehler beim Laden der Finanzdaten.", { variant: "warn", role: "alert" }));
  else if (!l.entries.length)
    a.appendChild(J("Keine Finanzdaten für diesen Trainer vorhanden.", ""));
  else {
    const i = document.createElement("dl");
    ((i.className = "trainer-revenue__summary"),
      i.appendChild(G("Summe Bezahlt", l.totals.bezahlt)),
      i.appendChild(G("Summe Offen", l.totals.offen)),
      i.appendChild(G("Saldo", l.totals.saldo)),
      a.appendChild(i));
    const c = document.createElement("div");
    ((c.className = "trainer-revenue__list"),
      l.entries.slice(0, 5).forEach((d) => {
        const s = document.createElement("div");
        s.className = "trainer-revenue__row";
        const C = document.createElement("div");
        ((C.className = "trainer-revenue__date"), (C.textContent = ne(d.datum)));
        const y = document.createElement("div");
        ((y.className = "trainer-revenue__kunde"), (y.textContent = Re(d.kundeId, p)));
        const w = document.createElement("div");
        ((w.className = "trainer-revenue__typ"), (w.textContent = Me(d.typ)));
        const h = document.createElement("div");
        ((h.className = "trainer-revenue__betrag"), (h.textContent = se(d.betrag)));
        const f = document.createElement("div");
        f.className = "trainer-revenue__link";
        const o = document.createElement("a");
        ((o.href = `#/finanzen/${d.id}`),
          (o.className = "ui-btn ui-btn--ghost"),
          (o.textContent = "Details"),
          f.appendChild(o),
          s.append(C, y, w, h, f),
          c.appendChild(s));
      }),
      a.appendChild(c));
  }
  return (e.appendChild(r), e);
}
function G(t, e) {
  const n = document.createElement("div");
  n.className = "trainer-revenue__summary-row";
  const r = document.createElement("dt");
  r.textContent = t;
  const a = document.createElement("dd");
  return ((a.textContent = se(e)), n.append(r, a), n);
}
async function Ae() {
  if (j) return j;
  try {
    const t = await be(),
      e = new Map();
    return (
      t.forEach((n) => {
        const r = (n == null ? void 0 : n.code) || (n == null ? void 0 : n.id) || "",
          a =
            `${(n == null ? void 0 : n.vorname) || ""} ${(n == null ? void 0 : n.nachname) || ""}`.trim();
        e.set(n.id, { ...n, code: r, name: a });
      }),
      (j = e),
      j
    );
  } catch (t) {
    return (console.error("[TRAINER_KUNDEN_MAP_FAIL]", t), (j = new Map()), j);
  }
}
function Re(t, e = new Map()) {
  if (!t) return "Kein Kunde verknüpft";
  const n = e.get(t);
  if (!n) return `Unbekannter Kunde (${t})`;
  const r = n.code || n.id || "–",
    a = n.name || `${n.vorname || ""} ${n.nachname || ""}`.trim() || "Unbenannt";
  return `${r} – ${a}`;
}
async function qe(t) {
  const e = O({ title: "Neuer Trainer", subtitle: "Erfasse einen neuen Trainer.", level: 2 });
  t.appendChild(e);
  let n = [];
  try {
    n = await X();
  } catch (W) {
    (console.error("[TRAINER_CREATE_LOAD_FAIL]", W),
      t.appendChild(_("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      te(t, "#/trainer"),
      K(t));
    return;
  }
  const r = ue(n),
    a = Ke(n);
  let l = !1;
  const p = A({ eyebrow: "", title: "Stammdaten", body: "", footer: "" }),
    m = p.querySelector(".ui-card") || p.firstElementChild,
    i = m.querySelector(".ui-card__body");
  i.innerHTML = "";
  const c = document.createElement("div");
  ((c.className = "trainer-form-status"), i.appendChild(c));
  const d = document.createElement("form");
  ((d.noValidate = !0),
    (d.className = "trainer-form"),
    (d.id = "trainer-create-form"),
    i.appendChild(d));
  const s = {},
    C = T({
      id: "trainer-id",
      label: "Trainer-ID",
      placeholder: "Wird automatisch vergeben",
      required: !1,
      describedByText: "Systemgenerierte ID, wird beim Speichern vergeben.",
    }),
    y = C.querySelector("input");
  ((y.name = "id"), (y.value = a), (y.readOnly = !0), y.setAttribute("aria-readonly", "true"));
  const w = C.querySelector(".ui-form-row__hint");
  (w && w.classList.remove("sr-only"), d.appendChild(C));
  const h = T({
      id: "trainer-code",
      label: "Trainer-Code*",
      placeholder: "z. B. TR-004",
      required: !0,
      describedByText:
        'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
    }),
    f = h.querySelector("input");
  ((f.name = "code"), (f.value = r), (f.readOnly = !0), f.setAttribute("aria-readonly", "true"));
  const o = h.querySelector(".ui-form-row__hint");
  o && o.classList.remove("sr-only");
  const u = document.createElement("div");
  u.className = "trainer-code-toggle";
  const b = k({ label: "Code manuell ändern", variant: "secondary" });
  ((b.type = "button"),
    b.addEventListener("click", () => {
      ((l = !l),
        l
          ? ((f.readOnly = !1),
            f.removeAttribute("aria-readonly"),
            (b.textContent = "Automatischen Code verwenden"),
            f.focus())
          : ((f.readOnly = !0),
            f.setAttribute("aria-readonly", "true"),
            (b.textContent = "Code manuell ändern"),
            f.value.trim() || (f.value = r)));
    }),
    u.appendChild(b),
    h.appendChild(u),
    (s.code = { input: f, hint: o }),
    d.appendChild(h));
  const E = T({
      id: "trainer-name",
      label: "Name*",
      required: !0,
      placeholder: "z. B. Martina Frei",
    }),
    v = E.querySelector("input");
  ((v.name = "name"),
    (s.name = { input: v, hint: E.querySelector(".ui-form-row__hint") }),
    d.appendChild(E));
  const g = T({
      id: "trainer-titel",
      label: "Titel (für Zertifikate erforderlich)",
      placeholder: "z. B. Dipl. Hundetrainer:in",
      describedByText: "Für Zertifikate erforderlich.",
    }),
    N = g.querySelector("input");
  ((N.name = "titel"),
    (s.titel = { input: N, hint: g.querySelector(".ui-form-row__hint") }),
    d.appendChild(g));
  const S = T({ id: "trainer-telefon", label: "Telefon", placeholder: "z. B. +41 44 700 00 01" }),
    L = S.querySelector("input");
  ((L.name = "telefon"), (s.telefon = { input: L, hint: S.querySelector(".ui-form-row__hint") }));
  const D = S.querySelector(".ui-form-row__hint");
  (D == null || D.classList.add("sr-only"), d.appendChild(S));
  const R = T({
      id: "trainer-email",
      label: "E-Mail",
      type: "email",
      placeholder: "z. B. trainer@example.com",
    }),
    V = R.querySelector("input");
  ((V.name = "email"), (s.email = { input: V, hint: R.querySelector(".ui-form-row__hint") }));
  const q = R.querySelector(".ui-form-row__hint");
  (q == null || q.classList.add("sr-only"), d.appendChild(R));
  const I = T({
      id: "trainer-notizen",
      label: "Notizen",
      control: "textarea",
      placeholder: "Optionale Ergänzungen",
    }),
    F = I.querySelector("textarea");
  ((F.name = "notizen"), (s.notizen = { input: F, hint: I.querySelector(".ui-form-row__hint") }));
  const $ = I.querySelector(".ui-form-row__hint");
  ($ == null || $.classList.add("sr-only"), d.appendChild(I));
  const x = T({
      id: "trainer-verfuegbarkeiten",
      label: "Verfügbarkeiten",
      control: "textarea",
      placeholder: "Eine Verfügbarkeit pro Zeile, z. B. 1 08:00-14:00",
    }),
    P = x.querySelector("textarea");
  ((P.name = "verfuegbarkeiten"),
    (s.verfuegbarkeiten = { input: P, hint: x.querySelector(".ui-form-row__hint"), parser: me }));
  const B = x.querySelector(".ui-form-row__hint");
  (B &&
    ((B.textContent = "Format: Wochentag Start-Ende, z. B. 1 08:00-14:00"),
    B.classList.remove("sr-only")),
    d.appendChild(x));
  const z = m.querySelector(".ui-card__footer");
  z.innerHTML = "";
  const M = document.createElement("div");
  M.className = "module-actions trainer-form-actions";
  const H = k({ label: "Erstellen", variant: "primary" });
  ((H.type = "submit"), H.addEventListener("click", () => d.requestSubmit()));
  const Z = k({ label: "Abbrechen", variant: "quiet" });
  ((Z.type = "button"),
    Z.addEventListener("click", () => {
      window.location.hash = "#/trainer";
    }),
    M.append(H, Z),
    z.appendChild(M),
    d.addEventListener("submit", (W) =>
      Ie(W, { refs: s, submit: H, defaultCode: r, statusSlot: c })
    ),
    t.appendChild(m),
    K(t));
}
async function Ie(t, { refs: e, submit: n, defaultCode: r, statusSlot: a }) {
  var m;
  (t.preventDefault(), a && (a.innerHTML = ""));
  const l = le(e, { defaultCode: r }),
    p = ce(l);
  if ((de(e, p), Object.keys(p).length)) {
    const i = Object.values(e).find((c) => c.hint && !c.hint.classList.contains("sr-only"));
    i == null || i.input.focus();
    return;
  }
  ((n.disabled = !0), (n.textContent = "Erstelle ..."));
  try {
    const i = await he(l);
    if (!(i != null && i.id)) throw new Error("Trainer erstellen ohne ID");
    (a &&
      (a.appendChild(_("Trainer wurde erstellt.", { variant: "ok", role: "status" })),
      (m = i.login) != null &&
        m.username &&
        a.appendChild(
          _(`Login erstellt: ${i.login.username} / ${i.login.tempPassword || ""}`.trim(), {
            variant: "info",
            role: "status",
          })
        )),
      (window.location.hash = `#/trainer/${i.id}`));
  } catch (i) {
    (console.error("[TRAINER_CREATE_SAVE_FAIL]", i),
      a && a.appendChild(_("Fehler beim Speichern.", { variant: "warn", role: "alert" })),
      (n.disabled = !1),
      (n.textContent = "Erstellen"));
  }
}
function le(t, e) {
  const n = {};
  Object.entries(t || {}).forEach(([a, l]) => {
    l != null &&
      l.input &&
      (typeof l.parser == "function"
        ? (n[a] = l.parser(l.input.value))
        : (n[a] = l.input.value.trim()));
  });
  const r = typeof e == "object" && e !== null ? e : { defaultCode: e };
  return (n.code || (n.code = r.defaultCode), n);
}
function ce(t = {}) {
  const e = {};
  return (t.code || (e.code = "Code fehlt."), t.name || (e.name = "Bitte einen Namen angeben."), e);
}
function de(t = {}, e = {}) {
  Object.entries(t).forEach(([n, r]) => {
    const a = r.hint;
    e[n]
      ? (a && ((a.textContent = e[n]), a.classList.remove("sr-only")),
        r.input.setAttribute("aria-invalid", "true"))
      : (a && ((a.textContent = ""), a.classList.add("sr-only")),
        r.input.setAttribute("aria-invalid", "false"));
  });
}
function te(t, e) {
  const n = document.createElement("a");
  ((n.href = e),
    (n.className = "ui-btn ui-btn--quiet"),
    (n.textContent = "Zur Übersicht"),
    t.appendChild(n));
}
function ne(t) {
  if (!t) return "Datum folgt";
  const e = new Date(t);
  return Number.isNaN(e.getTime())
    ? t
    : e.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function xe(t = {}) {
  return !!((t.date || "").trim() && (t.startTime || "").trim());
}
function De(t = "") {
  const e = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!e) return null;
  const n = Number.parseInt(e[1], 10),
    r = Number.parseInt(e[2], 10);
  return !Number.isFinite(n) || !Number.isFinite(r) ? null : n * 60 + r;
}
function ae(t = {}) {
  if (!xe(t)) return Number.POSITIVE_INFINITY;
  const e = new Date(t.date);
  if (Number.isNaN(e.getTime())) return Number.POSITIVE_INFINITY;
  const n = De(t.startTime) ?? 0;
  return new Date(
    e.getFullYear(),
    e.getMonth(),
    e.getDate(),
    Math.floor(n / 60),
    n % 60,
    0,
    0
  ).getTime();
}
function Fe(t = []) {
  return [...t].sort((e, n) => {
    const r = ae(e),
      a = ae(n);
    return r !== a ? r - a : String(e.id || "").localeCompare(String(n.id || ""));
  });
}
function $e(t, e) {
  return `${t || "00:00"}–${e || "00:00"}`;
}
function Be(t, e) {
  const n = new Date(t),
    r = new Date(e || t);
  return Number.isNaN(n.getTime()) || Number.isNaN(r.getTime())
    ? "Zeit offen"
    : `${ie(n)}–${ie(r)}`;
}
function ie(t) {
  const e = String(t.getHours()).padStart(2, "0"),
    n = String(t.getMinutes()).padStart(2, "0");
  return `${e}:${n}`;
}
function ze(t = []) {
  return [...t].sort((e, n) => {
    const r = new Date(e.start || "").getTime(),
      a = new Date(n.start || "").getTime();
    return Number.isNaN(r) && Number.isNaN(a)
      ? String(e.id || "").localeCompare(String(n.id || ""))
      : Number.isNaN(r)
        ? 1
        : Number.isNaN(a)
          ? -1
          : r !== a
            ? r - a
            : String(e.id || "").localeCompare(String(n.id || ""));
  });
}
function se(t) {
  return `${(Number.isFinite(t) ? t : Number(t) || 0).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`;
}
function Me(t) {
  const e = String(t || "").toLowerCase();
  return e === "bezahlt" || e === "zahlung" ? "Bezahlt" : e === "offen" ? "Offen" : "–";
}
function Y(t) {
  return t == null ? "–" : (typeof t == "string" ? t.trim() : String(t)) || "–";
}
function He(t) {
  const e = Number(t),
    n = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
  return (Number.isFinite(e) && n[e]) || "Wochentag ?";
}
function oe(t) {
  return t === !0 ? "Ja" : t === !1 ? "Nein" : "–";
}
function ue(t = []) {
  let e = 0;
  t.forEach((r) => {
    const l = (r.code || r.id || "").trim().match(/(\d+)/);
    if (!l) return;
    const p = Number.parseInt(l[1], 10);
    Number.isFinite(p) && p > e && (e = p);
  });
  const n = e + 1;
  return `TR-${String(n).padStart(3, "0")}`;
}
function Ke(t = []) {
  let e = 0;
  return (
    t.forEach((r) => {
      const l = (r.id || "").trim().match(/(\d+)/);
      if (!l) return;
      const p = Number.parseInt(l[1], 10);
      Number.isFinite(p) && p > e && (e = p);
    }),
    `t${e + 1}`
  );
}
function me(t = "") {
  return t
    .split(
      `
`
    )
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => {
      const r = n.match(/(\d)[\s,;:-]*(\d{1,2}:\d{2})?\s*[-–]?\s*(\d{1,2}:\d{2})?/);
      return {
        weekday: (r && Number.parseInt(r[1], 10)) || 0,
        startTime: (r == null ? void 0 : r[2]) || "",
        endTime: (r == null ? void 0 : r[3]) || "",
      };
    });
}
function Oe(t = []) {
  return Array.isArray(t)
    ? t
        .map((e) => {
          if (!e) return "";
          const n = e.weekday ?? "",
            r = e.startTime || "",
            a = e.endTime || "";
          return n === "" && !r && !a ? "" : r || a ? `${n} ${r}-${a}`.trim() : String(n);
        })
        .filter(Boolean).join(`
`)
    : "";
}
function Ve(t, e) {
  var n;
  ((n = t.scrollTo) == null || n.call(t, { top: 0, behavior: "smooth" }),
    typeof requestAnimationFrame == "function" &&
      e != null &&
      e.focus &&
      requestAnimationFrame(() => e.focus({ preventScroll: !0 })));
}
function K(t) {
  if (!t) return;
  const e = t.querySelector("h1, h2");
  e && (e.setAttribute("tabindex", "-1"), e.focus());
}
async function Ze(t, e) {
  const n = O({
    title: "Trainer löschen",
    subtitle: "Diese Aktion entfernt den Trainer dauerhaft.",
    level: 2,
  });
  t.appendChild(n);
  let r = null;
  try {
    r = await ee(e);
  } catch (u) {
    console.error("[TRAINER_DELETE_LOAD_FAIL]", u);
  }
  if (!r) {
    (t.appendChild(_("Datensatz nicht gefunden.", { variant: "warn", role: "alert" })),
      te(t, "#/trainer"),
      K(t));
    return;
  }
  let a = [];
  try {
    a = await Q(e);
  } catch (u) {
    console.error("[TRAINER_DELETE_KURSE_FAIL]", u);
  }
  const l = a.length > 0,
    p = A({ eyebrow: "", title: "Löschen bestätigen", body: "", footer: "" }),
    m = p.querySelector(".ui-card") || p.firstElementChild,
    i = m.querySelector(".ui-card__body");
  i.innerHTML = "";
  const c = document.createElement("p");
  c.textContent = "Dieser Schritt entfernt den Trainer dauerhaft aus dem System.";
  const d = document.createElement("p");
  d.innerHTML = `<strong>ID:</strong> ${r.id}`;
  const s = document.createElement("p");
  s.innerHTML = `<strong>Code:</strong> ${r.code || "—"}`;
  const C = document.createElement("p");
  ((C.innerHTML = `<strong>Name:</strong> ${r.name || "—"}`), i.append(c, d, s, C));
  const y = document.createElement("div");
  if (((y.className = "trainer-delete-status"), i.appendChild(y), l)) {
    const u = _(
      "Löschen blockiert: Der Trainer ist aktuell Kursen zugewiesen. Bitte zuerst umhängen.",
      { variant: "warn", role: "alert" }
    );
    y.appendChild(u);
    const b = document.createElement("ul");
    ((b.className = "trainer-delete-assignments"),
      a.forEach((E) => {
        const v = document.createElement("li"),
          g = document.createElement("a");
        ((g.href = `#/kurse/${E.id}`),
          (g.textContent = `${E.code || E.id} · ${E.title || "Kurs"}`),
          v.appendChild(g),
          b.appendChild(v));
      }),
      i.appendChild(b));
  }
  const w = m.querySelector(".ui-card__footer");
  w.innerHTML = "";
  const h = document.createElement("div");
  h.className = "trainer-delete-actions";
  const f = k({ label: l ? "Löschen blockiert" : "Löschen", variant: "warn" });
  ((f.type = "button"),
    l
      ? (f.disabled = !0)
      : f.addEventListener("click", async () => {
          ((y.innerHTML = ""), (f.disabled = !0), (f.textContent = "Lösche ..."));
          try {
            const u = await pe(e);
            if (!(u != null && u.ok)) throw new Error("Trainer Delete failed");
            (Ee(),
              y.appendChild(_("Trainer wurde gelöscht.", { variant: "ok", role: "status" })),
              (window.location.hash = "#/trainer"));
          } catch (u) {
            console.error("[TRAINER_DELETE_FAIL]", u);
            const b = (u == null ? void 0 : u.code) === "TRAINER_DELETE_BLOCKED",
              E = b ? "Löschen blockiert: Trainer ist Kursen zugewiesen." : "Fehler beim Löschen.";
            if ((y.appendChild(_(E, { variant: "warn", role: "alert" })), b)) {
              let v = [];
              try {
                v = await Q(e);
              } catch (g) {
                console.error("[TRAINER_DELETE_REFRESH_FAIL]", g);
              }
              if (v.length) {
                const g = document.createElement("ul");
                ((g.className = "trainer-delete-assignments"),
                  v.forEach((N) => {
                    const S = document.createElement("li"),
                      L = document.createElement("a");
                    ((L.href = `#/kurse/${N.id}`),
                      (L.textContent = `${N.code || N.id} · ${N.title || "Kurs"}`),
                      S.appendChild(L),
                      g.appendChild(S));
                  }),
                  y.appendChild(g));
              }
            }
            ((f.disabled = !1), (f.textContent = "Löschen"));
          }
        }));
  const o = k({ label: "Abbrechen", variant: "quiet" });
  ((o.type = "button"),
    o.addEventListener("click", () => {
      window.location.hash = `#/trainer/${e}`;
    }),
    h.append(f, o),
    w.appendChild(h),
    t.appendChild(m),
    K(t));
}
async function We(t, e) {
  var H, Z, W;
  const n = O({
    title: "Trainer bearbeiten",
    subtitle: "Passe die Daten dieses Trainers an.",
    level: 2,
  });
  t.appendChild(n);
  let r = null,
    a = [];
  try {
    ((a = await X()), (r = a.find((U) => U.id === e) || (await ee(e))));
  } catch (U) {
    console.error("[TRAINER_EDIT_LOAD_FAIL]", U);
  }
  if (!r) {
    (t.appendChild(_("Datensatz nicht gefunden.", { variant: "warn", role: "alert" })),
      te(t, "#/trainer"),
      K(t));
    return;
  }
  const l = ue(a);
  let p = !0;
  const m = A({ eyebrow: "", title: "Stammdaten", body: "", footer: "" }),
    i = m.querySelector(".ui-card") || m.firstElementChild,
    c = i.querySelector(".ui-card__body");
  c.innerHTML = "";
  const d = document.createElement("div");
  ((d.className = "trainer-form-status"), c.appendChild(d));
  const s = document.createElement("form");
  ((s.noValidate = !0),
    (s.className = "trainer-form"),
    (s.id = "trainer-edit-form"),
    c.appendChild(s));
  const C = {},
    y = T({
      id: "trainer-id",
      label: "ID",
      placeholder: "",
      required: !1,
      describedByText: "Systemgenerierte ID (nur Lesemodus).",
    }),
    w = y.querySelector("input");
  ((w.name = "id"),
    (w.value = r.id || ""),
    (w.readOnly = !0),
    w.setAttribute("aria-readonly", "true"));
  const h = y.querySelector(".ui-form-row__hint");
  (h && h.classList.remove("sr-only"), (C.id = { input: w, hint: h }), s.appendChild(y));
  const f = T({
      id: "trainer-code",
      label: "Trainer-Code*",
      placeholder: "z. B. TR-004",
      required: !0,
      describedByText:
        'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
    }),
    o = f.querySelector("input");
  ((o.name = "code"),
    (o.value = r.code || l),
    (o.readOnly = !0),
    o.setAttribute("aria-readonly", "true"));
  const u = f.querySelector(".ui-form-row__hint");
  u && u.classList.remove("sr-only");
  const b = document.createElement("div");
  b.className = "trainer-code-toggle";
  const E = k({ label: "Code manuell ändern", variant: "secondary" });
  ((E.type = "button"),
    E.addEventListener("click", () => {
      ((p = !p),
        p
          ? ((o.readOnly = !1),
            o.removeAttribute("aria-readonly"),
            (E.textContent = "Automatischen Code verwenden"),
            o.focus())
          : ((o.readOnly = !0),
            o.setAttribute("aria-readonly", "true"),
            (E.textContent = "Code manuell ändern"),
            o.value.trim() || (o.value = r.code || l)));
    }),
    b.appendChild(E),
    f.appendChild(b),
    (C.code = { input: o, hint: u }),
    s.appendChild(f));
  const v = T({
      id: "trainer-name",
      label: "Name*",
      required: !0,
      placeholder: "z. B. Martina Frei",
    }),
    g = v.querySelector("input");
  ((g.name = "name"),
    (g.value = r.name || ""),
    (C.name = { input: g, hint: v.querySelector(".ui-form-row__hint") }),
    s.appendChild(v));
  const N = T({
      id: "trainer-titel",
      label: "Titel (für Zertifikate erforderlich)",
      placeholder: "z. B. Dipl. Hundetrainer:in",
      describedByText: "Für Zertifikate erforderlich.",
    }),
    S = N.querySelector("input");
  ((S.name = "titel"),
    (S.value = r.titel || ""),
    (C.titel = { input: S, hint: N.querySelector(".ui-form-row__hint") }),
    s.appendChild(N));
  const L = T({ id: "trainer-telefon", label: "Telefon", placeholder: "z. B. +41 44 700 00 01" }),
    D = L.querySelector("input");
  ((D.name = "telefon"),
    (D.value = r.telefon || ""),
    (C.telefon = { input: D, hint: L.querySelector(".ui-form-row__hint") }),
    (H = L.querySelector(".ui-form-row__hint")) == null || H.classList.add("sr-only"),
    s.appendChild(L));
  const R = T({
      id: "trainer-email",
      label: "E-Mail",
      type: "email",
      placeholder: "z. B. trainer@example.com",
    }),
    V = R.querySelector("input");
  ((V.name = "email"),
    (V.value = r.email || ""),
    (C.email = { input: V, hint: R.querySelector(".ui-form-row__hint") }),
    (Z = R.querySelector(".ui-form-row__hint")) == null || Z.classList.add("sr-only"),
    s.appendChild(R));
  const q = T({
      id: "trainer-notizen",
      label: "Notizen",
      control: "textarea",
      placeholder: "Optionale Ergänzungen",
    }),
    I = q.querySelector("textarea");
  ((I.name = "notizen"),
    (I.value = r.notizen || ""),
    (C.notizen = { input: I, hint: q.querySelector(".ui-form-row__hint") }),
    (W = q.querySelector(".ui-form-row__hint")) == null || W.classList.add("sr-only"),
    s.appendChild(q));
  const F = T({
      id: "trainer-verfuegbarkeiten",
      label: "Verfügbarkeiten",
      control: "textarea",
      placeholder: "Eine Verfügbarkeit pro Zeile, z. B. 1 08:00-14:00",
    }),
    $ = F.querySelector("textarea");
  (($.name = "verfuegbarkeiten"),
    ($.value = Oe(r.verfuegbarkeiten)),
    (C.verfuegbarkeiten = { input: $, hint: F.querySelector(".ui-form-row__hint"), parser: me }));
  const x = F.querySelector(".ui-form-row__hint");
  (x &&
    ((x.textContent = "Format: Wochentag Start-Ende, z. B. 2 10:00-16:00"),
    x.classList.remove("sr-only")),
    s.appendChild(F));
  const P = i.querySelector(".ui-card__footer");
  P.innerHTML = "";
  const B = document.createElement("div");
  B.className = "module-actions trainer-form-actions";
  const z = k({ label: "Speichern", variant: "primary" });
  ((z.type = "submit"), z.addEventListener("click", () => s.requestSubmit()));
  const M = k({ label: "Abbrechen", variant: "quiet" });
  ((M.type = "button"),
    M.addEventListener("click", () => {
      window.location.hash = `#/trainer/${e}`;
    }),
    B.append(z, M),
    P.appendChild(B),
    s.addEventListener("submit", (U) =>
      je(U, { refs: C, submit: z, defaultCode: r.code || l, statusSlot: d, id: e })
    ),
    t.appendChild(i),
    K(t));
}
async function je(t, { refs: e, submit: n, defaultCode: r, statusSlot: a, id: l }) {
  (t.preventDefault(), a && (a.innerHTML = ""));
  const p = le(e, { defaultCode: r }),
    m = ce(p);
  if ((de(e, m), Object.keys(m).length)) {
    const c = Object.values(e).find((d) => d.hint && !d.hint.classList.contains("sr-only"));
    c == null || c.input.focus();
    return;
  }
  n.disabled = !0;
  const i = n.textContent;
  n.textContent = "Speichere ...";
  try {
    const c = await fe(l, p);
    if (!(c != null && c.id)) throw new Error("Trainer aktualisieren ohne ID");
    (a && a.appendChild(_("Änderungen gespeichert.", { variant: "ok", role: "status" })),
      (window.location.hash = `#/trainer/${l}`));
  } catch (c) {
    (console.error("[TRAINER_EDIT_SAVE_FAIL]", c),
      a && a.appendChild(_("Fehler beim Speichern.", { variant: "warn", role: "alert" })),
      (n.disabled = !1),
      (n.textContent = i));
  }
}
export { tt as initModule };
