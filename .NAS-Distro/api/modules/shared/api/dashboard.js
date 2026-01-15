import { isHttpMode, httpRequest } from "./httpClient.js";

export async function getDashboardBirthdays() {
  if (!isHttpMode()) {
    throw new Error("dashboard_birthdays_requires_http");
  }
  return httpRequest("/dashboard/birthdays", { method: "GET" });
}

export async function handleDashboardBirthday({ entityType, entityId, action } = {}) {
  if (!isHttpMode()) {
    throw new Error("dashboard_birthdays_requires_http");
  }
  return httpRequest("/dashboard/birthdays/handle", {
    method: "POST",
    body: { entityType, entityId, action },
  });
}
