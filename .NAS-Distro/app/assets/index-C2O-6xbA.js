import { e as S, f as W, a as ne, d as u } from "./components-CDhMLcLx.js";
import { a as z, b as Y, c as B } from "./kurse-BUlwv0_9.js";
import { g as U } from "./trainer-BTYLIueh.js";
import { p as ae, a as oe, g as q, b as L, c as p, d as N } from "./routes-BDgDrvEz.js";
import "./index-Cx63mBGt.js";
import "./httpClient-DjX31kqd.js";
const F = 1800 * 1e3;
function Z(e = [], t, a) {
  const n = _(t, "grid-start"),
    o = _(a, "grid-end");
  if (!(o > n)) throw new Error("grid-end must be after grid-start");
  const r = [...(Array.isArray(e) ? e : []).map((m) => re(m, n, o))].sort((m, i) =>
      m.start.getTime() !== i.start.getTime()
        ? m.start - i.start
        : m.end.getTime() !== i.end.getTime()
          ? m.end - i.end
          : String(m.id || "").localeCompare(String(i.id || ""))
    ),
    l = [];
  let c = 0,
    s = r.length ? r[0].end : null;
  for (let m = 0; m < r.length; m += 1) {
    const i = r[m];
    s && i.start < s ? (s = le(s, i.end)) : m > c && (K(r.slice(c, m), l), (c = m), (s = i.end));
  }
  return (r.length && c < r.length && K(r.slice(c), l), l);
}
function K(e, t) {
  const a = [],
    n = [];
  e.forEach((d) => {
    let r = a.findIndex((l) => l <= d.start.getTime());
    (r === -1 ? ((r = a.length), a.push(d.end.getTime())) : (a[r] = d.end.getTime()),
      n.push({ ...d, column: r }));
  });
  const o = Math.max(a.length, 1);
  n.forEach((d) => {
    t.push({ ...d, columnCount: o });
  });
}
function re(e, t, a) {
  const n = (e == null ? void 0 : e.id) ?? "",
    o = (e == null ? void 0 : e.title) ?? "",
    d = _(e == null ? void 0 : e.start, "event-start"),
    r = _(e == null ? void 0 : e.end, "event-end"),
    l = { ...e };
  (delete l.start,
    delete l.end,
    delete l.rowStart,
    delete l.rowEnd,
    delete l.column,
    delete l.columnCount);
  let c = d < t ? t : d,
    s = r > a ? a : r;
  s <= c && (s = new Date(c.getTime() + F));
  const m = Math.floor((c - t) / F),
    i = Math.ceil((s - t) / F),
    h = Math.max(m + 1, i);
  return { ...l, id: n, title: o, start: c, end: s, rowStart: m, rowEnd: h };
}
function _(e, t) {
  if (e instanceof Date && !Number.isNaN(e.getTime())) return new Date(e.getTime());
  if (typeof e == "string") {
    const a = new Date(e);
    if (!Number.isNaN(a.getTime())) return a;
  }
  throw new Error(`Invalid ${t}`);
}
function le(e, t) {
  return e > t ? e : t;
}
const H = (e) => Array.from(new Set(e.filter(Boolean)));
async function G(e = []) {
  const t = H(e.map((r) => (r == null ? void 0 : r.kursId)).filter(Boolean)),
    a = new Map();
  await Promise.all(
    t.map(async (r) => {
      try {
        const l = await z(r);
        l && a.set(r, l);
      } catch (l) {
        console.error("[KALENDER_ERR_KURS_RESOLVE]", r, l);
      }
    })
  );
  const n = H([...a.values()].map((r) => (r == null ? void 0 : r.trainerId)).filter(Boolean)),
    o = new Map();
  return (
    await Promise.all(
      n.map(async (r) => {
        try {
          const l = await U(r);
          l && o.set(r, l);
        } catch (l) {
          console.error("[KALENDER_ERR_TRAINER_RESOLVE]", r, l);
        }
      })
    ),
    {
      events: e.map((r) => {
        const l = (r != null && r.kursId && a.get(r.kursId)) || null,
          c = (l != null && l.trainerId && o.get(l.trainerId)) || null;
        return { ...r, kurs: l, trainer: c };
      }),
      kursMap: a,
      trainerMap: o,
    }
  );
}
const ie = 24;
async function Fe(e, t = {}) {
  var o, d, r, l, c, s, m;
  if (!e) return;
  e.innerHTML = "";
  const a = document.createElement("section");
  ((a.className = "dogule-section"), e.appendChild(a));
  let n;
  try {
    const i = (typeof window < "u" && window.location.hash) || "",
      h = (t == null ? void 0 : t.segments) || [],
      g = h[0] === "kalender" ? h : ["kalender", ...h];
    n = ae({ hash: i, segments: g });
  } catch {
    (a.appendChild(S("Ungültige Route.", { variant: "warn", role: "alert" })), C(a));
    return;
  }
  if (n.mode === "tag") {
    const i = oe((o = n.payload) == null ? void 0 : o.date);
    await de(a, i);
    return;
  }
  if (n.mode === "woche") {
    const i = q(
      (d = n.payload) == null ? void 0 : d.isoYear,
      (r = n.payload) == null ? void 0 : r.isoWeek
    );
    await ge(a, i);
    return;
  }
  if (n.mode === "monat") {
    const i = (l = n.payload) == null ? void 0 : l.year,
      h = (c = n.payload) == null ? void 0 : c.month;
    await fe(a, i, h);
    return;
  }
  if (n.mode === "jahr") {
    const i = (s = n.payload) == null ? void 0 : s.year;
    await De(a, i);
    return;
  }
  if (n.mode === "event") {
    const i = (m = n.payload) == null ? void 0 : m.eventId;
    await Te(a, i);
    return;
  }
  (a.appendChild(
    S("Diese Ansicht wird später implementiert.", { variant: "info", role: "status" })
  ),
    C(a));
}
async function de(e, t) {
  e.innerHTML = "";
  const a = ce(t);
  e.appendChild(a);
  const n = document.createElement("h2");
  ((n.textContent = me(t)), (n.className = "kalender-subhead"), e.append(n));
  const o = document.createElement("div");
  o.className = "kalender-grid-wrapper";
  const d = document.createElement("div");
  d.className = "kalender-time-axis";
  for (let c = 0; c < 48; c += 1) {
    const s = Math.floor(c / 2),
      m = c % 2 === 0 ? `${String(s).padStart(2, "0")}:00` : "",
      i = document.createElement("div");
    ((i.className = "kalender-time-axis__label"), (i.textContent = m), d.appendChild(i));
  }
  const r = document.createElement("div");
  ((r.className = "kalender-grid-canvas kalender-day-grid"),
    r.style.setProperty("--slot-height", "24px"),
    o.append(d, r),
    e.appendChild(o));
  const l = S("Lade Kalender...", { variant: "info", role: "status" });
  e.appendChild(l);
  try {
    const c = await he(t, t);
    if (!c.length) {
      (e.removeChild(l), e.appendChild(W("Keine Ereignisse für diesen Tag.", "")), C(e));
      return;
    }
    (O(r, c, { includeExtras: !0 }),
      (l == null ? void 0 : l.parentNode) === e && e.removeChild(l),
      j(r, c),
      C(e));
  } catch {
    ((l == null ? void 0 : l.parentNode) === e && e.removeChild(l),
      e.appendChild(S("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      C(e));
  }
}
function ce(e) {
  const t = document.createElement("div");
  t.className = "kalender-toolbar";
  const a = u({ label: "Vorheriger Tag", variant: "secondary", onClick: () => x(L(e, -1)) }),
    n = u({ label: "Heute", variant: "secondary", onClick: () => x(new Date()) }),
    o = u({ label: "Nächster Tag", variant: "secondary", onClick: () => x(L(e, 1)) }),
    d = u({ label: "Tag", variant: "primary", onClick: () => x(e) }),
    r = u({
      label: "Woche",
      variant: "secondary",
      onClick: () => {
        const { isoYear: s, isoWeek: m } = N(e);
        window.location.hash = p({ mode: "woche", isoYear: s, isoWeek: m });
      },
    }),
    l = u({
      label: "Monat",
      variant: "secondary",
      onClick: () => {
        const s = e.getFullYear(),
          m = e.getMonth() + 1;
        window.location.hash = p({ mode: "monat", year: s, month: m });
      },
    }),
    c = u({
      label: "Jahr",
      variant: "secondary",
      onClick: () => {
        const s = e.getFullYear();
        window.location.hash = p({ mode: "jahr", year: s });
      },
    });
  return (t.append(a, n, o, d, r, l, c), t);
}
function se(e) {
  const t = new Date(e.getFullYear(), e.getMonth(), e.getDate()),
    a = new Date(t.getTime() + 1440 * 60 * 1e3);
  return { gridStart: t, gridEnd: a };
}
function me(e) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(e);
}
function Q(e, t) {
  return `${A(e)}–${A(t)}`;
}
function A(e) {
  const t = String(e.getHours()).padStart(2, "0"),
    a = String(e.getMinutes()).padStart(2, "0");
  return `${t}:${a}`;
}
function X(e = []) {
  return (e || []).map((t) => {
    const a = v(t.start),
      n = v(t.end);
    return {
      id: t.id,
      title: t.title || t.code || "Ohne Titel",
      start: a,
      end: n,
      code: t.code,
      location: t.location,
      kursId: t.kursId,
      trainerId: t.trainerId,
    };
  });
}
function v(e) {
  if (e instanceof Date && !Number.isNaN(e.getTime())) return new Date(e.getTime());
  const t = new Date(e);
  if (Number.isNaN(t.getTime())) throw new Error("Invalid event date");
  return t;
}
function j(e, t) {
  if (!e || !(t != null && t.length)) return;
  const a = Math.min(...t.map((d) => d.rowStart)),
    n =
      Number.parseFloat(getComputedStyle(e).getPropertyValue("--slot-height")) ||
      Number.parseFloat(getComputedStyle(e).getPropertyValue("--kalender-slot-height")) ||
      ie,
    o = Math.max(0, a * n - 40);
  typeof e.scrollTo == "function" ? e.scrollTo({ top: o, behavior: "auto" }) : (e.scrollTop = o);
}
function x(e) {
  const t = new Date(e.getFullYear(), e.getMonth(), e.getDate()),
    a = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  window.location.hash = p({ mode: "tag", date: a });
}
function C(e) {
  if (!e) return;
  const t = e.querySelector("h1, h2");
  t && (t.setAttribute("tabindex", "-1"), t.focus());
}
function O(e, t, { includeExtras: a = !0 } = {}) {
  t.forEach((n) => {
    var g, w, E, k;
    const o = document.createElement("div");
    ((o.className = "kalender-event-block"),
      o.style.setProperty("--row-start", String(n.rowStart)),
      o.style.setProperty("--row-end", String(n.rowEnd)),
      o.style.setProperty("--col", String(n.column)),
      o.style.setProperty("--col-total", String(n.columnCount)));
    const d = document.createElement("div");
    ((d.className = "kalender-event-block__title"), (d.textContent = n.title));
    const r = document.createElement("div");
    r.className = "kalender-event-block__meta";
    const l = Q(n.start, n.end);
    let c = l;
    const s =
      ((g = n == null ? void 0 : n.trainer) == null ? void 0 : g.name) ||
      ((w = n == null ? void 0 : n.trainer) == null ? void 0 : w.code) ||
      ((E = n == null ? void 0 : n.trainer) == null ? void 0 : E.id) ||
      "";
    if (a) {
      const b = n.code ? ` · ${n.code}` : "",
        D = n.location ? ` · ${n.location}` : "",
        y = s ? ` · Trainer: ${s}` : "";
      c = `${l}${b}${D}${y}`;
    } else s && (c = `${l} · ${s}`);
    ((r.textContent = c), o.append(d, r), (o.tabIndex = 0));
    const m = [n.title, l];
    (s && m.push(`Trainer ${s}`), o.setAttribute("aria-label", m.filter(Boolean).join(", ")));
    const i = n.kursId
      ? `#/kurse/${encodeURIComponent(n.kursId)}`
      : p({ mode: "event", eventId: n.id });
    ((o.dataset.kursId = n.kursId || ""),
      (o.dataset.trainerId =
        ((k = n == null ? void 0 : n.trainer) == null ? void 0 : k.id) ||
        (n == null ? void 0 : n.trainerId) ||
        ""));
    const h = () => {
      window.location.hash = i;
    };
    (o.addEventListener("click", h),
      o.addEventListener("keydown", (b) => {
        (b.key === "Enter" || b.key === " ") && (b.preventDefault(), h());
      }),
      e.appendChild(o));
  });
}
async function he(e, t) {
  const a = new Date(e.getFullYear(), e.getMonth(), e.getDate()),
    n = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1),
    o = await Y(),
    r = X(o).filter((c) => c.start < n && c.end > a),
    { events: l } = await G(r);
  return Z(l, a, n);
}
function ue(e) {
  const { isoWeek: t } = N(e),
    a = R(e),
    n = R(L(e, 6));
  return `KW ${String(t).padStart(2, "0")} · ${a} – ${n}`;
}
function pe(e) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(e);
}
function R(e) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(e);
}
async function ge(e, t) {
  e.innerHTML = "";
  const a = we(t);
  e.appendChild(a);
  const n = ue(t),
    o = document.createElement("h2");
  ((o.className = "kalender-subhead"), (o.textContent = n), e.append(o));
  const d = document.createElement("div");
  d.className = "kalender-grid-wrapper";
  const r = document.createElement("div");
  r.className = "kalender-time-axis";
  for (let s = 0; s < 48; s += 1) {
    const m = Math.floor(s / 2),
      i = s % 2 === 0 ? `${String(m).padStart(2, "0")}:00` : "",
      h = document.createElement("div");
    ((h.className = "kalender-time-axis__label"), (h.textContent = i), r.appendChild(h));
  }
  const l = document.createElement("div");
  ((l.className = "kalender-week-columns"), d.append(r, l), e.appendChild(d));
  const c = S("Lade Kalender...", { variant: "info", role: "status" });
  e.appendChild(c);
  try {
    const s = await Y(),
      m = X(s),
      { events: i } = await G(m),
      h = [];
    for (let w = 0; w < 7; w += 1) {
      const E = L(t, w),
        { gridStart: k, gridEnd: b } = se(E),
        D = i.filter((I) => I.start < b && I.end > k),
        y = Z(D, k, b);
      h.push({ date: E, positioned: y });
      const M = document.createElement("div");
      M.className = "kalender-week-day";
      const f = document.createElement("div");
      ((f.className = "kalender-week-day__header"), (f.textContent = pe(E)));
      const T = document.createElement("div");
      ((T.className = "kalender-week-day__grid"),
        T.style.setProperty("--slot-height", "24px"),
        O(T, y, { includeExtras: !1 }),
        M.append(f, T),
        l.appendChild(M),
        w === 0 && f != null && f.offsetHeight && (r.style.paddingTop = `${f.offsetHeight}px`));
    }
    (c == null ? void 0 : c.parentNode) === e && e.removeChild(c);
    const g = h.flatMap((w) => w.positioned);
    if (!g.length) {
      (e.appendChild(W("Keine Ereignisse für diese Woche.", "")), C(e));
      return;
    }
    (j(d, g), C(e));
  } catch {
    ((c == null ? void 0 : c.parentNode) === e && e.removeChild(c),
      e.appendChild(S("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      C(e));
  }
}
function we(e) {
  const t = document.createElement("div");
  t.className = "kalender-toolbar";
  const a = u({ label: "Vorherige Woche", variant: "secondary", onClick: () => P(L(e, -7)) }),
    n = u({ label: "Heute", variant: "secondary", onClick: () => x(new Date()) }),
    o = u({ label: "Nächste Woche", variant: "secondary", onClick: () => P(L(e, 7)) }),
    d = u({ label: "Tag", variant: "secondary", onClick: () => x(e) }),
    { isoYear: r, isoWeek: l } = N(e),
    c = u({
      label: "Woche",
      variant: "primary",
      onClick: () => {
        window.location.hash = p({ mode: "woche", isoYear: r, isoWeek: l });
      },
    }),
    s = u({
      label: "Monat",
      variant: "secondary",
      onClick: () => {
        const i = e.getFullYear(),
          h = e.getMonth() + 1;
        window.location.hash = p({ mode: "monat", year: i, month: h });
      },
    }),
    m = u({
      label: "Jahr",
      variant: "secondary",
      onClick: () => {
        const i = e.getFullYear();
        window.location.hash = p({ mode: "jahr", year: i });
      },
    });
  return (t.append(a, n, o, d, c, s, m), t);
}
function P(e) {
  const { isoYear: t, isoWeek: a } = N(e),
    n = q(t, a),
    o = N(n);
  window.location.hash = p({ mode: "woche", isoYear: o.isoYear, isoWeek: o.isoWeek });
}
async function fe(e, t, a) {
  e.innerHTML = "";
  const n = ye(t, a);
  e.appendChild(n);
  const o = document.createElement("h2");
  ((o.className = "kalender-subhead"), (o.textContent = ee(t, a)), e.append(o));
  const d = document.createElement("div");
  ((d.className = "kalender-month-grid"), e.appendChild(d));
  try {
    const r = await Y();
    (ke(t, a, r).forEach((c) => d.appendChild(c)), C(e));
  } catch {
    (e.appendChild(S("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })), C(e));
  }
}
function ye(e, t) {
  const a = document.createElement("div");
  a.className = "kalender-toolbar";
  const n = u({
      label: "Vorheriger Monat",
      variant: "secondary",
      onClick: () => {
        const { y: h, m: g } = J(e, t, -1);
        window.location.hash = p({ mode: "monat", year: h, month: g });
      },
    }),
    o = u({
      label: "Heute",
      variant: "secondary",
      onClick: () => {
        const h = new Date(),
          g = h.getFullYear(),
          w = h.getMonth() + 1;
        window.location.hash = p({ mode: "monat", year: g, month: w });
      },
    }),
    d = u({
      label: "Nächster Monat",
      variant: "secondary",
      onClick: () => {
        const { y: h, m: g } = J(e, t, 1);
        window.location.hash = p({ mode: "monat", year: h, month: g });
      },
    }),
    r = u({
      label: "Tag",
      variant: "secondary",
      onClick: () => {
        const h = `${e}-${String(t).padStart(2, "0")}-01`;
        window.location.hash = p({ mode: "tag", date: h });
      },
    }),
    { isoYear: l, isoWeek: c } = N(new Date(e, t - 1, 1)),
    s = u({
      label: "Woche",
      variant: "secondary",
      onClick: () => {
        window.location.hash = p({ mode: "woche", isoYear: l, isoWeek: c });
      },
    }),
    m = u({
      label: "Monat",
      variant: "primary",
      onClick: () => {
        window.location.hash = p({ mode: "monat", year: e, month: t });
      },
    }),
    i = u({
      label: "Jahr",
      variant: "secondary",
      onClick: () => {
        window.location.hash = p({ mode: "jahr", year: e });
      },
    });
  return (a.append(n, o, d, r, s, m, i), a);
}
function ke(e, t, a = []) {
  const n = [],
    o = new Date(e, t - 1, 1),
    d = te(o),
    r = new Date(e, t, 0).getDate(),
    l = d - 1,
    c = 42;
  for (let i = 0; i < l; i += 1) n.push(V());
  for (let i = 1; i <= r; i += 1) {
    const h = new Date(e, t - 1, i),
      g = new Date(e, t - 1, i),
      w = new Date(e, t - 1, i + 1),
      E = a.some((k) => {
        const b = v(k.start),
          D = v(k.end);
        return b < w && D > g;
      });
    n.push(Ee(h, E));
  }
  const s = n.length,
    m = c - s;
  for (let i = 0; i < m; i += 1) n.push(V());
  return n;
}
function Ee(e, t) {
  const a = document.createElement("div");
  a.className = "kalender-month-cell";
  const n = document.createElement("div");
  if (
    ((n.className = "kalender-month-cell__date"),
    (n.textContent = String(e.getDate())),
    a.appendChild(n),
    t)
  ) {
    const r = document.createElement("div");
    ((r.className = "kalender-month-cell__dot"), a.appendChild(r));
  }
  const o = [
      e.getFullYear(),
      String(e.getMonth() + 1).padStart(2, "0"),
      String(e.getDate()).padStart(2, "0"),
    ].join("-"),
    d = new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(e);
  return (
    a.setAttribute("aria-label", d),
    (a.tabIndex = 0),
    a.addEventListener("click", () => {
      window.location.hash = p({ mode: "tag", date: o });
    }),
    a.addEventListener("keydown", (r) => {
      (r.key === "Enter" || r.key === " ") &&
        (r.preventDefault(), (window.location.hash = p({ mode: "tag", date: o })));
    }),
    a
  );
}
function V() {
  const e = document.createElement("div");
  return ((e.className = "kalender-month-cell"), e.setAttribute("aria-hidden", "true"), e);
}
function ee(e, t) {
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(
    new Date(e, t - 1, 1)
  );
}
function te(e) {
  const t = e.getDay();
  return t === 0 ? 7 : t;
}
function J(e, t, a) {
  const n = new Date(e, t - 1 + a, 1);
  return { y: n.getFullYear(), m: n.getMonth() + 1 };
}
function Ce(e, t) {
  const a = Math.max(0, t - e),
    n = Math.round(a / 6e4),
    o = Math.floor(n / 60),
    d = n % 60;
  return o > 0 && d > 0 ? `${o}h ${d}m` : o > 0 ? `${o}h` : `${d}m`;
}
function be(e) {
  const t = document.createElement("div");
  t.className = "kalender-trainer-meta";
  const a = document.createElement("div"),
    n =
      (e == null ? void 0 : e.name) ||
      (e == null ? void 0 : e.code) ||
      (e == null ? void 0 : e.id) ||
      "Trainer",
    o = e != null && e.code && (e == null ? void 0 : e.code) !== n ? ` (${e.code})` : "",
    d = e != null && e.id ? ` · ID: ${e.id}` : "";
  a.textContent = `${n}${o}${d}`;
  const r = (e == null ? void 0 : e.telefon) || (e == null ? void 0 : e.email);
  if (r) {
    const l = document.createElement("div");
    ((l.className = "kalender-trainer-meta__contact"), (l.textContent = r), t.append(a, l));
  } else t.append(a);
  return t;
}
async function Te(e, t) {
  e.innerHTML = "";
  const a = Se();
  e.appendChild(a);
  let n = document.createElement("h2");
  ((n.className = "kalender-subhead"), (n.textContent = "Lade Ereignis..."), e.append(n));
  try {
    const o = await B(t);
    if (!o) {
      ((n.textContent = "Nicht gefunden"),
        e.appendChild(W("Dieses Ereignis ist nicht vorhanden.", "")),
        C(e));
      return;
    }
    const d = v(o.start),
      r = v(o.end),
      l = R(d),
      c = Q(d, r),
      s = Ce(d, r),
      m = o.kursId ? String(o.kursId) : "";
    let i = null,
      h = null,
      g = !1;
    if (m)
      try {
        i = await z(m);
      } catch (f) {
        console.error("[KALENDER_ERR_KURS_FETCH]", f);
      }
    const w = i != null && i.trainerId ? String(i.trainerId) : "";
    if (w)
      try {
        h = await U(w);
      } catch (f) {
        ((g = !0), console.error("[KALENDER_ERR_TRAINER_FETCH]", f));
      }
    n.textContent = o.title || o.code || "Ereignis";
    const E = ne({
        eyebrow: o.code || "",
        title: o.title || o.code || "Ereignis",
        body: "",
        footer: "",
      }),
      k = E.querySelector(".ui-card") || E.firstElementChild,
      b = k.querySelector(".ui-card__body");
    b.innerHTML = "";
    const D = document.createElement("dl");
    D.className = "kalender-event-detail";
    const y = (f, T) => {
      const I = document.createElement("dt");
      I.textContent = f;
      const $ = document.createElement("dd");
      (T instanceof Node ? $.appendChild(T) : ($.textContent = T), D.append(I, $));
    };
    if (
      (y("Datum", l),
      y("Zeit", c),
      y("Dauer", s),
      o.location && y("Ort", o.location),
      o.notes && y("Notiz", o.notes),
      i)
    )
      (y("Kurs", `${i.title || i.code || i.id}`), y("Kurs-ID", i.id));
    else if (m) {
      const f = S("Verknüpfter Kurs nicht gefunden.", { variant: "warn", role: "alert" });
      y("Kurs", f);
    }
    (h
      ? (y("Trainer", be(h)), y("Trainer-ID", h.id))
      : w && g
        ? y(
            "Trainer",
            S("Trainer konnte nicht geladen werden.", { variant: "warn", role: "alert" })
          )
        : w
          ? y("Trainer", "Trainer nicht gefunden.")
          : y("Trainer", "Kein Trainer zugewiesen."),
      b.appendChild(D));
    const M = k.querySelector(".ui-card__footer");
    if (M) {
      M.innerHTML = "";
      const f = [];
      (h != null &&
        h.id &&
        f.push(
          u({
            label: "Zum Trainer",
            variant: "secondary",
            onClick: () => {
              window.location.hash = `#/trainer/${encodeURIComponent(h.id)}`;
            },
          })
        ),
        m &&
          f.push(
            u({
              label: "Zum Kurs",
              variant: "primary",
              onClick: () => {
                window.location.hash = `#/kurse/${encodeURIComponent(m)}`;
              },
            })
          ),
        f.push(
          u({
            label: "Zum Tag",
            variant: "secondary",
            onClick: () => {
              const T = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, "0"),
                String(d.getDate()).padStart(2, "0"),
              ].join("-");
              window.location.hash = p({ mode: "tag", date: T });
            },
          })
        ),
        f.forEach((T) => M.appendChild(T)));
    }
    (e.appendChild(k), C(e));
  } catch {
    ((n.textContent = "Nicht gefunden"),
      e.appendChild(S("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })),
      C(e));
  }
}
function Se() {
  const e = document.createElement("div");
  e.className = "kalender-toolbar";
  const t = u({
      label: "Zurück zum Tag",
      variant: "secondary",
      onClick: () => {
        const s = window.location.hash || "",
          m = /event\/([^/]+)/.exec(s);
        m != null &&
          m[1] &&
          B(m[1]).then((i) => {
            if (!i) return;
            const h = v(i.start),
              g = [
                h.getFullYear(),
                String(h.getMonth() + 1).padStart(2, "0"),
                String(h.getDate()).padStart(2, "0"),
              ].join("-");
            window.location.hash = p({ mode: "tag", date: g });
          });
      },
    }),
    a = new Date(),
    n = u({
      label: "Tag",
      variant: "secondary",
      onClick: () => {
        const s = [
          a.getFullYear(),
          String(a.getMonth() + 1).padStart(2, "0"),
          String(a.getDate()).padStart(2, "0"),
        ].join("-");
        window.location.hash = p({ mode: "tag", date: s });
      },
    }),
    { isoYear: o, isoWeek: d } = N(a),
    r = u({
      label: "Woche",
      variant: "secondary",
      onClick: () => {
        window.location.hash = p({ mode: "woche", isoYear: o, isoWeek: d });
      },
    }),
    l = u({
      label: "Monat",
      variant: "secondary",
      onClick: () => {
        const s = a.getFullYear(),
          m = a.getMonth() + 1;
        window.location.hash = p({ mode: "monat", year: s, month: m });
      },
    }),
    c = u({
      label: "Jahr",
      variant: "secondary",
      onClick: () => {
        const s = a.getFullYear();
        window.location.hash = p({ mode: "jahr", year: s });
      },
    });
  return (e.append(t, n, r, l, c), e);
}
async function De(e, t) {
  e.innerHTML = "";
  const a = Ne(t);
  e.appendChild(a);
  const n = document.createElement("h2");
  ((n.className = "kalender-subhead"), (n.textContent = String(t)), e.append(n));
  const o = document.createElement("div");
  ((o.className = "kalender-year-grid"), e.appendChild(o));
  try {
    for (let d = 1; d <= 12; d += 1) {
      const r = Me(t, d);
      o.appendChild(r);
    }
    C(e);
  } catch {
    (e.appendChild(S("Fehler beim Laden der Daten.", { variant: "warn", role: "alert" })), C(e));
  }
}
function Ne(e) {
  const t = document.createElement("div");
  t.className = "kalender-toolbar";
  const a = u({
      label: "Vorheriges Jahr",
      variant: "secondary",
      onClick: () => {
        window.location.hash = p({ mode: "jahr", year: e - 1 });
      },
    }),
    n = u({
      label: "Heute",
      variant: "secondary",
      onClick: () => {
        const i = new Date();
        window.location.hash = p({ mode: "jahr", year: i.getFullYear() });
      },
    }),
    o = u({
      label: "Nächstes Jahr",
      variant: "secondary",
      onClick: () => {
        window.location.hash = p({ mode: "jahr", year: e + 1 });
      },
    }),
    d = u({
      label: "Tag",
      variant: "secondary",
      onClick: () => {
        const i = new Date(e, 0, 1),
          h = [
            i.getFullYear(),
            String(i.getMonth() + 1).padStart(2, "0"),
            String(i.getDate()).padStart(2, "0"),
          ].join("-");
        window.location.hash = p({ mode: "tag", date: h });
      },
    }),
    { isoYear: r, isoWeek: l } = N(new Date(e, 0, 1)),
    c = u({
      label: "Woche",
      variant: "secondary",
      onClick: () => {
        window.location.hash = p({ mode: "woche", isoYear: r, isoWeek: l });
      },
    }),
    s = u({
      label: "Monat",
      variant: "secondary",
      onClick: () => {
        window.location.hash = p({ mode: "monat", year: e, month: 1 });
      },
    }),
    m = u({
      label: "Jahr",
      variant: "primary",
      onClick: () => {
        window.location.hash = p({ mode: "jahr", year: e });
      },
    });
  return (t.append(a, n, o, d, c, s, m), t);
}
function Me(e, t) {
  const a = document.createElement("div");
  a.className = "kalender-year-month";
  const n = document.createElement("div");
  n.className = "kalender-year-month__title";
  const o = ee(e, t);
  ((n.textContent = o),
    n.setAttribute("aria-label", `Monat ${o}`),
    (n.tabIndex = 0),
    n.addEventListener("click", () => {
      window.location.hash = p({ mode: "monat", year: e, month: t });
    }),
    n.addEventListener("keydown", (g) => {
      (g.key === "Enter" || g.key === " ") &&
        (g.preventDefault(), (window.location.hash = p({ mode: "monat", year: e, month: t })));
    }));
  const d = document.createElement("div");
  d.className = "kalender-month-grid";
  const r = new Date(e, t - 1, 1),
    l = te(r),
    c = new Date(e, t, 0).getDate(),
    s = l - 1,
    m = 42;
  for (let g = 0; g < s; g += 1) {
    const w = document.createElement("div");
    ((w.className = "kalender-month-cell"),
      w.setAttribute("aria-hidden", "true"),
      d.appendChild(w));
  }
  for (let g = 1; g <= c; g += 1) {
    const w = document.createElement("div");
    w.className = "kalender-month-cell";
    const E = document.createElement("div");
    ((E.className = "kalender-month-cell__date"),
      (E.textContent = String(g)),
      w.appendChild(E),
      (w.tabIndex = 0),
      w.addEventListener("click", () => {
        window.location.hash = p({ mode: "monat", year: e, month: t });
      }),
      w.addEventListener("keydown", (k) => {
        (k.key === "Enter" || k.key === " ") &&
          (k.preventDefault(), (window.location.hash = p({ mode: "monat", year: e, month: t })));
      }),
      d.appendChild(w));
  }
  const i = s + c,
    h = m - i;
  for (let g = 0; g < h; g += 1) {
    const w = document.createElement("div");
    ((w.className = "kalender-month-cell"),
      w.setAttribute("aria-hidden", "true"),
      d.appendChild(w));
  }
  return (a.append(n, d), a);
}
export { Fe as initModule };
