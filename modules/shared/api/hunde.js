import { list, create, update, remove } from "./crud.js";

const TABLE = "hunde";
const LEGACY_CODE_KEY = "hundeId";

const EDITABLE_DEFAULTS = {
  code: "",
  name: "",
  rufname: "",
  rasse: "",
  geschlecht: "",
  geburtsdatum: "",
  gewichtKg: null,
  groesseCm: null,
  kundenId: "",
  trainingsziele: "",
  notizen: "",
};

const NUMBER_FIELDS = new Set(["gewichtKg", "groesseCm"]);

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

const ensureEditableDefaults = (payload = {}) => {
  const normalized = { ...EDITABLE_DEFAULTS, ...normalizeCodePayload(payload) };
  NUMBER_FIELDS.forEach((key) => {
    normalized[key] = sanitizeNumber(payload[key]);
  });
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
  const hunde = await list(TABLE, options);
  return hunde.map(ensureHundShape);
}

export async function getHund(id, options) {
  const hunde = await listHunde(options);
  return hunde.find((hund) => hund.id === id) || null;
}

export async function createHund(data = {}, options) {
  const record = await create(TABLE, ensureEditableDefaults(data), options);
  return ensureHundShape(record);
}

export async function updateHund(id, data = {}, options) {
  const patch = sanitizeUpdatePayload(normalizeCodePayload(data));
  if (!Object.keys(patch).length) {
    return getHund(id, options);
  }
  const updated = await update(TABLE, id, patch, options);
  return updated ? ensureHundShape(updated) : null;
}

export async function deleteHund(id, options) {
  return remove(TABLE, id, options);
}
