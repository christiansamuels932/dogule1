import { list, create, update, remove } from "./crud.js";
import { db } from "./db.js";

const TABLE = "kurse";
const DEFAULT_STATUS = "geplant";

const EDITABLE_DEFAULTS = {
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
};

const NUMBER_FIELDS = new Set(["capacity", "bookedCount", "price"]);

let kursSequence = db[TABLE]?.length ?? 0;

const nextKursId = () => {
  kursSequence += 1;
  return `kurs-${kursSequence.toString().padStart(3, "0")}`;
};

const sanitizeNumber = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureEditableDefaults = (payload = {}) => {
  const normalized = { ...EDITABLE_DEFAULTS, ...payload };
  normalized.status = payload.status?.trim?.() ? payload.status : DEFAULT_STATUS;
  normalized.capacity = sanitizeNumber(payload.capacity, EDITABLE_DEFAULTS.capacity);
  normalized.bookedCount = sanitizeNumber(payload.bookedCount, EDITABLE_DEFAULTS.bookedCount);
  normalized.price = sanitizeNumber(payload.price, EDITABLE_DEFAULTS.price);
  return normalized;
};

const sanitizeUpdatePayload = (payload = {}) => {
  const patch = {};
  Object.keys(EDITABLE_DEFAULTS).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      if (NUMBER_FIELDS.has(key)) {
        patch[key] = sanitizeNumber(payload[key], EDITABLE_DEFAULTS[key]);
      } else if (key === "status") {
        patch[key] = payload[key]?.trim?.() ? payload[key] : DEFAULT_STATUS;
      } else {
        patch[key] = payload[key] ?? EDITABLE_DEFAULTS[key];
      }
    }
  });
  return patch;
};

const ensureKursShape = (kurs) => ({
  id: "",
  ...EDITABLE_DEFAULTS,
  createdAt: "",
  updatedAt: "",
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
