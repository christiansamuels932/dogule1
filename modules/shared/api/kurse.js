import { list, create, update, remove } from "./crud.js";
import { db } from "./db/index.js";

const TABLE = "kurse";
const DEFAULT_STATUS = "geplant";
const LEGACY_CODE_KEY = "kursId";

const EDITABLE_DEFAULTS = {
  code: "",
  title: "",
  trainerName: "",
  trainerId: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  status: DEFAULT_STATUS,
  capacity: 0,
  bookedCount: 0,
  level: "",
  price: 0,
  notes: "",
  hundIds: [],
};

const NUMBER_FIELDS = new Set(["capacity", "bookedCount", "price"]);

let kursSequence = db[TABLE]?.length ?? 0;

const normalizeIdArray = (value = []) => {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : entry))
      .filter(Boolean);
    return Array.from(new Set(cleaned));
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

const ensureParticipantIntegrity = (payload = {}) => {
  const hundIds = normalizeIdArray(payload.hundIds);

  const validatedHundIds = hundIds.map((hundId) => {
    const hund = Array.isArray(db.hunde) ? db.hunde.find((entry) => entry.id === hundId) : null;
    if (!hund) {
      throw new Error(`Hund ${hundId} existiert nicht`);
    }
    return hundId;
  });

  return {
    hundIds: validatedHundIds,
  };
};

const nextKursId = () => {
  kursSequence += 1;
  return `kurs-${kursSequence.toString().padStart(3, "0")}`;
};

const normalizeCodePayload = (payload = {}) => {
  if (payload.code !== undefined) {
    return payload;
  }
  if (payload[LEGACY_CODE_KEY] !== undefined) {
    return { ...payload, code: payload[LEGACY_CODE_KEY] };
  }
  return payload;
};

const sanitizeNumber = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureEditableDefaults = (payload = {}) => {
  const normalized = { ...EDITABLE_DEFAULTS, ...normalizeCodePayload(payload) };
  normalized.status = payload.status?.trim?.() ? payload.status : DEFAULT_STATUS;
  normalized.capacity = sanitizeNumber(payload.capacity, EDITABLE_DEFAULTS.capacity);
  normalized.bookedCount = sanitizeNumber(payload.bookedCount, EDITABLE_DEFAULTS.bookedCount);
  normalized.price = sanitizeNumber(payload.price, EDITABLE_DEFAULTS.price);
  const participants = ensureParticipantIntegrity(normalized);
  normalized.hundIds = participants.hundIds;
  return normalized;
};

const sanitizeUpdatePayload = (payload = {}) => {
  const normalized = normalizeCodePayload(payload);
  const patch = {};
  Object.keys(EDITABLE_DEFAULTS).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(normalized, key)) return;
    if (NUMBER_FIELDS.has(key)) {
      patch[key] = sanitizeNumber(normalized[key], EDITABLE_DEFAULTS[key]);
    } else if (key === "status") {
      patch[key] = normalized[key]?.trim?.() ? normalized[key] : DEFAULT_STATUS;
    } else if (key === "code") {
      patch[key] = (normalized[key] || "").trim();
    } else if (key === "hundIds") {
      patch[key] = normalizeIdArray(normalized[key]);
    } else {
      patch[key] = normalized[key] ?? EDITABLE_DEFAULTS[key];
    }
  });
  return patch;
};

const ensureKursShape = (kurs = {}) => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  ...EDITABLE_DEFAULTS,
  ...kurs,
});

export async function getKurseForHund(hundId) {
  const targetId = (hundId || "").trim();
  if (!targetId) return [];
  const kurse = Array.isArray(db[TABLE]) ? db[TABLE] : [];
  const matches = kurse.filter((kurs) => normalizeIdArray(kurs.hundIds).includes(targetId));
  return matches.map(ensureKursShape);
}

export async function getHundeForKurs(kursId) {
  if (!kursId) return [];
  const kurs = Array.isArray(db[TABLE]) ? db[TABLE].find((entry) => entry.id === kursId) : null;
  if (!kurs) return [];
  const hundIds = normalizeIdArray(kurs.hundIds);
  const hundeTable = Array.isArray(db.hunde) ? db.hunde : [];
  const kundenTable = Array.isArray(db.kunden) ? db.kunden : [];
  return hundIds.map((hundId) => {
    const hund = hundeTable.find((entry) => entry.id === hundId);
    if (!hund) {
      return { id: hundId, _missing: true };
    }
    const owner = kundenTable.find((kunde) => kunde.id === hund.kundenId) || null;
    return {
      ...hund,
      owner: owner ? { ...owner } : null,
    };
  });
}

export async function listKurse(options) {
  const kurse = await list(TABLE, options);
  return kurse.map(ensureKursShape);
}

export async function getKurs(id, options) {
  const kurse = await listKurse(options);
  return kurse.find((kurs) => kurs.id === id) || null;
}

export async function createKurs(data = {}, options) {
  const record = await create(
    TABLE,
    { id: nextKursId(), ...ensureEditableDefaults(data) },
    options
  );
  return ensureKursShape(record);
}

export async function updateKurs(id, data = {}, options) {
  const existing = await getKurs(id, options);
  if (!existing) return null;
  const patch = sanitizeUpdatePayload(data);
  if (!Object.keys(patch).length) {
    return existing;
  }
  const participants = ensureParticipantIntegrity({ ...existing, ...patch });
  patch.hundIds = participants.hundIds;
  const updated = await update(TABLE, id, patch, options);
  return updated ? ensureKursShape(updated) : null;
}

export async function deleteKurs(id, options) {
  return remove(TABLE, id, options);
}

export async function removeHundFromAllKurse(hundId, options) {
  const targetId = (hundId || "").trim();
  if (!targetId) return [];
  const kurse = Array.isArray(db[TABLE]) ? db[TABLE] : [];
  const updated = [];
  for (const kurs of kurse) {
    const existingIds = normalizeIdArray(kurs.hundIds);
    if (!existingIds.includes(targetId)) continue;
    const nextIds = existingIds.filter((id) => id !== targetId);
    const result = await update(TABLE, kurs.id, { hundIds: nextIds }, options);
    if (result) {
      updated.push(ensureKursShape(result));
    }
  }
  return updated;
}
