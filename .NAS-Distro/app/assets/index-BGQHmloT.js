import { c as O, e as B, a as _, d as z, b as $, f as A } from "./components-CDhMLcLx.js";
import {
  listHunde as Z,
  createHund as pe,
  updateHund as be,
  deleteHund as ye,
  getHund as Ce,
} from "./hunde-Df0udqB2.js";
import { e as we } from "./xlsxExport-4x6MQqhX.js";
import { listKunden as ve, getKunde as Ee } from "./kunden-BBFUy98K.js";
import { r as le } from "./index-Cx63mBGt.js";
import { r as ge } from "./client-DHiLuc54.js";
import { g as de } from "./kurse-BUlwv0_9.js";
import { l as Se } from "./finanzen-C7TK8AhO.js";
import "./httpClient-DjX31kqd.js";
import "./trainer-BTYLIueh.js";
const ie = [
    { value: "", label: "Bitte wählen" },
    { value: "privat", label: "Privat" },
    { value: "züchter", label: "Züchter" },
    { value: "tierheim", label: "Tierheim" },
    { value: "tierschutz", label: "Tierschutz" },
    { value: "internet", label: "Internet" },
    { value: "zoohandel", label: "Zoohandel" },
  ],
  Ne = new Map(ie.filter((e) => e.value).map((e) => [e.value, e.label]));
function He(e) {
  const t = String(e || "").trim();
  return t ? Ne.get(t) || t : "";
}
const J = "__DOGULE_HUNDE_TOAST__",
  ke = [
    { value: "", label: "Bitte wählen" },
    { value: "Rüde", label: "Rüde" },
    { value: "Hündin", label: "Hündin" },
  ],
  Le = [
    { value: "", label: "Bitte wählen" },
    { value: "1", label: "Ja" },
    { value: "0", label: "Nein" },
  ];
async function ce(e, t = {}) {
  if (!e) return;
  const a = t.mode === "edit" ? "edit" : "create",
    n = (a === "edit" && t.hund) || null,
    l = t.id || (n == null ? void 0 : n.id) || "";
  ((e.innerHTML = ""),
    e.classList.add("hunde-view"),
    typeof window < "u" &&
      typeof window.scrollTo == "function" &&
      window.scrollTo({ top: 0, behavior: "smooth" }));
  const o = document.createElement("section");
  ((o.className = "dogule-section hunde-form-section"),
    e.appendChild(o),
    o.appendChild(
      O({
        title: "Hunde",
        subtitle:
          a === "create"
            ? "Neuer Hund – Erfasse einen neuen Hund für deine Hundeschule."
            : "Hund bearbeiten – Passe die Daten dieses Hundes an.",
        level: 1,
      })
    ),
    U(o));
  let r = null,
    h = [],
    m = [];
  try {
    [h, m] = await Promise.all([ve(), Z()]);
  } catch (v) {
    (console.error("[HUNDE_ERR_FORM_DATA]", v),
      o.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      o.appendChild(ae()),
      X(o));
    return;
  }
  if (a === "edit") {
    if (!l || !n) {
      (o.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
        o.appendChild(ae()),
        X(o));
      return;
    }
    r = n;
  }
  const b = _({ eyebrow: "", title: "Stammdaten", body: "", footer: "" }),
    c = b.querySelector(".ui-card") || b.firstElementChild;
  if (!c) return;
  o.appendChild(c);
  const f = document.createElement("form");
  ((f.noValidate = !0), (f.dataset.hundeForm = "true"));
  const y = `hunde-form-${a}-${l || "new"}`;
  f.id = y;
  const p = c.querySelector(".ui-card__body");
  ((p.innerHTML = ""), p.appendChild(f));
  const N =
      a === "edit" ? ((r == null ? void 0 : r.code) ?? (r == null ? void 0 : r.hundeId) ?? "") : "",
    L = a === "edit" ? N : se(m),
    d = _e(f, r, h, { hundeCodeValue: N, defaultHundCode: L }),
    S = c.querySelector(".ui-card__footer");
  S.innerHTML = "";
  const s = document.createElement("div");
  s.className = "module-actions hunde-form-actions";
  const u = z({ label: a === "create" ? "Erstellen" : "Speichern", variant: "primary" });
  ((u.type = "submit"), u.setAttribute("form", y));
  const g = z({
    label: "Abbrechen",
    variant: "quiet",
    onClick: () => {
      window.location.hash = a === "create" ? "#/hunde" : `#/hunde/${l}`;
    },
  });
  ((g.type = "button"), s.append(u, g), S.appendChild(s));
  const C = {
    mode: a,
    id: l,
    existing: r,
    kunden: h,
    refs: d,
    section: o,
    submit: u,
    hundeListe: m,
  };
  (f.addEventListener("submit", (v) => Ie(v, C)), X(o));
}
function _e(e, t = {}, a = [], { hundeCodeValue: n = "", defaultHundCode: l = "" } = {}) {
  const o = [{ value: "", label: "Bitte wählen" }, ...a.map((d) => ({ value: d.id, label: W(d) }))],
    r = {},
    h = new Map(a.map((d) => [d.id, d]));
  function m(d) {
    return String(d || "")
      .trim()
      .toLowerCase();
  }
  function b(d) {
    const S = m(d);
    if (!S) return o;
    const s = a.filter((u) =>
      [u.vorname, u.nachname, u.email, u.telefon, u.adresse, u.code, u.kundenCode]
        .filter(Boolean)
        .map(m)
        .join(" ")
        .includes(S)
    );
    return [{ value: "", label: "Bitte wählen" }, ...s.map((u) => ({ value: u.id, label: W(u) }))];
  }
  function c(d, S, s) {
    if (
      ((d.innerHTML = ""),
      S.forEach((u) => {
        const g = document.createElement("option");
        ((g.value = u.value),
          (g.textContent = u.label),
          u.value === s && (g.selected = !0),
          d.appendChild(g));
      }),
      s && !S.some((u) => u.value === s))
    ) {
      const u = h.get(s),
        g = document.createElement("option");
      ((g.value = s),
        (g.textContent = u ? W(u) : `Auswahl ${s}`),
        (g.selected = !0),
        d.appendChild(g));
    }
  }
  const f = $({
      id: "hund-id",
      label: "ID",
      placeholder: "Wird nach dem Speichern vergeben",
      describedByText: "Systemgeneriert und nicht änderbar.",
    }),
    y = f.querySelector("input");
  ((y.name = "immutableId"),
    (y.value = (t == null ? void 0 : t.id) || "Wird nach dem Speichern vergeben"),
    (y.readOnly = !0),
    y.setAttribute("aria-readonly", "true"));
  const p = f.querySelector(".ui-form-row__hint");
  (p.classList.remove("sr-only"),
    (r.id = { input: y, hint: p, defaultHint: (p == null ? void 0 : p.textContent) || "" }),
    e.appendChild(f));
  let N = !1;
  return (
    [
      {
        name: "hundeCode",
        value: n,
        config: {
          id: "hund-code",
          label: "Hundecode*",
          placeholder: "z. B. H-001",
          required: !0,
          describedByText:
            'Standardmäßig automatisch. Mit "Code manuell ändern" aktivierst du die Bearbeitung.',
        },
        readOnly: !0,
      },
      {
        name: "name",
        value: (t == null ? void 0 : t.name) ?? "",
        config: {
          id: "hund-name",
          label: "Name*",
          placeholder: "z. B. Bello vom Greifensee",
          required: !0,
        },
      },
      {
        name: "rufname",
        value: (t == null ? void 0 : t.rufname) ?? "",
        config: { id: "hund-rufname", label: "Rufname", placeholder: "z. B. Bello" },
      },
      {
        name: "rasse",
        value: (t == null ? void 0 : t.rasse) ?? "",
        config: { id: "hund-rasse", label: "Rasse", placeholder: "z. B. Labrador Retriever" },
      },
      {
        name: "geschlecht",
        config: {
          id: "hund-geschlecht",
          label: "Geschlecht",
          control: "select",
          options: ke.map((d) => ({
            ...d,
            selected: d.value === ((t == null ? void 0 : t.geschlecht) ?? ""),
          })),
        },
      },
      {
        name: "status",
        config: {
          id: "hund-status",
          label: "Status",
          control: "select",
          options: [
            { value: "", label: "Bitte wählen" },
            { value: "aktiv", label: "Aktiv" },
            { value: "verstorben", label: "Verstorben" },
          ].map((d) => ({ ...d, selected: d.value === ((t == null ? void 0 : t.status) ?? "") })),
        },
      },
      {
        name: "geburtsdatum",
        value: (t == null ? void 0 : t.geburtsdatum) ?? "",
        config: { id: "hund-geburtsdatum", label: "Geburtsdatum", type: "date" },
      },
      {
        name: "kastriert",
        config: {
          id: "hund-kastriert",
          label: "Kastriert",
          control: "select",
          options: Le.map((d) => ({
            ...d,
            selected:
              d.value ===
              ((t == null ? void 0 : t.kastriert) === !0
                ? "1"
                : (t == null ? void 0 : t.kastriert) === !1
                  ? "0"
                  : ""),
          })),
        },
      },
      {
        name: "felltyp",
        value: (t == null ? void 0 : t.felltyp) ?? (t == null ? void 0 : t.fellTyp) ?? "",
        config: { id: "hund-felltyp", label: "Felltyp", placeholder: "z. B. Kurzhaar" },
      },
      {
        name: "fellfarbe",
        value: (t == null ? void 0 : t.fellfarbe) ?? (t == null ? void 0 : t.fellFarbe) ?? "",
        config: { id: "hund-fellfarbe", label: "Fellfarbe", placeholder: "z. B. Schwarz" },
      },
      {
        name: "groesseTyp",
        value: (t == null ? void 0 : t.groesseTyp) ?? (t == null ? void 0 : t.groesseType) ?? "",
        config: { id: "hund-groesse-typ", label: "Größe (Typ)", placeholder: "z. B. Mittel" },
      },
      {
        name: "groesseCm",
        value: (t == null ? void 0 : t.groesseCm) != null ? String(t.groesseCm) : "",
        config: {
          id: "hund-groesse",
          label: "Größe (cm)",
          type: "number",
          placeholder: "z. B. 60",
        },
        min: "0",
        step: "0.5",
      },
      {
        name: "gewichtKg",
        value: (t == null ? void 0 : t.gewichtKg) != null ? String(t.gewichtKg) : "",
        config: {
          id: "hund-gewicht",
          label: "Gewicht (kg)",
          type: "number",
          placeholder: "z. B. 25",
        },
        min: "0",
        step: "0.1",
      },
      {
        name: "herkunft",
        config: {
          id: "hund-herkunft",
          label: "Herkunft",
          control: "select",
          options: ie.map((d) => ({
            ...d,
            selected: d.value === ((t == null ? void 0 : t.herkunft) ?? ""),
          })),
        },
      },
      {
        name: "chipNummer",
        value: (t == null ? void 0 : t.chipNummer) ?? (t == null ? void 0 : t.chipnummer) ?? "",
        config: { id: "hund-chip", label: "Chip Nummer", placeholder: "z. B. 978000000000000" },
      },
      {
        name: "kundenId",
        config: {
          id: "hund-kunden-id",
          label: "Kunde*",
          control: "select",
          required: !0,
          options: o.map((d) => ({
            ...d,
            selected: d.value === ((t == null ? void 0 : t.kundenId) ?? ""),
          })),
        },
      },
      {
        name: "trainingsziele",
        value: typeof (t == null ? void 0 : t.trainingsziele) == "string" ? t.trainingsziele : "",
        config: {
          id: "hund-trainingsziele",
          label: "Trainingsziele",
          control: "textarea",
          placeholder: "Kommagetrennte Ziele, z. B. Rückruf, Impulskontrolle",
        },
      },
      {
        name: "notizen",
        value: (t == null ? void 0 : t.notizen) ?? "",
        config: {
          id: "hund-notizen",
          label: "Notizen",
          control: "textarea",
          placeholder: "Besondere Hinweise zum Hund",
        },
      },
    ].forEach((d) => {
      if (d.name === "kundenId") {
        const C = $({
            id: "hund-kunden-search",
            label: "Kunde suchen",
            placeholder: "Name, E-Mail, Ort ...",
          }),
          v = C.querySelector("input");
        (v && (v.type = "search"), e.appendChild(C));
        const q = $(d.config),
          D = q.querySelector("input, select, textarea");
        ((D.name = d.name),
          c(D, o, (t == null ? void 0 : t.kundenId) ?? d.value ?? ""),
          v &&
            v.addEventListener("input", () => {
              const I = b(v.value);
              c(D, I, D.value);
            }));
        const T = q.querySelector(".ui-form-row__hint"),
          K = d.config.describedByText || "";
        (K ? ((T.textContent = K), T.classList.remove("sr-only")) : T.classList.add("sr-only"),
          (r[d.name] = { input: D, hint: T, defaultHint: K }),
          e.appendChild(q));
        return;
      }
      const S = $(d.config),
        s = S.querySelector("input, select, textarea");
      ((s.name = d.name),
        d.config.type === "number" &&
          (d.min !== void 0 && (s.min = d.min),
          d.max !== void 0 && (s.max = d.max),
          d.step !== void 0 && (s.step = d.step)),
        d.value !== void 0 && d.value !== null && (s.value = d.value || ""),
        d.name === "hundeCode" && !s.value && (s.value = l),
        d.readOnly && ((s.readOnly = !0), s.setAttribute("aria-readonly", "true")));
      const u = S.querySelector(".ui-form-row__hint"),
        g = d.config.describedByText || "";
      if (
        (g ? ((u.textContent = g), u.classList.remove("sr-only")) : u.classList.add("sr-only"),
        d.name === "hundeCode")
      ) {
        const C = document.createElement("div");
        C.className = "hunde-id-toggle";
        const v = z({ label: "Code manuell ändern", variant: "secondary" });
        ((v.type = "button"),
          v.addEventListener("click", () => {
            ((N = !N),
              N
                ? ((s.readOnly = !1),
                  s.removeAttribute("aria-readonly"),
                  (v.textContent = "Automatischen Code verwenden"),
                  s.focus())
                : ((s.readOnly = !0),
                  s.setAttribute("aria-readonly", "true"),
                  (v.textContent = "Code manuell ändern"),
                  s.value.trim() || (s.value = l)));
          }),
          C.appendChild(v),
          S.appendChild(C));
      }
      ((r[d.name] = { input: s, hint: u, defaultHint: g }), e.appendChild(S));
    }),
    r
  );
}
function Te(e) {
  const t = {};
  return (
    Object.entries(e).forEach(([a, n]) => {
      const l = n.input.value;
      t[a] = typeof l == "string" ? l.trim() : l;
    }),
    t
  );
}
function De(e, { isManualCode: t = !1 } = {}) {
  const a = {};
  if (
    (e.hundeCode ||
      (a.hundeCode = t ? "Bitte einen gültigen Hundecode eingeben." : "Hundecode fehlt."),
    e.name || (a.name = "Bitte den Namen des Hundes angeben."),
    e.kundenId || (a.kundenId = "Bitte eine Kunden-ID eintragen."),
    e.geburtsdatum)
  ) {
    const n = Date.parse(e.geburtsdatum);
    Number.isNaN(n) && (a.geburtsdatum = "Bitte ein gültiges Datum wählen.");
  }
  if (e.gewichtKg) {
    const n = Number(e.gewichtKg);
    (!Number.isFinite(n) || n <= 0) && (a.gewichtKg = "Bitte gültiges Gewicht angeben.");
  }
  if (e.groesseCm) {
    const n = Number(e.groesseCm);
    (!Number.isFinite(n) || n <= 0) && (a.groesseCm = "Bitte gültige Größe angeben.");
  }
  return a;
}
function Fe(e, t) {
  Object.entries(e).forEach(([a, n]) => {
    if (t[a])
      ((n.hint.textContent = t[a]),
        n.hint.classList.remove("sr-only"),
        n.input.setAttribute("aria-invalid", "true"));
    else {
      const l = n.defaultHint || "";
      (l
        ? ((n.hint.textContent = l), n.hint.classList.remove("sr-only"))
        : ((n.hint.textContent = ""), n.hint.classList.add("sr-only")),
        n.input.setAttribute("aria-invalid", "false"));
    }
  });
}
function ze(e) {
  return {
    code: e.hundeCode,
    name: e.name,
    rufname: e.rufname || "",
    rasse: e.rasse || "",
    geschlecht: e.geschlecht || "",
    status: e.status || "",
    geburtsdatum: e.geburtsdatum || "",
    kastriert: qe(e.kastriert),
    felltyp: e.felltyp || "",
    fellfarbe: e.fellfarbe || "",
    groesseTyp: e.groesseTyp || "",
    gewichtKg: te(e.gewichtKg),
    groesseCm: te(e.groesseCm),
    kundenId: e.kundenId,
    herkunft: e.herkunft || "",
    chipNummer: e.chipNummer || "",
    trainingsziele: e.trainingsziele || "",
    notizen: e.notizen || "",
  };
}
function Be(e, t, a) {
  return ee(e) ? (a === "create" || !t ? !0 : !ee(t)) : !1;
}
function ee(e) {
  const t = String(e || "").trim();
  if (!t) return !1;
  const a = t.split("-");
  if (a.length < 3) return !1;
  const n = Number(a[1]),
    l = Number(a[2]);
  if (!Number.isFinite(n) || !Number.isFinite(l)) return !1;
  const o = new Date();
  return o.getMonth() + 1 === n && o.getDate() === l;
}
function te(e) {
  if (e == null || e === "") return null;
  const t = Number(e);
  return Number.isFinite(t) ? t : null;
}
function qe(e) {
  return e == null || e === ""
    ? null
    : e === !0 || e === !1
      ? e
      : e === "1" || e === 1 || e === "true"
        ? !0
        : e === "0" || e === 0 || e === "false"
          ? !1
          : !!e;
}
function W(e = {}) {
  const a = [e.vorname, e.nachname]
    .filter((n) => !!(n && n.trim()))
    .join(" ")
    .trim();
  return a || (e.email ? e.email : e.id || "Unbekannter Kunde");
}
async function Ke(e, t) {
  const a = (e || "").trim();
  return a
    ? (await Z()).some((l) => {
        const o = (l.code || l.hundeId || "").trim();
        return !o || (t && l.id === t) ? !1 : o === a;
      })
    : !1;
}
function se(e = []) {
  let t = 0;
  e.forEach((n) => {
    const o = ((n == null ? void 0 : n.code) || (n == null ? void 0 : n.hundeId) || "")
      .trim()
      .match(/(\d+)/);
    if (!o) return;
    const r = Number.parseInt(o[1], 10);
    Number.isFinite(r) && r > t && (t = r);
  });
  const a = t + 1;
  return `H-${String(a).padStart(3, "0")}`;
}
async function Ie(
  e,
  { mode: t, id: a, existing: n, kunden: l, refs: o, section: r, submit: h, hundeListe: m }
) {
  var S;
  e.preventDefault();
  const b = (S = o.hundeCode) == null ? void 0 : S.input,
    c = b ? !b.readOnly : !1,
    f = Te(o);
  if (!c && !f.hundeCode) {
    const s = se(m);
    ((f.hundeCode = s), b && (b.value = s));
  }
  const y = De(f, { isManualCode: c });
  if (
    (Fe(o, y),
    Object.keys(y).length > 0 && !window.confirm("Es fehlen Pflichtfelder. Trotzdem speichern?"))
  ) {
    const u = Object.values(o).find((g) => !g.hint.classList.contains("sr-only"));
    u == null || u.input.focus();
    return;
  }
  const N = ze(f),
    L = h.textContent,
    d = t === "create" ? "Erstelle ..." : "Speichere ...";
  ((h.disabled = !0), (h.textContent = d));
  try {
    if (await Ke(f.hundeCode, t === "edit" ? a : null)) {
      (ne(r, "Hundecode ist bereits vergeben.", "error"), (h.disabled = !1), (h.textContent = L));
      return;
    }
    const u = t === "create" ? await pe(N) : await be(a, N);
    if (!(u != null && u.id)) throw new Error("Hund speichern ohne ID");
    if (Be(N.geburtsdatum, n == null ? void 0 : n.geburtsdatum, t)) {
      const g = (l || []).find((C) => C.id === N.kundenId) || {};
      try {
        await ge({
          eventType: "birthday",
          kundeId: N.kundenId,
          hundId: u.id,
          recipientEmail: g.email || "",
        });
      } catch (C) {
        console.warn("[HUNDE_AUTOMATION_SKIP]", C);
      }
    }
    try {
      le();
    } catch (g) {
      console.error("[HUNDE_ERR_INTEGRITY]", g);
    }
    (G(t === "create" ? "Hund wurde erstellt." : "Hund wurde aktualisiert.", "success"),
      (window.location.hash = `#/hunde/${u.id}`));
  } catch (s) {
    (console.error("[HUNDE_ERR_FORM_SUBMIT]", s),
      ne(
        r,
        t === "create"
          ? "Hund konnte nicht erstellt werden."
          : "Hund konnte nicht aktualisiert werden.",
        "error"
      ),
      (h.disabled = !1),
      (h.textContent = L));
  }
}
function G(e, t = "info") {
  window[J] = { message: e, tone: t };
}
function U(e) {
  if (!e) return;
  e.querySelectorAll(".hunde-toast").forEach((o) => o.remove());
  const t = window[J];
  if (!t) return;
  delete window[J];
  const { message: a, tone: n = "info" } = typeof t == "string" ? { message: t, tone: "info" } : t,
    l = document.createElement("p");
  ((l.className = `hunde-toast hunde-toast--${n}`),
    l.setAttribute("role", n === "error" ? "alert" : "status"),
    (l.textContent = a),
    e.prepend(l));
}
function ne(e, t, a = "info") {
  (G(t, a), U(e));
}
function ae() {
  const e = z({
    label: "Zur Liste",
    variant: "secondary",
    onClick: () => {
      window.location.hash = "#/hunde";
    },
  });
  return ((e.type = "button"), e);
}
function X(e) {
  const t = e.querySelector("h1, h2");
  t && (t.setAttribute("tabindex", "-1"), t.focus());
}
async function Re(e) {
  if (e) {
    ((e.innerHTML = ""), e.classList.add("hunde-view"));
    try {
      U(e);
      let t = null;
      const a = Ae(() => (t == null ? void 0 : t())),
        n = re();
      (e.append(a, n), (t = await Me(n)), Ge(e));
    } catch (t) {
      (console.error("[HUNDE_ERR_LIST_INIT]", t), (e.innerHTML = ""));
      const a = re(),
        n = a.querySelector(".ui-card__body");
      ((n.innerHTML = ""),
        n.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
        e.appendChild(a));
    }
  }
}
function Ae(e) {
  const t = _({ eyebrow: "", title: "Aktionen", body: "", footer: "" }),
    a = t.querySelector(".ui-card") || t.firstElementChild,
    n = a.querySelector(".ui-card__body");
  n.innerHTML = "";
  const l = document.createElement("div");
  return (
    (l.className = "module-actions"),
    l.appendChild(
      z({
        label: "Neuer Hund",
        variant: "primary",
        onClick: () => {
          window.location.hash = "#/hunde/new";
        },
      })
    ),
    l.appendChild(
      z({ label: "Export XLSX", variant: "secondary", onClick: () => (e == null ? void 0 : e()) })
    ),
    n.appendChild(l),
    a
  );
}
function re() {
  const e = _({
    eyebrow: "",
    title: "Hundeübersicht",
    body: "<p>Hunde werden geladen ...</p>",
    footer: "",
  });
  return e.querySelector(".ui-card") || e.firstElementChild;
}
async function Me(e) {
  const t = e.querySelector(".ui-card__body");
  t.textContent = "Hunde werden geladen ...";
  try {
    let K = function (i) {
        return String(i || "")
          .trim()
          .toLowerCase();
      },
      I = function (i, E) {
        return E
          ? [i.code, i.name, i.rufname, i.rasse, i.geschlecht, i.geburtsdatum, i.herkunft]
              .filter(Boolean)
              .map(K)
              .join(" ")
              .includes(E)
          : !0;
      },
      fe = function (i) {
        return o.status === "all" ? !0 : K(i.status) === o.status;
      },
      Y = function () {
        S.querySelectorAll("th").forEach((i) => {
          const E = i.dataset.sortKey;
          if (!E) return;
          const w = E === n.key;
          i.setAttribute(
            "aria-sort",
            w ? (n.direction === "asc" ? "ascending" : "descending") : "none"
          );
          const k = i.querySelector("button");
          if (!k) return;
          const H = w ? (n.direction === "asc" ? "↑" : "↓") : "";
          k.textContent = H ? `${i.dataset.label} ${H}` : i.dataset.label || "";
        });
      },
      V = function () {
        const i = K(l.query),
          E = a.filter((H) => I(H, i) && fe(H));
        if (!E.length) return [];
        const w = T.find((H) => H.key === n.key) || T[0],
          k = (w == null ? void 0 : w.sortValue) || (w == null ? void 0 : w.value);
        return E.map((H, F) => ({ hund: H, index: F }))
          .sort((H, F) => {
            const R = (k ? k(H.hund) : "").toString(),
              he = (k ? k(F.hund) : "").toString(),
              j = R.localeCompare(he, "de", { sensitivity: "base" });
            return j !== 0 ? (n.direction === "asc" ? j : -j) : H.index - F.index;
          })
          .map(({ hund: H }) => H);
      },
      Q = function (i) {
        const E = i.length,
          w = r.pageSize,
          k = Math.max(1, Math.ceil(E / w));
        if ((r.page > k && (r.page = k), r.page < 1 && (r.page = 1), !E))
          return { rows: [], total: E, totalPages: k, startIndex: 0, endIndex: 0 };
        const H = (r.page - 1) * w,
          F = Math.min(H + w, E);
        return { rows: i.slice(H, F), total: E, totalPages: k, startIndex: H, endIndex: F };
      },
      x = function (i = V()) {
        const { total: E, totalPages: w, startIndex: k, endIndex: H } = Q(i),
          F = E ? k + 1 : 0,
          R = E ? H : 0;
        ((g.textContent = `Zeige ${F}–${R} von ${E}`),
          (q.textContent = `Seite ${r.page} von ${w}`),
          (v.disabled = !E || r.page <= 1),
          (D.disabled = !E || r.page >= w));
      },
      M = function () {
        s.innerHTML = "";
        const i = V(),
          { rows: E } = Q(i);
        if (!E.length) {
          const w = document.createElement("tr");
          w.className = "hunde-list-row";
          const k = document.createElement("td");
          ((k.colSpan = T.length),
            (k.textContent = "Keine Treffer."),
            w.appendChild(k),
            s.appendChild(w),
            x(i));
          return;
        }
        (E.forEach((w) => {
          const k = document.createElement("tr");
          ((k.className = "hunde-list-row"),
            T.forEach((H) => {
              const F = document.createElement("td");
              if (H.isLink) {
                const R = document.createElement("a");
                ((R.href = `#/hunde/${w.id}`),
                  (R.className = "hunde-list__link"),
                  (R.textContent = H.value(w)),
                  R.setAttribute("aria-label", `Hund ${w.name || w.code || w.id} öffnen`),
                  F.appendChild(R));
              } else F.textContent = H.value(w);
              k.appendChild(F);
            }),
            s.appendChild(k));
        }),
          x(i));
      };
    const a = await Z();
    if (((t.innerHTML = ""), !a.length))
      return (
        t.appendChild(A("Keine Daten vorhanden.", "")),
        () => {
          window.alert("Keine Daten für den Export verfügbar.");
        }
      );
    const n = { key: "name", direction: "asc" },
      l = { query: "" },
      o = { status: "all" },
      r = { page: 1, pageSize: 50 },
      h = $({
        id: "hunde-search",
        label: "Suche",
        placeholder: "Name, Rasse, Geschlecht ...",
        value: "",
        required: !1,
      }),
      m = h.querySelector("input");
    m &&
      ((m.type = "search"),
      m.addEventListener("input", (i) => {
        ((l.query = i.target.value || ""), (r.page = 1), M());
      }));
    const b = document.createElement("div");
    ((b.className = "list-controls"), b.appendChild(h));
    const c = $({
        id: "hunde-status-filter",
        label: "Status",
        control: "select",
        options: [
          { value: "all", label: "Alle", selected: !0 },
          { value: "aktiv", label: "Aktiv" },
          { value: "passiv", label: "Passiv" },
          { value: "deaktiviert", label: "Deaktiviert" },
        ],
      }),
      f = c.querySelector("select");
    (f &&
      f.addEventListener("change", (i) => {
        ((o.status = i.target.value || "all"), (r.page = 1), M());
      }),
      b.appendChild(c));
    const y = $({
        id: "hunde-page-size",
        label: "Pro Seite",
        control: "select",
        options: [
          { value: "25", label: "25" },
          { value: "50", label: "50", selected: !0 },
          { value: "100", label: "100" },
          { value: "200", label: "200" },
        ],
      }),
      p = y.querySelector("select");
    (p &&
      p.addEventListener("change", (i) => {
        const E = Number(i.target.value) || 50;
        ((r.pageSize = E), (r.page = 1), M());
      }),
      b.appendChild(y),
      t.appendChild(b));
    const N = document.createElement("div");
    N.className = "hunde-list-scroll";
    const L = document.createElement("table");
    L.className = "hunde-list-table";
    const d = document.createElement("thead"),
      S = document.createElement("tr"),
      s = document.createElement("tbody"),
      u = document.createElement("div");
    u.className = "list-pagination";
    const g = document.createElement("div");
    g.className = "list-pagination__info";
    const C = document.createElement("div");
    C.className = "list-pagination__actions";
    const v = z({ label: "Zurück", variant: "secondary" });
    v.type = "button";
    const q = document.createElement("span");
    q.className = "list-pagination__page";
    const D = z({ label: "Weiter", variant: "secondary" });
    ((D.type = "button"),
      v.addEventListener("click", () => {
        r.page > 1 && ((r.page -= 1), M());
      }),
      D.addEventListener("click", () => {
        ((r.page += 1), M());
      }),
      C.append(v, q, D),
      u.append(g, C));
    const T = [
      {
        key: "status",
        label: "Status",
        value: (i) => i.status || "–",
        sortValue: (i) => (i.status || "").toLowerCase(),
      },
      {
        key: "name",
        label: "Name",
        value: (i) => i.name || "Unbenannter Hund",
        sortValue: (i) => (i.name || "").toLowerCase(),
        isLink: !0,
      },
      {
        key: "rasse",
        label: "Rasse",
        value: (i) => i.rasse || "Unbekannt",
        sortValue: (i) => (i.rasse || "").toLowerCase(),
      },
      {
        key: "geschlecht",
        label: "Geschlecht",
        value: (i) => i.geschlecht || "–",
        sortValue: (i) => (i.geschlecht || "").toLowerCase(),
      },
      {
        key: "geburtsdatum",
        label: "Geburtsdatum",
        value: (i) => Oe(i.geburtsdatum),
        sortValue: (i) => Ue(i.geburtsdatum),
      },
    ];
    return (
      T.forEach((i) => {
        const E = document.createElement("th");
        ((E.dataset.sortKey = i.key), (E.dataset.label = i.label));
        const w = document.createElement("button");
        ((w.type = "button"),
          (w.className = "hunde-sort-btn"),
          w.addEventListener("click", () => {
            (n.key === i.key
              ? (n.direction = n.direction === "asc" ? "desc" : "asc")
              : ((n.key = i.key), (n.direction = "asc")),
              Y(),
              M());
          }),
          E.appendChild(w),
          S.appendChild(E));
      }),
      d.appendChild(S),
      L.append(d, s),
      N.appendChild(L),
      t.appendChild(N),
      t.appendChild(u),
      Y(),
      M(),
      async () => {
        const i = V();
        if (!i.length) {
          window.alert("Keine Daten für den Export verfügbar.");
          return;
        }
        await we({ fileName: $e("hunde-uebersicht"), sheetName: "Hunde", columns: T, rows: i });
      }
    );
  } catch (a) {
    return (
      console.error("[HUNDE_ERR_LIST_FETCH]", a),
      (t.innerHTML = ""),
      t.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      () => {
        window.alert("Keine Daten für den Export verfügbar.");
      }
    );
  }
}
function $e(e) {
  const t = new Date().toISOString().slice(0, 10);
  return `${e}-${t}.xlsx`;
}
function Oe(e) {
  if (!e) return "–";
  const t = new Date(e);
  return Number.isNaN(t.getTime())
    ? e
    : t.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function Ue(e) {
  if (!e) return "";
  const t = new Date(e);
  return Number.isNaN(t.getTime()) ? String(e) : t.toISOString();
}
function Ge(e) {
  const t = e.querySelector("h1, h2");
  t && (t.setAttribute("tabindex", "-1"), t.focus());
}
async function Pe(e, t) {
  if (!e) return;
  ((e.innerHTML = ""), e.classList.add("hunde-view"), window.scrollTo(0, 0));
  const a = O({ title: "Hund", subtitle: "", level: 1 }),
    n = document.createElement("section");
  ((n.className = "dogule-section hunde-section hunde-detail"),
    n.appendChild(a),
    e.appendChild(n),
    U(e));
  const l = _({
      eyebrow: "",
      title: "Stammdaten",
      body: "<p>Details werden geladen ...</p>",
      footer: "",
    }),
    o = l.querySelector(".ui-card") || l.firstElementChild;
  if (!o) return;
  n.appendChild(o);
  const r = o.querySelector(".ui-card__body"),
    h = a.querySelector(".ui-section") || a.firstElementChild,
    m = h == null ? void 0 : h.querySelector(".ui-section__subtitle");
  try {
    if (!t) throw new Error("Keine Hunde-ID angegeben");
    const c = (await Z()).find((C) => C.id === t);
    if (!c) throw new Error(`Hund ${t} nicht gefunden`);
    let f = !1,
      y = !1;
    const p = { id: c.kundenId || "", vorname: "", nachname: "", telefon: "", email: "", town: "" };
    let N = [];
    if (c.kundenId)
      try {
        const C = await Ee(c.kundenId);
        if (C) {
          ((p.vorname = C.vorname || ""),
            (p.nachname = C.nachname || ""),
            (p.telefon = C.telefon || ""),
            (p.email = C.email || ""),
            (p.id = C.id || c.kundenId),
            (p.town = Qe(C.adresse || C.address || "")));
          try {
            ((N = await Se(C.id)), (e.__linkedFinanzen = N));
          } catch (v) {
            ((y = !0), console.error("[HUNDE_ERR_DETAIL_FINANZEN]", v));
          }
        }
      } catch (C) {
        ((f = !0), console.error("[HUNDE_ERR_DETAIL_KUNDE]", C));
      }
    const L = c.name || "Unbenannter Hund";
    m && ((m.textContent = L), (m.hidden = !1));
    const d = o.querySelector(".ui-card__title");
    (d && (d.textContent = "Stammdaten"),
      (r.innerHTML = ""),
      f && r.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      r.appendChild(Xe(c)),
      r.appendChild(Je(c)));
    const S = Ye(p, f);
    S && n.appendChild(S);
    const s = _({ eyebrow: "", title: "Aktionen", body: "", footer: "" }),
      u = s.querySelector(".ui-card") || s.firstElementChild;
    if (u) {
      const C = u.querySelector(".ui-card__body"),
        v = document.createElement("div");
      v.className = "module-actions";
      const q = z({ label: "Bearbeiten", variant: "primary" });
      ((q.type = "button"),
        q.addEventListener("click", () => {
          window.location.hash = `#/hunde/${c.id}/edit`;
        }),
        v.appendChild(q));
      const D = z({ label: "Zertifikat erstellen", variant: "secondary" });
      ((D.type = "button"),
        D.addEventListener("click", () => {
          const I = new URLSearchParams();
          (I.set("hundId", c.id),
            p != null && p.id && I.set("kundeId", p.id),
            (window.location.hash = `#/zertifikate/new?${I.toString()}`));
        }),
        v.appendChild(D));
      const T = z({ label: "Löschen", variant: "secondary" });
      if ((T.addEventListener("click", () => nt(e, c.id, p.id, T)), v.appendChild(T), p.id)) {
        const I = z({ label: "Zum Kunden", variant: "secondary" });
        ((I.type = "button"),
          I.addEventListener("click", () => {
            window.location.hash = `#/kunden/${p.id}`;
          }),
          v.appendChild(I));
      }
      const K = z({ label: "Zur Liste", variant: "quiet" });
      ((K.type = "button"),
        K.addEventListener("click", () => {
          window.location.hash = "#/hunde";
        }),
        v.appendChild(K),
        C && ((C.innerHTML = ""), C.appendChild(v)),
        n.appendChild(u));
    }
    const g = await Ze(c.id);
    (e.appendChild(g),
      e.appendChild(Ve(e.__linkedFinanzen || [], y, { hasKunde: !!p.id })),
      e.appendChild(je(e.__linkedFinanzen || [], y, { hasKunde: !!p.id })),
      e.appendChild(We(e.__linkedFinanzen || [], y, { hasKunde: !!p.id })));
  } catch (b) {
    (console.error("[HUNDE_ERR_DETAIL_LOAD]", b), (r.innerHTML = ""));
    const c = B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" });
    r.appendChild(c);
    const f = document.createElement("div");
    ((f.className = "module-actions"),
      f.appendChild(tt("Zur Liste", "#/hunde", "secondary")),
      r.appendChild(f));
  } finally {
    et(e);
  }
}
async function Ze(e) {
  const t = document.createElement("section");
  ((t.className = "hunde-linked-kurse"),
    t.appendChild(O({ title: "Kurse dieses Hundes", subtitle: "", level: 2 })));
  const a = _({ eyebrow: "", title: "", body: "", footer: "" }),
    n = a.querySelector(".ui-card") || a.firstElementChild;
  if (!n) return t;
  const l = n.querySelector(".ui-card__body");
  if (l) {
    l.innerHTML = "";
    let o = [],
      r = !1;
    try {
      o = await de(e);
    } catch (h) {
      ((r = !0), console.error("[HUNDE_ERR_LINKED_KURSE]", h));
    }
    r
      ? l.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" }))
      : o.length
        ? [...o]
            .sort((m, b) => {
              const c = new Date(m.date).getTime(),
                f = new Date(b.date).getTime();
              return Number.isNaN(c) && Number.isNaN(f)
                ? 0
                : Number.isNaN(c)
                  ? 1
                  : Number.isNaN(f)
                    ? -1
                    : c - f;
            })
            .forEach((m) => {
              const b = _({
                  eyebrow: m.code || m.title || "–",
                  title: m.title || "Ohne Titel",
                  body: "",
                  footer: "",
                }),
                c = b.querySelector(".ui-card") || b.firstElementChild;
              if (!c) return;
              c.classList.add("hunde-linked-kurs");
              const f = c.querySelector(".ui-card__body");
              if (f) {
                f.innerHTML = "";
                const p = document.createElement("div");
                p.className = "hunde-linked-kurs__info";
                const N = document.createElement("p");
                N.textContent = `${ue(m.date)} · ${m.location || "Ort offen"}`;
                const L = document.createElement("p");
                ((L.textContent = `Trainer: ${m.trainerName || m.trainerId || "–"}`),
                  p.append(N, L),
                  f.appendChild(p));
              }
              const y = document.createElement("a");
              ((y.href = `#/kurse/${m.id}`),
                (y.className = "hunde-linked-kurs__link"),
                y.appendChild(c),
                l.appendChild(y));
            })
        : l.appendChild(A("Keine Kurse vorhanden.", ""));
  }
  return (t.appendChild(n), t);
}
function Ve(e = [], t = !1, { hasKunde: a = !1 } = {}) {
  const n = document.createElement("section");
  ((n.className = "hunde-finanz-section"),
    n.appendChild(O({ title: "Finanzübersicht", subtitle: "", level: 2 })));
  const l = _({ eyebrow: "", title: "", body: "", footer: "" }),
    o = l.querySelector(".ui-card") || l.firstElementChild;
  if (!o) return n;
  const r = o.querySelector(".ui-card__body");
  if (r) {
    if (((r.innerHTML = ""), !a))
      return (r.appendChild(A("Keine Daten vorhanden.", "")), n.appendChild(o), n);
    if (t)
      return (
        r.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
        n.appendChild(o),
        n
      );
    const h = e.filter((b) => b.typ === "bezahlt"),
      m = h.length ? h[h.length - 1] : null;
    if (!m && !e.some((b) => b.typ === "offen")) r.appendChild(A("Keine Daten vorhanden.", ""));
    else {
      const b = _({ eyebrow: "", title: "", body: "", footer: "" }),
        c = b.querySelector(".ui-card") || b.firstElementChild;
      if (c) {
        const f = c.querySelector(".ui-card__body");
        if (f) {
          const y = document.createElement("dl");
          y.className = "hunde-finanz-info";
          const p = (L, d) => {
            const S = document.createElement("dt");
            S.textContent = L;
            const s = document.createElement("dd");
            ((s.textContent = d), y.append(S, s));
          };
          p(
            "Letzte Zahlung",
            m ? `${P(m.datum)} – CHF ${Number(m.betrag || 0).toFixed(2)}` : "Keine Zahlungen"
          );
          const N = e
            .filter((L) => L.typ === "offen")
            .reduce((L, d) => L + Number(d.betrag || 0), 0);
          (p("Offen gesamt", `CHF ${N.toFixed(2)}`), f.appendChild(y));
        }
        r.appendChild(c);
      }
    }
  }
  return (n.appendChild(o), n);
}
function je(e = [], t = !1, { hasKunde: a = !1 } = {}) {
  const n = document.createElement("section");
  ((n.className = "hunde-finanz-section"),
    n.appendChild(O({ title: "Offene Beträge", subtitle: "", level: 2 })));
  const l = _({ eyebrow: "", title: "", body: "", footer: "" }),
    o = l.querySelector(".ui-card") || l.firstElementChild;
  if (!o) return n;
  const r = o.querySelector(".ui-card__body");
  if (r) {
    if (((r.innerHTML = ""), !a))
      return (r.appendChild(A("Keine Daten vorhanden.", "")), n.appendChild(o), n);
    if (t)
      return (
        r.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
        n.appendChild(o),
        n
      );
    const h = e.filter((m) => m.typ === "offen");
    if (!h.length) r.appendChild(A("Keine Daten vorhanden.", ""));
    else {
      const m = h.reduce((f, y) => f + Number(y.betrag || 0), 0),
        b = _({
          eyebrow: "",
          title: "",
          body: `<p><strong>Total offen:</strong> CHF ${m.toFixed(2)}</p>`,
          footer: "",
        }),
        c = b.querySelector(".ui-card") || b.firstElementChild;
      (c && r.appendChild(c),
        h.forEach((f) => {
          const y = _({
              eyebrow: f.beschreibung || "Offener Posten",
              title: `CHF ${Number(f.betrag || 0).toFixed(2)}`,
              body: `<p>${P(f.datum)}</p>`,
              footer: "",
            }),
            p = y.querySelector(".ui-card") || y.firstElementChild;
          p && r.appendChild(p);
        }));
    }
  }
  return (n.appendChild(o), n);
}
function We(e = [], t = !1, { hasKunde: a = !1 } = {}) {
  const n = document.createElement("section");
  ((n.className = "hunde-finanz-section"),
    n.appendChild(O({ title: "Zahlungshistorie", subtitle: "", level: 2 })));
  const l = _({ eyebrow: "", title: "", body: "", footer: "" }),
    o = l.querySelector(".ui-card") || l.firstElementChild;
  if (!o) return n;
  const r = o.querySelector(".ui-card__body");
  if (r) {
    if (((r.innerHTML = ""), !a))
      return (r.appendChild(A("Keine Daten vorhanden.", "")), n.appendChild(o), n);
    if (t)
      return (
        r.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
        n.appendChild(o),
        n
      );
    const h = e
      .filter((m) => m.typ === "bezahlt")
      .slice()
      .reverse();
    h.length
      ? h.forEach((m) => {
          const b = _({
              eyebrow: P(m.datum),
              title: `CHF ${Number(m.betrag || 0).toFixed(2)}`,
              body: `<p>${m.beschreibung || "Zahlung"}</p>`,
              footer: "",
            }),
            c = b.querySelector(".ui-card") || b.firstElementChild;
          c && r.appendChild(c);
        })
      : r.appendChild(A("Keine Daten vorhanden.", ""));
  }
  return (n.appendChild(o), n);
}
function Xe(e) {
  const t = document.createElement("dl");
  return (
    (t.className = "hunde-detail-list"),
    [
      { label: "ID", value: e.id },
      { label: "Hundecode", value: e.code || e.hundeId },
      { label: "Name", value: e.name },
      { label: "Rufname", value: e.rufname },
      { label: "Rasse", value: e.rasse },
      { label: "Geschlecht", value: e.geschlecht },
      { label: "Status", value: e.status },
      { label: "Geburtsdatum", value: ue(e.geburtsdatum) },
      { label: "Kastriert", value: xe(e.kastriert) },
      { label: "Felltyp", value: e.felltyp || e.fellTyp },
      { label: "Fellfarbe", value: e.fellfarbe || e.fellFarbe },
      { label: "Größe (Typ)", value: e.groesseTyp || e.groesseType },
      { label: "Größe (cm)", value: e.groesseCm },
      { label: "Gewicht (kg)", value: e.gewichtKg },
      { label: "Herkunft", value: He(e.herkunft) },
      { label: "Chip Nummer", value: e.chipNummer || e.chipnummer },
      { label: "Trainingsziele", value: e.trainingsziele },
      { label: "Notizen", value: e.notizen },
    ].forEach(({ label: n, value: l, render: o }) => {
      const r = document.createElement("dt");
      r.textContent = n;
      const h = document.createElement("dd");
      (typeof o == "function" ? h.appendChild(o()) : (h.textContent = me(l)), t.append(r, h));
    }),
    t
  );
}
function Je(e) {
  const t = document.createElement("p");
  return (
    (t.className = "hunde-detail-meta"),
    (t.textContent = `Erstellt am ${P(e.createdAt)} · Aktualisiert am ${P(e.updatedAt)}`),
    t
  );
}
function Ye(e = {}, t = !1) {
  const a = _({ eyebrow: "", title: "Besitzer", body: "", footer: "" }),
    n = a.querySelector(".ui-card") || a.firstElementChild;
  if (!n) return a;
  const l = n.querySelector(".ui-card__body");
  if (((l.innerHTML = ""), t))
    l.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" }));
  else if (!e.id) l.appendChild(A("Keine Daten vorhanden.", ""));
  else {
    const o = document.createElement("dl");
    ((o.className = "kunden-details"),
      [
        { label: "Name", value: e.nachname },
        { label: "Vorname", value: e.vorname },
        { label: "Telefon", value: e.telefon },
        { label: "E-Mail", value: e.email },
        { label: "Ort", value: e.town },
      ].forEach(({ label: b, value: c }) => {
        const f = document.createElement("dt");
        f.textContent = b;
        const y = document.createElement("dd");
        ((y.textContent = me(c)), o.append(f, y));
      }),
      l.appendChild(o));
    const h = n.querySelector(".ui-card__footer");
    h.innerHTML = "";
    const m = document.createElement("a");
    ((m.href = `#/kunden/${e.id}`),
      (m.className = "ui-btn ui-btn--secondary"),
      (m.textContent = "Zum Kunden"),
      h.appendChild(m));
  }
  return n;
}
function ue(e) {
  if (!e) return "–";
  const t = new Date(e);
  return Number.isNaN(t.getTime())
    ? e
    : t.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function P(e) {
  if (!e) return "–";
  const t = new Date(e);
  return Number.isNaN(t.getTime())
    ? e
    : t.toLocaleString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}
function Qe(e = "") {
  if (typeof e != "string") return "";
  const t = e
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!t.length) return "";
  const a = t[t.length - 1];
  return a.replace(/^\d+\s*/, "").trim() || a;
}
function me(e) {
  return e == null || e === "" ? "–" : String(e);
}
function xe(e) {
  return e === !0 ? "Ja" : e === !1 ? "Nein" : "–";
}
function et(e) {
  const t = e.querySelector("h1, h2");
  t && (t.setAttribute("tabindex", "-1"), t.focus());
}
function tt(e, t, a = "secondary") {
  const n = document.createElement("a");
  return ((n.href = t), (n.className = `ui-btn ui-btn--${a}`), (n.textContent = e), n);
}
async function nt(e, t, a, n) {
  if (!n || n.disabled || !window.confirm("Möchten Sie diesen Hund wirklich löschen?")) return;
  const o = n.textContent;
  ((n.disabled = !0), (n.textContent = "Lösche ..."));
  try {
    if ((await de(t)).length) {
      (G("Löschen blockiert: Bitte zuerst Kurse entfernen oder Hund aus Kursen lösen.", "error"),
        U(e),
        (n.disabled = !1),
        (n.textContent = o));
      return;
    }
    const h = await ye(t);
    if (!(h != null && h.ok)) throw new Error("Delete failed");
    (le(),
      G("Hund wurde gelöscht.", "success"),
      a ? (window.location.hash = `#/kunden/${a}`) : (window.location.hash = "#/hunde"));
  } catch (r) {
    (console.error("[HUNDE_ERR_DELETE]", r),
      G("Hund konnte nicht gelöscht werden.", "error"),
      U(e),
      (n.disabled = !1),
      (n.textContent = o));
  }
}
async function pt(e, t = { segments: [] }) {
  if (!e) return;
  ((e.innerHTML = ""),
    e.classList.add("hunde-view"),
    typeof window < "u" &&
      typeof window.scrollTo == "function" &&
      window.scrollTo({ top: 0, behavior: "smooth" }));
  const { view: a, id: n } = at(t);
  if (a === "detail" && n) {
    await Pe(e, n);
    return;
  }
  if (a === "create") {
    await ce(e, { mode: "create" });
    return;
  }
  if (a === "edit" && n) {
    await rt(e, n);
    return;
  }
  await Re(e);
}
function at(e = {}) {
  const t = (e == null ? void 0 : e.segments) || [];
  if (!t.length) return { view: "list" };
  const [a, n] = t;
  return a === "new"
    ? { view: "create" }
    : n === "edit"
      ? { view: "edit", id: a }
      : a
        ? { view: "detail", id: a }
        : { view: "list" };
}
async function rt(e, t) {
  try {
    const a = await Ce(t);
    if (!a) {
      oe(e);
      return;
    }
    await ce(e, { mode: "edit", id: t, hund: a });
  } catch (a) {
    (console.error("[HUNDE_ERR_EDIT_ROUTE]", a), oe(e));
  }
}
function oe(e) {
  if (!e) return;
  e.innerHTML = "";
  const t = document.createElement("section");
  ((t.className = "dogule-section hunde-view__error"),
    t.appendChild(O({ title: "Hund bearbeiten", subtitle: "", level: 2 })));
  const a = _({ eyebrow: "", title: "", body: "", footer: "" }),
    n = a.querySelector(".ui-card") || a.firstElementChild;
  if (n) {
    const l = n.querySelector(".ui-card__body");
    ((l.innerHTML = ""),
      l.appendChild(B("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })));
    const o = n.querySelector(".ui-card__footer");
    o.innerHTML = "";
    const r = document.createElement("a");
    ((r.href = "#/hunde"),
      (r.className = "ui-btn ui-btn--quiet"),
      (r.textContent = "Zurück zur Übersicht"),
      o.appendChild(r),
      t.appendChild(n));
  }
  e.appendChild(t);
}
export { pt as default, pt as initModule };
