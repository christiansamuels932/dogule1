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
  kundenIds: [],
};

const NUMBER_FIELDS = new Set(["capacity", "bookedCount", "price"]);

let kursSequence = db[TABLE]?.length ?? 0;

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
  normalized.hundIds = Array.isArray(payload.hundIds) ? payload.hundIds : EDITABLE_DEFAULTS.hundIds;
  normalized.kundenIds = Array.isArray(payload.kundenIds)
    ? payload.kundenIds
    : EDITABLE_DEFAULTS.kundenIds;
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
    {
      id: nextKursId(),
      ...ensureEditableDefaults(data),
    },
    options
  );
  return ensureKursShape(record);
}

export async function updateKurs(id, data = {}, options) {
  const patch = sanitizeUpdatePayload(data);
  if (!Object.keys(patch).length) {
    return getKurs(id, options);
  }
  const updated = await update(TABLE, id, patch, options);
  return updated ? ensureKursShape(updated) : null;
}

export async function deleteKurs(id, options) {
  return remove(TABLE, id, options);
}
