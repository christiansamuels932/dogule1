/* global fetch, URLSearchParams, window */
import { getSession } from "../../shared/auth/client.js";
const BASE = "/api/kommunikation/automation";

function buildError(code, message, details) {
  const err = new Error(message || code);
  err.code = code;
  if (details) err.details = details;
  return err;
}

function buildAuthHeaders() {
  if (typeof window === "undefined") return {};
  const actor = window.__DOGULE_ACTOR__ || {};
  const authz = window.__DOGULE_AUTHZ__?.allowedActions;
  const headers = {};
  const session = getSession();
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }
  if (actor.id) headers["x-dogule-actor-id"] = actor.id;
  if (actor.role) headers["x-dogule-actor-role"] = actor.role;
  if (Array.isArray(authz) && authz.length) {
    headers["x-dogule-authz"] = authz.join(",");
  }
  return headers;
}

async function doFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (res.status >= 200 && res.status < 300) {
    return json;
  }
  if (res.status === 403) throw buildError("DENIED", "denied");
  if (res.status === 404) throw buildError("NOT_FOUND", "not_found");
  if (res.status === 400) {
    throw buildError(json?.error || "INVALID_INPUT", json?.message || "invalid_input");
  }
  if (res.status === 502) {
    throw buildError(json?.error || "SMTP_FAILED", json?.message || "smtp_failed");
  }
  throw buildError(json?.error || "SERVER_ERROR", json?.message || "server_error");
}

export async function getAutomationSettings() {
  const result = await doFetch("/settings", { method: "GET" });
  return result?.settings || null;
}

export async function updateAutomationSettings(patch = {}) {
  const result = await doFetch("/settings", { method: "PATCH", body: patch });
  return result?.settings || null;
}

export async function listAutomationEvents({ limit } = {}) {
  const query = new URLSearchParams();
  if (limit) query.set("limit", String(limit));
  const path = query.toString() ? `/events?${query.toString()}` : "/events";
  return doFetch(path, { method: "GET" });
}

export async function recordAutomationEvent(payload = {}) {
  const result = await doFetch("/events", { method: "POST", body: payload });
  return result?.event || null;
}

export async function updateAutomationEvent(id, patch = {}) {
  if (!id) throw buildError("INVALID_INPUT", "event id required");
  const result = await doFetch(`/events/${id}`, { method: "PATCH", body: patch });
  return result?.event || null;
}

export async function testAutomationConnection() {
  const result = await doFetch("/settings/test", { method: "POST" });
  return result || null;
}
