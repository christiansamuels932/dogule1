/* global URLSearchParams */
import { list, create } from "./crud.js";
import { isHttpMode, httpRequest } from "./httpClient.js";

const TABLE = "historieEntries";

export async function listHistorieEntries({ entityType = "", entityId = "" } = {}) {
  if (isHttpMode()) {
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    if (entityId) params.set("entityId", entityId);
    const query = params.toString();
    return httpRequest(`/historie${query ? `?${query}` : ""}`, { method: "GET" });
  }

  const entries = await list(TABLE);
  return entries
    .filter((entry) => (entityType ? entry.entityType === entityType : true))
    .filter((entry) => (entityId ? entry.entityId === entityId : true))
    .sort((a, b) => String(b.occurredAt || "").localeCompare(String(a.occurredAt || "")));
}

export async function createHistorieEntry(data = {}) {
  if (isHttpMode()) {
    return httpRequest("/historie", { method: "POST", body: data });
  }
  const occurredAt = data.occurredAt || new Date().toISOString();
  return create(TABLE, { ...data, occurredAt });
}
