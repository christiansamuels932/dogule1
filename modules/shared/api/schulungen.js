import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpRequest } from "./httpClient.js";

const TABLE = "schulungen";

export async function listSchulungen(options) {
  if (isHttpMode()) {
    return httpRequest("/schulungen", { method: "GET" });
  }
  return list(TABLE, options);
}

export async function getSchulung(id, options) {
  if (!id) return null;
  if (isHttpMode()) {
    return httpRequest(`/schulungen/${id}`, { method: "GET" });
  }
  const items = await list(TABLE, options);
  return items.find((entry) => entry.id === id) || null;
}

export async function createSchulung(data = {}, options) {
  if (isHttpMode()) {
    return httpRequest("/schulungen", { method: "POST", body: data });
  }
  return create(TABLE, data, options);
}

export async function updateSchulung(id, data = {}, options) {
  if (!id) return null;
  if (isHttpMode()) {
    return httpRequest(`/schulungen/${id}`, { method: "PATCH", body: data });
  }
  return update(TABLE, id, data, options);
}

export async function deleteSchulung(id, options) {
  if (!id) return { ok: false };
  if (isHttpMode()) {
    return httpRequest(`/schulungen/${id}`, { method: "DELETE" });
  }
  return remove(TABLE, id, options);
}

export async function uploadSchulungImage({ fileName = "", dataUrl = "" } = {}) {
  return httpRequest("/schulungen/uploads", {
    method: "POST",
    body: { fileName, dataUrl },
  });
}
