import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpList, httpGet, httpCreate, httpUpdate, httpDelete } from "./httpClient.js";

const TABLE = "waren";

const EDITABLE_DEFAULTS = {
  code: "",
  kundenId: "",
  produktName: "",
  menge: 1,
  preis: 0,
  datum: "",
  beschreibung: "",
};

const NUMBER_FIELDS = new Set(["menge", "preis"]);

const sanitizeNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ensureEditableDefaults = (payload = {}) => {
  const normalized = { ...EDITABLE_DEFAULTS, ...payload };
  NUMBER_FIELDS.forEach((key) => {
    normalized[key] = sanitizeNumber(payload[key] ?? normalized[key]);
  });
  if (typeof normalized.code === "string") {
    normalized.code = normalized.code.trim();
  }
  return normalized;
};

const sanitizeUpdatePayload = (payload = {}) => {
  const patch = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(EDITABLE_DEFAULTS, key)) return;
    if (NUMBER_FIELDS.has(key)) {
      patch[key] = sanitizeNumber(value);
    } else if (key === "code") {
      patch[key] = (value || "").trim();
    } else {
      patch[key] = value ?? EDITABLE_DEFAULTS[key];
    }
  });
  return patch;
};

const ensureWarenShape = (entry = {}) => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  ...EDITABLE_DEFAULTS,
  ...entry,
});

export async function listWaren(options) {
  if (isHttpMode()) {
    return httpList("waren");
  }
  const waren = await list(TABLE, options);
  return waren.map(ensureWarenShape);
}

export async function getWarenById(id, options) {
  if (isHttpMode()) {
    return httpGet("waren", id);
  }
  const waren = await listWaren(options);
  return waren.find((verkauf) => verkauf.id === id) || null;
}

export async function createWaren(data = {}, options) {
  if (isHttpMode()) {
    return httpCreate("waren", data);
  }
  const record = await create(TABLE, ensureEditableDefaults(data), options);
  return ensureWarenShape(record);
}

export async function updateWaren(id, data = {}, options) {
  if (isHttpMode()) {
    return httpUpdate("waren", id, data);
  }
  const patch = sanitizeUpdatePayload(data);
  if (!Object.keys(patch).length) {
    return getWarenById(id, options);
  }
  const updated = await update(TABLE, id, patch, options);
  return updated ? ensureWarenShape(updated) : null;
}

export async function deleteWaren(id, options) {
  if (isHttpMode()) {
    return httpDelete("waren", id);
  }
  return remove(TABLE, id, options);
}

export async function listWarenByKundeId(kundenId, options) {
  const waren = await listWaren(options);
  return waren.filter((verkauf) => verkauf.kundenId === kundenId);
}
