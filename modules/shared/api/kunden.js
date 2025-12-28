import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpList, httpGet, httpCreate, httpUpdate, httpDelete } from "./httpClient.js";

const TABLE = "kunden";
const LEGACY_CODE_KEY = "kundenCode";

const EDITABLE_DEFAULTS = {
  code: "",
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  adresse: "",
  notizen: "",
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

const ensureEditableDefaults = (payload = {}) => ({
  ...EDITABLE_DEFAULTS,
  ...normalizeCodePayload(payload),
});

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

const ensureKundeShape = (kunde = {}) =>
  attachLegacyAlias({
    id: "",
    createdAt: "",
    updatedAt: "",
    ...EDITABLE_DEFAULTS,
    ...kunde,
  });

export async function listKunden(options) {
  if (isHttpMode()) {
    return httpList("kunden");
  }
  const kunden = await list(TABLE, options);
  return kunden.map(ensureKundeShape);
}

export async function getKunde(id, options) {
  if (isHttpMode()) {
    return httpGet("kunden", id);
  }
  const kunden = await listKunden(options);
  return kunden.find((k) => k.id === id) || null;
}

export async function createKunde(data = {}, options) {
  if (isHttpMode()) {
    return httpCreate("kunden", data);
  }
  const record = await create(TABLE, ensureEditableDefaults(data), options);
  return ensureKundeShape(record);
}

export async function updateKunde(id, data = {}, options) {
  if (isHttpMode()) {
    return httpUpdate("kunden", id, data);
  }
  const updated = await update(TABLE, id, ensureEditableDefaults(data), options);
  return updated ? ensureKundeShape(updated) : null;
}

export async function deleteKunde(id, options) {
  if (isHttpMode()) {
    return httpDelete("kunden", id);
  }
  return remove(TABLE, id, options);
}
