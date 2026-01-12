const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./hunde-Df0udqB2.js",
      "./httpClient-DjX31kqd.js",
      "./index-Cx63mBGt.js",
      "./index-BPKRQP0J.css",
      "./kunden-BBFUy98K.js",
    ])
) => i.map((i) => d[i]);
import { d as u, _ as S } from "./index-Cx63mBGt.js";
import {
  i as f,
  h as L,
  l as P,
  a as F,
  r as w,
  u as x,
  c as C,
  e as j,
  b as G,
  d as Y,
} from "./httpClient-DjX31kqd.js";
const h = "kalender",
  q = {
    id: "",
    code: "",
    kursId: "",
    trainerId: "",
    title: "",
    start: "",
    end: "",
    location: "",
    notes: "",
  };
function g(t = {}) {
  return { ...q, ...t };
}
const d = (t) => (typeof t == "string" ? t.trim() : ""),
  X = /^(\d{4})-(\d{2})-(\d{2})$/,
  W = /^(\d{2}):(\d{2})$/;
function J(t) {
  const r = X.exec(d(t));
  if (!r) return null;
  const n = Number.parseInt(r[1], 10),
    e = Number.parseInt(r[2], 10),
    i = Number.parseInt(r[3], 10),
    s = new Date(n, e - 1, i);
  return Number.isNaN(s.getTime()) ||
    s.getFullYear() !== n ||
    s.getMonth() !== e - 1 ||
    s.getDate() !== i
    ? null
    : { year: n, month: e, day: i };
}
function Q(t) {
  const r = W.exec(d(t));
  if (!r) return null;
  const n = Number.parseInt(r[1], 10),
    e = Number.parseInt(r[2], 10);
  return n < 0 || n > 23 || e < 0 || e > 59 ? null : { hours: n, minutes: e };
}
function R(t, r) {
  const n = J(t),
    e = Q(r);
  if (!n || !e) return null;
  const { year: i, month: s, day: o } = n,
    { hours: a, minutes: l } = e,
    c = new Date(i, s - 1, o, a, l, 0, 0);
  return Number.isNaN(c.getTime()) ||
    c.getFullYear() !== i ||
    c.getMonth() !== s - 1 ||
    c.getDate() !== o ||
    c.getHours() !== a ||
    c.getMinutes() !== l
    ? null
    : c.toISOString();
}
function Z(t = {}) {
  return !!(d(t.date) && d(t.startTime));
}
function tt(t = {}) {
  const r = d(t.id);
  if (!r || !Z(t)) return null;
  const n = R(t.date, t.startTime),
    e = R(t.date, t.endTime || t.startTime);
  return !n || !e
    ? null
    : {
        id: `cal-${r}`,
        kursId: r,
        trainerId: d(t.trainerId),
        title: d(t.title) || d(t.code) || "Kurs",
        code: d(t.code),
        start: n,
        end: e,
        location: d(t.location),
        notes: d(t.notes),
      };
}
function H(t) {
  const r = d(t);
  return (r && (Array.isArray(u[h]) ? u[h] : []).find((e) => e.kursId === r)) || null;
}
function rt(t = {}, r = {}) {
  return ["title", "start", "end", "code", "location", "notes", "kursId", "trainerId"].every(
    (e) => d(t[e]) === d(r[e])
  );
}
async function nt(t) {
  return f() ? L("kalender") : (await it({ ...t, delay: 0 }), (await P(h, t)).map(g));
}
async function ft(t, r) {
  return f() ? F("kalender", t) : (await nt(r)).find((e) => e.id === t) || null;
}
async function N(t, r) {
  if (f()) return null;
  const n = tt(t),
    e = d(t == null ? void 0 : t.id),
    i = H(e);
  if (!n) return (i && (await w(h, i.id, r)), null);
  if (i) {
    if (rt(i, n)) return g(i);
    const o = { ...n };
    delete o.id;
    const a = await x(h, i.id, o, r);
    return a ? g(a) : null;
  }
  const s = await C(h, { ...n, id: n.id || `cal-${e}` }, r);
  return g(s);
}
async function et(t, r) {
  if (f()) return { ok: !1 };
  const n = H(t);
  return n ? w(h, n.id, r) : { ok: !1 };
}
async function it(t) {
  if (f()) return;
  const r = Array.isArray(u.kurse) ? u.kurse : [],
    n = new Set(r.map((i) => i.id).filter(Boolean)),
    e = Array.isArray(u[h]) ? [...u[h]] : [];
  for (const i of e) i.kursId && !n.has(i.kursId) && (await w(h, i.id, { ...t, delay: 0 }));
  for (const i of r) await N(i, { ...t, delay: 0 });
}
const m = "kurse",
  y = "aktiv",
  D = "kursId",
  b = "KURS_TRAINER_INVALID",
  st = "KURS_ORT_INVALID",
  I = {
    code: "",
    title: "",
    trainerName: "",
    trainerId: "",
    trainerIds: [],
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    ort: "",
    status: y,
    aboForm: "",
    alterHund: "",
    aufbauend: "",
    capacity: 0,
    bookedCount: 0,
    level: "",
    price: "",
    notes: "",
    inhaltTheorie: "",
    inhaltPraxis: "",
    hundIds: [],
  },
  at = new Set(["capacity", "bookedCount"]);
var v;
let O = ((v = u[m]) == null ? void 0 : v.length) ?? 0;
const p = (t = []) => {
    if (Array.isArray(t)) {
      const r = t.map((n) => (typeof n == "string" ? n.trim() : n)).filter(Boolean);
      return Array.from(new Set(r));
    }
    return typeof t == "string" && t.trim() ? [t.trim()] : [];
  },
  z = (t = {}) => {
    const r = (t.trainerId || "").trim(),
      n = p(t.trainerIds || []);
    return (
      r && !n.includes(r) && n.unshift(r),
      !r && n.length ? { trainerId: n[0], trainerIds: n } : { trainerId: r, trainerIds: n }
    );
  },
  B = (t = {}) => ({
    hundIds: p(t.hundIds).map((e) => {
      if (!(Array.isArray(u.hunde) ? u.hunde.find((s) => s.id === e) : null))
        throw new Error(`Hund ${e} existiert nicht`);
      return e;
    }),
  }),
  $ = (t = {}) => {
    const r = z(t),
      n = r.trainerId,
      e = r.trainerIds;
    if (!n) {
      const a = new Error("Trainer ist erforderlich");
      throw ((a.code = b), a);
    }
    const i = Array.isArray(u.trainer) ? u.trainer : [],
      s = i.find((a) => a.id === n) || null;
    if (!s) {
      const a = new Error(`Trainer ${n} existiert nicht`);
      throw ((a.code = b), a);
    }
    const o = e.filter((a) => !i.some((l) => l.id === a));
    if (o.length) {
      const a = new Error(`Trainer ${o.join(", ")} existiert nicht`);
      throw ((a.code = b), a);
    }
    return { trainerId: n, trainerIds: e, trainerName: s.name || t.trainerName || n };
  },
  ot = () => ((O += 1), `kurs-${O.toString().padStart(3, "0")}`),
  U = (t = {}) => (t.code !== void 0 ? t : t[D] !== void 0 ? { ...t, code: t[D] } : t),
  _ = (t, r = 0) => {
    if (typeof t == "number" && Number.isFinite(t)) return t;
    const n = Number(t);
    return Number.isFinite(n) ? n : r;
  },
  ut = (t = {}) => {
    var o, a;
    const r = { ...I, ...U(t) },
      n = t.ort ?? t.location ?? r.ort ?? r.location ?? "",
      e = t.location ?? t.ort ?? r.location ?? r.ort ?? "";
    ((r.ort = typeof n == "string" ? n.trim() : n),
      (r.location = typeof e == "string" ? e.trim() : e),
      (r.status =
        (a = (o = t.status) == null ? void 0 : o.trim) != null && a.call(o) ? t.status : y),
      (r.capacity = _(t.capacity, I.capacity)),
      (r.bookedCount = _(t.bookedCount, I.bookedCount)),
      (r.price = t.price ?? I.price));
    const i = B(r);
    r.hundIds = i.hundIds;
    const s = $(r);
    return (
      (r.trainerId = s.trainerId),
      (r.trainerIds = s.trainerIds),
      (r.trainerName = s.trainerName),
      r
    );
  },
  V = (t = {}) => {
    const r = (t.ort || t.location || "").toString().trim();
    if (!r) {
      const n = new Error("Ort ist erforderlich");
      throw ((n.code = st), n);
    }
    return r;
  },
  ct = (t = {}) => {
    const r = U(t),
      n = {};
    return (
      Object.keys(I).forEach((e) => {
        var i, s;
        if (Object.prototype.hasOwnProperty.call(r, e))
          if (at.has(e)) n[e] = _(r[e], I[e]);
          else if (e === "status")
            n[e] = (s = (i = r[e]) == null ? void 0 : i.trim) != null && s.call(i) ? r[e] : y;
          else if (e === "price") n[e] = r[e] ?? I[e];
          else if (e === "location" || e === "ort") n[e] = r[e] ?? I[e];
          else if (e === "trainerIds") {
            const { trainerIds: o } = z({
              trainerId: r.trainerId ?? "",
              trainerIds: r.trainerIds ?? [],
            });
            n[e] = o;
          } else
            e === "code"
              ? (n[e] = (r[e] || "").trim())
              : e === "hundIds"
                ? (n[e] = p(r[e]))
                : (n[e] = r[e] ?? I[e]);
      }),
      n
    );
  },
  E = (t = {}) => ({ id: "", createdAt: "", updatedAt: "", ...I, ...t });
async function mt(t) {
  const r = (t || "").trim();
  return r
    ? f()
      ? (await k()).filter((o) => p(o.hundIds).includes(r)).map(E)
      : (Array.isArray(u[m]) ? u[m] : []).filter((i) => p(i.hundIds).includes(r)).map(E)
    : [];
}
async function It(t) {
  if (!t) return [];
  if (f()) {
    const s = await M(t);
    if (!s) return [];
    const o = p(s.hundIds),
      a = await S(
        () => import("./hunde-Df0udqB2.js"),
        __vite__mapDeps([0, 1, 2, 3]),
        import.meta.url
      ).then((c) => c.listHunde()),
      l = await S(
        () => import("./kunden-BBFUy98K.js"),
        __vite__mapDeps([4, 1, 2, 3]),
        import.meta.url
      ).then((c) => c.listKunden());
    return o.map((c) => {
      const A = a.find((T) => T.id === c);
      if (!A) return { id: c, _missing: !0 };
      const K = l.find((T) => T.id === A.kundenId) || null;
      return { ...A, owner: K ? { ...K } : null };
    });
  }
  const r = Array.isArray(u[m]) ? u[m].find((s) => s.id === t) : null;
  if (!r) return [];
  const n = p(r.hundIds),
    e = Array.isArray(u.hunde) ? u.hunde : [],
    i = Array.isArray(u.kunden) ? u.kunden : [];
  return n.map((s) => {
    const o = e.find((l) => l.id === s);
    if (!o) return { id: s, _missing: !0 };
    const a = i.find((l) => l.id === o.kundenId) || null;
    return { ...o, owner: a ? { ...a } : null };
  });
}
async function k(t) {
  return f() ? L("kurse") : (await P(m, t)).map(E);
}
async function M(t, r) {
  return f() ? F("kurse", t) : (await k(r)).find((e) => e.id === t) || null;
}
async function ht(t = {}, r) {
  if (f()) return G("kurse", t);
  const n = ut(t);
  V(n);
  const e = await C(m, { id: ot(), ...n }, r),
    i = E(e);
  return (await N(i, r), i);
}
async function pt(t, r = {}, n) {
  if (f()) return Y("kurse", t, r);
  const e = await M(t, n);
  if (!e) return null;
  const i = ct(r);
  if (!Object.keys(i).length) return e;
  const s = $({ ...e, ...i });
  ((i.trainerId = s.trainerId), (i.trainerName = s.trainerName));
  const o = V({ ...e, ...i });
  ((i.ort = o), i.location || (i.location = o));
  const a = B({ ...e, ...i });
  i.hundIds = a.hundIds;
  const l = await x(m, t, i, n);
  if (!l) return null;
  const c = E(l);
  return (await N(c, n), c);
}
async function Et(t, r) {
  if (f()) return j("kurse", t);
  const n = await w(m, t, r);
  return (n != null && n.ok && (await et(t, r)), n);
}
async function gt(t) {
  const r = (t || "").trim();
  return r ? (Array.isArray(u[m]) ? u[m] : []).filter((i) => i.trainerId === r).map(E) : [];
}
export { M as a, nt as b, ft as c, It as d, Et as e, ht as f, mt as g, gt as h, k as l, pt as u };
