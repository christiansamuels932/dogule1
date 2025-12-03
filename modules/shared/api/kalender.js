import { list, create, update, remove } from "./crud.js";
import { db } from "./db/index.js";

const TABLE = "kalender";

const SHAPE = {
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

function ensureShape(entry = {}) {
  return { ...SHAPE, ...entry };
}

const trim = (value) => (typeof value === "string" ? value.trim() : "");
const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_REGEX = /^(\d{2}):(\d{2})$/;

function parseDateParts(dateStr) {
  const match = DATE_REGEX.exec(trim(dateStr));
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  const candidate = new Date(year, month - 1, day);
  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function parseTimeParts(timeStr) {
  const match = TIME_REGEX.exec(trim(timeStr));
  if (!match) return null;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function toLocalIso(dateStr, timeStr) {
  const dateParts = parseDateParts(dateStr);
  const timeParts = parseTimeParts(timeStr);
  if (!dateParts || !timeParts) return null;
  const { year, month, day } = dateParts;
  const { hours, minutes } = timeParts;
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }
  return date.toISOString();
}

function hasSchedule(kurs = {}) {
  return Boolean(trim(kurs.date) && trim(kurs.startTime));
}

function buildEventPayloadFromKurs(kurs = {}) {
  const kursId = trim(kurs.id);
  if (!kursId || !hasSchedule(kurs)) return null;
  const startIso = toLocalIso(kurs.date, kurs.startTime);
  const endIso = toLocalIso(kurs.date, kurs.endTime || kurs.startTime);
  if (!startIso || !endIso) return null;
  return {
    id: `cal-${kursId}`,
    kursId,
    trainerId: trim(kurs.trainerId),
    title: trim(kurs.title) || trim(kurs.code) || "Kurs",
    code: trim(kurs.code),
    start: startIso,
    end: endIso,
    location: trim(kurs.location),
    notes: trim(kurs.notes),
  };
}

function findEventByKursId(kursId) {
  const target = trim(kursId);
  if (!target) return null;
  const entries = Array.isArray(db[TABLE]) ? db[TABLE] : [];
  return entries.find((evt) => evt.kursId === target) || null;
}

function isSameEvent(existing = {}, payload = {}) {
  const fields = ["title", "start", "end", "code", "location", "notes", "kursId", "trainerId"];
  return fields.every((field) => trim(existing[field]) === trim(payload[field]));
}

export async function listKalenderEvents(options) {
  await syncKalenderWithKurse({ ...options, delay: 0 });
  const events = await list(TABLE, options);
  return events.map(ensureShape);
}

export async function getKalenderEvent(id, options) {
  const events = await listKalenderEvents(options);
  return events.find((evt) => evt.id === id) || null;
}

export async function upsertKalenderEventForKurs(kurs, options) {
  const payload = buildEventPayloadFromKurs(kurs);
  const kursId = trim(kurs?.id);
  const existing = findEventByKursId(kursId);

  if (!payload) {
    if (existing) {
      await remove(TABLE, existing.id, options);
    }
    return null;
  }

  if (existing) {
    if (isSameEvent(existing, payload)) {
      return ensureShape(existing);
    }
    const patch = { ...payload };
    delete patch.id;
    const updated = await update(TABLE, existing.id, patch, options);
    return updated ? ensureShape(updated) : null;
  }

  const created = await create(TABLE, { ...payload, id: payload.id || `cal-${kursId}` }, options);
  return ensureShape(created);
}

export async function removeKalenderEventByKursId(kursId, options) {
  const existing = findEventByKursId(kursId);
  if (!existing) return { ok: false };
  return remove(TABLE, existing.id, options);
}

export async function syncKalenderWithKurse(options) {
  const kurse = Array.isArray(db.kurse) ? db.kurse : [];
  const kursIdSet = new Set(kurse.map((kurs) => kurs.id).filter(Boolean));

  // Clean up calendar entries that point to non-existent courses
  const kalenderEntries = Array.isArray(db[TABLE]) ? [...db[TABLE]] : [];
  for (const entry of kalenderEntries) {
    if (entry.kursId && !kursIdSet.has(entry.kursId)) {
      await remove(TABLE, entry.id, { ...options, delay: 0 });
    }
  }

  for (const kurs of kurse) {
    await upsertKalenderEventForKurs(kurs, { ...options, delay: 0 });
  }
}
