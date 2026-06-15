/* global fetch */
import { list, create, update, remove } from "./crud.js";
import { isHttpMode, httpRequest } from "./httpClient.js";
import { clearSession, getAuthHeaders, getSession, saveSession } from "../auth/client.js";

const TABLE = "uebungsbibliothek";
const CATEGORIES_TABLE = "uebungsbibliothek_kategorien";

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

export async function listUebungsbibliothekMaterial(options) {
  if (isHttpMode()) {
    return httpRequest("/uebungsbibliothek/material", { method: "GET" });
  }
  return list("uebungsbibliothek_material", options);
}

export async function deleteUebungsbibliothekMaterial(id, options) {
  if (!id) return { ok: false };
  if (isHttpMode()) {
    return httpRequest(`/uebungsbibliothek/material/${id}`, { method: "DELETE" });
  }
  return remove("uebungsbibliothek_material", id, options);
}

export async function uploadUebungsbibliothekMaterial({
  name = "",
  materialType = "",
  fileName = "",
  dataUrl = "",
  file = null,
} = {}) {
  if (file && isHttpMode()) {
    const request = () =>
      fetch("/api/uebungsbibliothek/material", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": file.type || "application/octet-stream",
          "x-dogule-material-name": encodeURIComponent(name),
          "x-dogule-material-type": materialType,
          "x-dogule-material-filename": encodeURIComponent(fileName || file.name || ""),
        },
        body: file,
      });
    let res = await request();
    if (res.status === 401) {
      const refreshed = await refreshUploadSession();
      if (refreshed) {
        res = await request();
      }
    }
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (res.ok) return json;
    if (res.status === 401) {
      clearSession();
    }
    const err = new Error(json?.message || `material_upload_failed_${res.status}`);
    err.status = res.status;
    err.code = json?.code || "";
    throw err;
  }
  return httpRequest("/uebungsbibliothek/material", {
    method: "POST",
    body: { name, materialType, fileName, dataUrl },
  });
}

async function refreshUploadSession() {
  const session = getSession();
  if (!session?.refreshToken) return null;
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok || !data?.accessToken) {
    clearSession();
    return null;
  }
  saveSession({ ...session, ...data });
  return data;
}

export async function listUebungsbibliothekKategorien(options) {
  if (isHttpMode()) {
    return httpRequest("/uebungsbibliothek/kategorien", { method: "GET" });
  }
  return list(CATEGORIES_TABLE, options);
}

export async function createUebungsbibliothekKategorie(data = {}, options) {
  if (isHttpMode()) {
    return httpRequest("/uebungsbibliothek/kategorien", { method: "POST", body: data });
  }
  return create(CATEGORIES_TABLE, data, options);
}
