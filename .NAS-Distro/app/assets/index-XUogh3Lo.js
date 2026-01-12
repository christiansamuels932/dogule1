import { c as f, a as s, e as g, f as u, d as C, g as y } from "./components-CDhMLcLx.js";
import { listKunden as h } from "./kunden-BBFUy98K.js";
import { listHunde as m } from "./hunde-Df0udqB2.js";
import { l as b } from "./kurse-BUlwv0_9.js";
import "./httpClient-DjX31kqd.js";
import "./index-Cx63mBGt.js";
async function _(o) {
  o.innerHTML = "";
  const t = document.createDocumentFragment(),
    n = document.createElement("section");
  ((n.className = "dogule-section"),
    n.appendChild(f({ title: "Übersicht", subtitle: "", level: 2 })));
  const e = s({ eyebrow: "", title: "Systemstatus", body: "", footer: "" }),
    r = e.querySelector(".ui-card") || e.firstElementChild,
    l = r == null ? void 0 : r.querySelector(".ui-card__body");
  l &&
    ((l.innerHTML = ""),
    l.appendChild(g("Alles betriebsbereit.", { variant: "ok", role: "status" })));
  const [d, i] = await Promise.all([v(), E()]);
  (n.appendChild(d),
    n.appendChild(i),
    r && n.appendChild(r),
    t.appendChild(n),
    o.appendChild(t),
    window.scrollTo(0, 0));
  const a = o.querySelector(".ui-section__title");
  a && (a.setAttribute("tabindex", "-1"), a.focus());
}
async function v() {
  const o = s({ eyebrow: "", title: "Schnellaktionen", body: "", footer: "" }),
    t = o.querySelector(".ui-card") || o.firstElementChild;
  if (!t) {
    const e = document.createElement("div");
    return ((e.textContent = "Fehler beim Laden der Daten."), e);
  }
  const n = t.querySelector(".ui-card__body");
  if (!n) {
    const e = document.createElement("p");
    return ((e.textContent = "Fehler beim Laden der Daten."), t.appendChild(e), t);
  }
  try {
    const [e, r, l] = await Promise.all([h(), m(), b()]),
      d = [
        { label: `Kunden (${e.length})`, hash: "#/kunden" },
        { label: `Hunde (${r.length})`, hash: "#/hunde" },
        { label: `Kurse (${l.length})`, hash: "#/kurse" },
      ];
    if (!d.length) return (n.appendChild(u("Keine Daten vorhanden.", "")), t);
    const i = document.createElement("div");
    ((i.className = "module-actions"),
      d.forEach((a) => {
        const c = C({
          label: a.label,
          variant: "primary",
          onClick: () => {
            a.hash && (window.location.hash = a.hash);
          },
        });
        i.appendChild(c);
      }),
      n.appendChild(i));
  } catch (e) {
    (console.error("DASHBOARD_ACTIONS_LOAD_FAILED", e),
      (n.textContent = "Fehler beim Laden der Daten."));
  }
  return t;
}
async function E() {
  const o = s({ eyebrow: "", title: "Kennzahlen", body: "", footer: "" }),
    t = o.querySelector(".ui-card") || o.firstElementChild;
  if (!t) {
    const e = document.createElement("div");
    return ((e.textContent = "Fehler beim Laden der Daten."), e);
  }
  const n = t.querySelector(".ui-card__body");
  if (!n) {
    const e = document.createElement("p");
    return ((e.textContent = "Fehler beim Laden der Daten."), t.appendChild(e), t);
  }
  try {
    const [e, r, l] = await Promise.all([h(), m(), b()]),
      d = l.filter((a) => a.status === "offen").length,
      i = [
        {
          label: "Kunden",
          value: String(e.length),
          badge: e.length
            ? { text: "Aktiv", variant: "ok" }
            : { text: "Keine Kunden", variant: "warn" },
        },
        {
          label: "Hunde",
          value: String(r.length),
          badge: r.length
            ? { text: "Betreuung läuft", variant: "info" }
            : { text: "Keine Hunde", variant: "warn" },
        },
        {
          label: "Kurse offen",
          value: String(d),
          badge: { text: `${l.length} gesamt`, variant: "info" },
        },
      ];
    if (!i.length) return (n.appendChild(u("Keine Daten vorhanden.", "")), t);
    i.forEach((a) => {
      const c = document.createElement("div");
      if (((c.innerHTML = `<strong>${a.label}</strong><p>${a.value}</p>`), a.badge)) {
        const p = y(a.badge.text, a.badge.variant);
        c.appendChild(p);
      }
      n.appendChild(c);
    });
  } catch (e) {
    (console.error("DASHBOARD_METRICS_LOAD_FAILED", e),
      (n.textContent = "Fehler beim Laden der Daten."));
  }
  return t;
}
export { _ as initModule };
