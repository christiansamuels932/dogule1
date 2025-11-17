import { list, create, update, remove } from "./crud.js";

const TABLE = "kunden";

const EDITABLE_DEFAULTS = {
  kundenCode: "",
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  adresse: "",
  notizen: "",
};

const ensureEditableDefaults = (payload = {}) => ({
  ...EDITABLE_DEFAULTS,
  ...payload,
});

const ensureKundeShape = (kunde = {}) => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  ...EDITABLE_DEFAULTS,
  ...kunde,
});

export async function listKunden(options) {
  const kunden = await list(TABLE, options);
  return kunden.map(ensureKundeShape);
}

export async function getKunde(id, options) {
  const kunden = await listKunden(options);
  return kunden.find((k) => k.id === id) || null;
}

export async function createKunde(data = {}, options) {
  const record = await create(TABLE, ensureEditableDefaults(data), options);
  return ensureKundeShape(record);
}

export async function updateKunde(id, data = {}, options) {
  const updated = await update(TABLE, id, ensureEditableDefaults(data), options);
  return updated ? ensureKundeShape(updated) : null;
}

export async function deleteKunde(id, options) {
  return remove(TABLE, id, options);
}
