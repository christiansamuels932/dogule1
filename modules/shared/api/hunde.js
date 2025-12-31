import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpList, httpGet, httpCreate, httpUpdate, httpDelete } from "./httpClient.js";
import { db } from "./db.js";

const TABLE = "hunde";
const LEGACY_CODE_KEY = "hundeId";

const EDITABLE_DEFAULTS = {
  code: "",
  name: "",
  rufname: "",
  rasse: "",
  geschlecht: "",
  status: "",
  geburtsdatum: "",
  kastriert: null,
  felltyp: "",
  fellfarbe: "",
  groesseTyp: "",
  gewichtKg: null,
  groesseCm: null,
  kundenId: "",
  herkunft: "",
  chipNummer: "",
  trainingsziele: "",
  notizen: "",
};

const NUMBER_FIELDS = new Set(["gewichtKg", "groesseCm"]);
const BOOLEAN_FIELDS = new Set(["kastriert"]);

const normalizeCodePayload = (payload = {}) => {
  if (payload.code !== undefined) {
    return payload;
  }
  if (payload[LEGACY_CODE_KEY] !== undefined) {
    return { ...payload, code: payload[LEGACY_CODE_KEY] };
  }
  return payload;
};

const sanitizeNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sanitizeBoolean = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "1" || value === 1 || value === "true") {
    return true;
  }
  if (value === "0" || value === 0 || value === "false") {
    return false;
  }
  return Boolean(value);
};

const ensureEditableDefaults = (payload = {}) => {
  const normalized = { ...EDITABLE_DEFAULTS, ...normalizeCodePayload(payload) };
  NUMBER_FIELDS.forEach((key) => {
    normalized[key] = sanitizeNumber(payload[key]);
  });
  BOOLEAN_FIELDS.forEach((key) => {
    normalized[key] = sanitizeBoolean(payload[key]);
  });
  return normalized;
};

const assertValidKundenId = (kundenId) => {
  const trimmed = (kundenId || "").trim();
  if (!trimmed) {
    throw new Error("kundenId ist erforderlich");
  }
  const exists = Array.isArray(db.kunden) && db.kunden.some((kunde) => kunde.id === trimmed);
  if (!exists) {
    throw new Error(`kundenId ${trimmed} existiert nicht`);
  }
  return trimmed;
};

const sanitizeUpdatePayload = (payload = {}) => {
  const patch = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(EDITABLE_DEFAULTS, key)) return;
    if (NUMBER_FIELDS.has(key)) {
      patch[key] = sanitizeNumber(value);
    } else if (BOOLEAN_FIELDS.has(key)) {
      patch[key] = sanitizeBoolean(value);
    } else if (key === "code") {
      patch[key] = (value || "").trim();
    } else {
      patch[key] = value ?? EDITABLE_DEFAULTS[key];
    }
  });
  return patch;
};

const attachLegacyAlias = (record) => {
  if (!record) return record;
  if (Object.prototype.hasOwnProperty.call(record, LEGACY_CODE_KEY)) {
    delete record[LEGACY_CODE_KEY];
  }
  Object.defineProperty(record, LEGACY_CODE_KEY, {
    configurable: true,
    enumerable: false,
    get() {
      return this.code;
    },
    set(value) {
      this.code = value;
    },
  });
  return record;
};

const ensureHundShape = (hund = {}) =>
  attachLegacyAlias({
    id: "",
    createdAt: "",
    updatedAt: "",
    ...EDITABLE_DEFAULTS,
    ...hund,
  });

export async function listHunde(options) {
  if (isHttpMode()) {
    return httpList("hunde");
  }
  const hunde = await list(TABLE, options);
  return hunde.map(ensureHundShape);
}

export async function getHund(id, options) {
  if (isHttpMode()) {
    return httpGet("hunde", id);
  }
  const hunde = await listHunde(options);
  return hunde.find((hund) => hund.id === id) || null;
}

export async function createHund(data = {}, options) {
  if (isHttpMode()) {
    return httpCreate("hunde", data);
  }
  const normalized = ensureEditableDefaults(data);
  normalized.kundenId = assertValidKundenId(normalized.kundenId);
  const record = await create(TABLE, normalized, options);
  return ensureHundShape(record);
}

export async function updateHund(id, data = {}, options) {
  if (isHttpMode()) {
    return httpUpdate("hunde", id, data);
  }
  const patch = sanitizeUpdatePayload(normalizeCodePayload(data));
  const existing = await getHund(id, options);
  if (!existing) return null;
  if (!Object.keys(patch).length) {
    return existing;
  }
  const nextKundenId = patch.kundenId ?? existing.kundenId;
  patch.kundenId = assertValidKundenId(nextKundenId);
  const updated = await update(TABLE, id, patch, options);
  return updated ? ensureHundShape(updated) : null;
}

export async function deleteHund(id, options) {
  if (isHttpMode()) {
    return httpDelete("hunde", id);
  }
  return remove(TABLE, id, options);
}
