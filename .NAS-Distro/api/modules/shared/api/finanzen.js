import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpList, httpGet, httpCreate, httpUpdate, httpDelete } from "./httpClient.js";
import { listKurse } from "./kurse.js";
import { listTrainer } from "./trainer.js";

const TABLE = "zahlungen";

const EDITABLE_DEFAULTS = {
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
};

const ensureEditableDefaults = (payload = {}) => ({
  ...EDITABLE_DEFAULTS,
  ...payload,
});

const ensureFinanzShape = (entry = {}) => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  ...EDITABLE_DEFAULTS,
  ...entry,
  kundeId: entry.kundeId || entry.kundenId || "",
});

export async function listFinanzen(options) {
  if (isHttpMode()) {
    return httpList("finanzen");
  }
  const finanzen = await list(TABLE, options);
  return finanzen.map(ensureFinanzShape);
}

export async function getFinanz(id, options) {
  if (isHttpMode()) {
    return httpGet("finanzen", id);
  }
  const finanzen = await listFinanzen(options);
  return finanzen.find((item) => item.id === id) || null;
}

export async function createFinanz(data = {}, options) {
  if (isHttpMode()) {
    return httpCreate("finanzen", data);
  }
  const record = await create(TABLE, ensureEditableDefaults(data), options);
  return ensureFinanzShape(record);
}

export async function updateFinanz(id, data = {}, options) {
  if (isHttpMode()) {
    return httpUpdate("finanzen", id, data);
  }
  const updated = await update(TABLE, id, ensureEditableDefaults(data), options);
  return updated ? ensureFinanzShape(updated) : null;
}

export async function deleteFinanz(id, options) {
  if (isHttpMode()) {
    return httpDelete("finanzen", id);
  }
  return remove(TABLE, id, options);
}

export async function listFinanzenByKundeId(kundeId, options) {
  const finanzen = await listFinanzen(options);
  return finanzen.filter((entry) => entry.kundeId === kundeId);
}

export async function resolveFinanzenWithRelations(finanzenInput, options) {
  const finanzen = Array.isArray(finanzenInput)
    ? finanzenInput.map(ensureFinanzShape)
    : await listFinanzen(options);
  const kurse = await listKurse(options);
  const trainer = await listTrainer(options);
  const kursMap = new Map(kurse.map((kurs) => [kurs.id, kurs]));
  const trainerMap = new Map(trainer.map((entry) => [entry.id, entry]));

  return finanzen.map((finanz) => {
    const kurs = finanz.kursId ? kursMap.get(finanz.kursId) || null : null;
    const trainerEntry = kurs?.trainerId ? trainerMap.get(kurs.trainerId) || null : null;
    return {
      finanz: ensureFinanzShape(finanz),
      kurs,
      trainer: trainerEntry,
    };
  });
}

export async function getFinanzenReportForTrainer(trainerId, options) {
  const targetId = (trainerId || "").trim();
  if (!targetId) {
    return {
      entries: [],
      totals: { bezahlt: 0, offen: 0, saldo: 0 },
    };
  }

  const resolved = await resolveFinanzenWithRelations(null, options);
  const filtered = resolved.filter(({ kurs }) => kurs?.trainerId === targetId);

  const totals = filtered.reduce(
    (acc, { finanz }) => {
      const typ = (finanz.typ || "").toLowerCase();
      const amount = Number(finanz.betrag) || 0;
      if (typ === "bezahlt") {
        acc.bezahlt += amount;
      } else if (typ === "offen") {
        acc.offen += amount;
      }
      acc.saldo = acc.bezahlt - acc.offen;
      return acc;
    },
    { bezahlt: 0, offen: 0, saldo: 0 }
  );

  const entries = filtered
    .map(({ finanz, kurs, trainer }) => ({
      ...ensureFinanzShape(finanz),
      kurs: kurs || null,
      trainer: trainer || null,
    }))
    .sort((a, b) => {
      const timeA = safeDateTime(a.datum);
      const timeB = safeDateTime(b.datum);
      return timeB - timeA;
    });

  return { entries, totals };
}

function safeDateTime(value) {
  const time = new Date(value || "").getTime();
  return Number.isFinite(time) ? time : 0;
}
