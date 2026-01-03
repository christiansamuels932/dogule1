/* global fetch, URLSearchParams, window */
import { getSession } from "../../shared/auth/client.js";
const BASE = "/api/kommunikation/groupchat";

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
  if (res.status === 429) {
    throw buildError("RATE_LIMITED", "rate_limited", {
      retryAfterSeconds:
        Number(res.headers.get("retry-after") || json?.retryAfterSeconds || 0) || 1,
    });
  }
  if (res.status === 403) throw buildError("DENIED", "denied");
  if (res.status === 400) throw buildError("INVALID_INPUT", json?.message || "invalid_input");
  throw buildError("SERVER_ERROR", json?.message || "server_error");
}

function pickBody(body) {
  if (!body) return null;
  return typeof body === "string" ? body : body.body || null;
}

export async function listMessages({ limit, cursor } = {}) {
  const query = new URLSearchParams();
  if (limit) query.set("limit", String(limit));
  if (cursor) query.set("cursor", cursor);
  const data = await doFetch(`/messages?${query.toString()}`, { method: "GET" });
  return data;
}

export async function sendMessage({ body, clientNonce }) {
  const trimmed = pickBody(body);
  return doFetch("/messages", { method: "POST", body: { body: trimmed, clientNonce } });
}

export async function getReadMarker() {
  return doFetch("/read-marker", { method: "GET" });
}

export async function setReadMarker({ messageId }) {
  return doFetch("/read-marker", { method: "POST", body: { messageId } });
}
