import { create, update, remove } from "./crud.js";
import { db } from "./db/index.js";
import { isHttpMode, httpRequest, httpGet } from "./httpClient.js";

const TABLE = "subKurse";

const ensureSubKursShape = (entry = {}) => ({
  id: entry.id || "",
  kursId: entry.kursId || "",
  name: entry.name || "",
  weekday: entry.weekday || "",
  time: entry.time || "",
  primaryTrainerId: entry.primaryTrainerId || "",
  trainerIds: Array.isArray(entry.trainerIds) ? entry.trainerIds : [],
  createdAt: entry.createdAt || "",
  updatedAt: entry.updatedAt || "",
});

export async function listSubKurse(kursId) {
  const targetId = (kursId || "").trim();
  if (!targetId) return [];
  if (isHttpMode()) {
    const result = await httpRequest(`/kurse/${encodeURIComponent(targetId)}/subkurse`, {
      method: "GET",
    });
    return Array.isArray(result) ? result.map(ensureSubKursShape) : [];
  }
  const table = Array.isArray(db[TABLE]) ? db[TABLE] : [];
  return table.filter((entry) => entry.kursId === targetId).map(ensureSubKursShape);
}

export async function getSubKurs(kursId, subKursId) {
  const kurs = (kursId || "").trim();
  const sub = (subKursId || "").trim();
  if (!kurs || !sub) return null;
  if (isHttpMode()) {
    return httpGet("kurse", `${encodeURIComponent(kurs)}/subkurse/${encodeURIComponent(sub)}`);
  }
  const table = Array.isArray(db[TABLE]) ? db[TABLE] : [];
  const entry = table.find((item) => item.id === sub && item.kursId === kurs) || null;
  return entry ? ensureSubKursShape(entry) : null;
}

export async function createSubKurs(kursId, data = {}, options) {
  const kurs = (kursId || "").trim();
  if (!kurs) return null;
  if (isHttpMode()) {
    return httpRequest(`/kurse/${encodeURIComponent(kurs)}/subkurse`, {
      method: "POST",
      body: data,
    });
  }
  const record = await create(TABLE, { kursId: kurs, ...data }, options);
  return ensureSubKursShape(record);
}

export async function updateSubKurs(kursId, subKursId, data = {}, options) {
  const kurs = (kursId || "").trim();
  const sub = (subKursId || "").trim();
  if (!kurs || !sub) return null;
  if (isHttpMode()) {
    return httpRequest(`/kurse/${encodeURIComponent(kurs)}/subkurse/${encodeURIComponent(sub)}`, {
      method: "PUT",
      body: data,
    });
  }
  const updated = await update(TABLE, sub, { ...data, kursId: kurs }, options);
  return updated ? ensureSubKursShape(updated) : null;
}

export async function deleteSubKurs(kursId, subKursId, options) {
  const kurs = (kursId || "").trim();
  const sub = (subKursId || "").trim();
  if (!kurs || !sub) return { ok: false };
  if (isHttpMode()) {
    return httpRequest(`/kurse/${encodeURIComponent(kurs)}/subkurse/${encodeURIComponent(sub)}`, {
      method: "DELETE",
    });
  }
  return remove(TABLE, sub, options);
}
