import {
  i as o,
  h,
  l as b,
  a as y,
  b as F,
  c as I,
  d as A,
  u as k,
  e as B,
  r as T,
} from "./httpClient-DjX31kqd.js";
import { l as E } from "./kurse-BUlwv0_9.js";
import { l as D } from "./trainer-BTYLIueh.js";
const f = "zahlungen",
  g = {
    code: "",
    kundeId: "",
    kursId: "",
    typ: "",
    betrag: 0,
    datum: "",
    beschreibung: "",
    leistungVon: "",
    leistungBis: "",
    waehrung: "CHF",
    nettoBetrag: 0,
    mwstSatz: 0,
    mwstBetrag: 0,
    mwstHinweis: "",
    steuerbefreiungHinweis: "",
    zahlungsfrist: "",
    zahlungsbedingungen: "",
    iban: "",
    kontaktEmail: "",
    kontaktTelefon: "",
    issuerName: "",
    issuerAdresse: "",
    empfaengerName: "",
    empfaengerAdresse: "",
    qrPayload: "",
  },
  w = (n = {}) => ({ ...g, ...n }),
  u = (n = {}) => ({
    id: "",
    createdAt: "",
    updatedAt: "",
    ...g,
    ...n,
    kundeId: n.kundeId || n.kundenId || "",
  });
async function m(n) {
  return o() ? h("finanzen") : (await b(f, n)).map(u);
}
async function N(n, t) {
  return o() ? y("finanzen", n) : (await m(t)).find((s) => s.id === n) || null;
}
async function C(n = {}, t) {
  if (o()) return F("finanzen", n);
  const r = await I(f, w(n), t);
  return u(r);
}
async function S(n, t = {}, r) {
  if (o()) return A("finanzen", n, t);
  const s = await k(f, n, w(t), r);
  return s ? u(s) : null;
}
async function K(n, t) {
  return o() ? B("finanzen", n) : T(f, n, t);
}
async function R(n, t) {
  return (await m(t)).filter((s) => s.kundeId === n);
}
async function L(n, t) {
  const r = Array.isArray(n) ? n.map(u) : await m(t),
    s = await E(t),
    l = await D(t),
    d = new Map(s.map((e) => [e.id, e])),
    p = new Map(l.map((e) => [e.id, e]));
  return r.map((e) => {
    const a = (e.kursId && d.get(e.kursId)) || null,
      i = (a != null && a.trainerId && p.get(a.trainerId)) || null;
    return { finanz: u(e), kurs: a, trainer: i };
  });
}
async function U(n, t) {
  const r = (n || "").trim();
  if (!r) return { entries: [], totals: { bezahlt: 0, offen: 0, saldo: 0 } };
  const l = (await L(null, t)).filter(({ kurs: e }) => (e == null ? void 0 : e.trainerId) === r),
    d = l.reduce(
      (e, { finanz: a }) => {
        const i = (a.typ || "").toLowerCase(),
          c = Number(a.betrag) || 0;
        return (
          i === "bezahlt" ? (e.bezahlt += c) : i === "offen" && (e.offen += c),
          (e.saldo = e.bezahlt - e.offen),
          e
        );
      },
      { bezahlt: 0, offen: 0, saldo: 0 }
    );
  return {
    entries: l
      .map(({ finanz: e, kurs: a, trainer: i }) => ({
        ...u(e),
        kurs: a || null,
        trainer: i || null,
      }))
      .sort((e, a) => {
        const i = z(e.datum);
        return z(a.datum) - i;
      }),
    totals: d,
  };
}
function z(n) {
  const t = new Date(n || "").getTime();
  return Number.isFinite(t) ? t : 0;
}
export { m as a, U as b, C as c, K as d, N as g, R as l, L as r, S as u };
