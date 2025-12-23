/* global fetch, URLSearchParams, window */
const BASE = "/api/kommunikation/email";

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
  if (res.status === 429) {
    throw buildError("RATE_LIMITED", "rate_limited", {
      retryAfterSeconds:
        Number(res.headers.get("retry-after") || json?.retryAfterSeconds || 0) || 1,
    });
  }
  if (res.status === 503) throw buildError("SEND_DISABLED", "send_disabled");
  if (res.status === 403) throw buildError("DENIED", "denied");
  if (res.status === 404) throw buildError("NOT_FOUND", "not_found");
  if (res.status === 400) throw buildError("INVALID_INPUT", json?.message || "invalid_input");
  throw buildError("SERVER_ERROR", json?.message || "server_error");
}

export async function listEmails({ limit, cursor } = {}) {
  const query = new URLSearchParams();
  if (limit) query.set("limit", String(limit));
  if (cursor) query.set("cursor", cursor);
  const path = query.toString() ? `/emails?${query.toString()}` : "/emails";
  return doFetch(path, { method: "GET" });
}

export async function sendEmail({ to, cc, bcc, subject, body } = {}) {
  return doFetch("/emails", { method: "POST", body: { to, cc, bcc, subject, body } });
}

export async function getEmail({ id }) {
  if (!id) throw buildError("INVALID_INPUT", "email id required");
  return doFetch(`/emails/${id}`, { method: "GET" });
}
