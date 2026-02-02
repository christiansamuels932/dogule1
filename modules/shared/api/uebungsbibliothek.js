import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpRequest } from "./httpClient.js";

const TABLE = "uebungsbibliothek";

export async function listUebungsbibliothek(options) {
  if (isHttpMode()) {
    return httpRequest("/uebungsbibliothek", { method: "GET" });
  }
  return list(TABLE, options);
}

export async function getUebungsbibliothek(id, options) {
  if (!id) return null;
  if (isHttpMode()) {
    return httpRequest(`/uebungsbibliothek/${id}`, { method: "GET" });
  }
  const items = await list(TABLE, options);
  return items.find((entry) => entry.id === id) || null;
}

export async function createUebungsbibliothek(data = {}, options) {
  if (isHttpMode()) {
    return httpRequest("/uebungsbibliothek", { method: "POST", body: data });
  }
  return create(TABLE, data, options);
}

export async function updateUebungsbibliothek(id, data = {}, options) {
  if (!id) return null;
  if (isHttpMode()) {
    return httpRequest(`/uebungsbibliothek/${id}`, { method: "PATCH", body: data });
  }
  return update(TABLE, id, data, options);
}

export async function deleteUebungsbibliothek(id, options) {
  if (!id) return { ok: false };
  if (isHttpMode()) {
    return httpRequest(`/uebungsbibliothek/${id}`, { method: "DELETE" });
  }
  return remove(TABLE, id, options);
}

export async function uploadUebungsbibliothekImage({ fileName = "", dataUrl = "" } = {}) {
  return httpRequest("/uebungsbibliothek/uploads", {
    method: "POST",
    body: { fileName, dataUrl },
  });
}
