import { httpRequest } from "./httpClient.js";

function buildQuery(params = {}) {
  const search = new globalThis.URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function listDeveloperBackups() {
  return httpRequest("/developer/backups", { method: "GET" });
}

export async function triggerDeveloperRestore(slot) {
  return httpRequest("/developer/restore", {
    method: "POST",
    body: { slot },
  });
}

export async function listDeveloperActivity({
  limit = 250,
  actorId = "",
  actorRole = "",
  eventType = "",
} = {}) {
  return httpRequest(
    `/developer/activity${buildQuery({
      limit,
      actorId,
      actorRole,
      eventType,
    })}`,
    { method: "GET" }
  );
}

export async function deleteDeveloperActivity(id) {
  return httpRequest(`/developer/activity/${encodeURIComponent(String(id || "").trim())}`, {
    method: "DELETE",
  });
}

export async function recordSupportActivity(events = []) {
  return httpRequest("/support/activity", {
    method: "POST",
    body: { events },
  });
}
