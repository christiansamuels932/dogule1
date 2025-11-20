import { list, create, update, remove } from "./crud.js";

const TABLE = "zahlungen";

const EDITABLE_DEFAULTS = {
  code: "",
  kundeId: "",
  typ: "",
  betrag: 0,
  datum: "",
  beschreibung: "",
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
});

export async function listFinanzen(options) {
  const finanzen = await list(TABLE, options);
  return finanzen.map(ensureFinanzShape);
}

export async function getFinanz(id, options) {
  const finanzen = await listFinanzen(options);
  return finanzen.find((item) => item.id === id) || null;
}

export async function createFinanz(data = {}, options) {
  const record = await create(TABLE, ensureEditableDefaults(data), options);
  return ensureFinanzShape(record);
}

export async function updateFinanz(id, data = {}, options) {
  const updated = await update(TABLE, id, ensureEditableDefaults(data), options);
  return updated ? ensureFinanzShape(updated) : null;
}

export async function deleteFinanz(id, options) {
  return remove(TABLE, id, options);
}

export async function listFinanzenByKundeId(kundeId, options) {
  const finanzen = await listFinanzen(options);
  return finanzen.filter((entry) => entry.kundeId === kundeId);
}
