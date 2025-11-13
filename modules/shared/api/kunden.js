import { list, create, update, remove } from "./crud.js";

const TABLE = "kunden";

export async function listKunden(options) {
  return list(TABLE, options);
}

export async function getKunde(id, options) {
  const kunden = await listKunden(options);
  return kunden.find((k) => k.id === id) || null;
}

export async function createKunde(data, options) {
  return create(TABLE, data, options);
}

export async function updateKunde(id, data, options) {
  return update(TABLE, id, data, options);
}

export async function deleteKunde(id, options) {
  return remove(TABLE, id, options);
}
