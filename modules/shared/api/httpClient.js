/* global fetch, window */

function resolveApiMode() {
  if (typeof window !== "undefined" && typeof window.DOGULE1_API_MODE === "string") {
    return window.DOGULE1_API_MODE;
  }
  if (globalThis.DOGULE1_API_MODE) {
    return String(globalThis.DOGULE1_API_MODE);
  }
  if (globalThis.process?.env?.DOGULE1_API_MODE) {
    return String(globalThis.process.env.DOGULE1_API_MODE);
  }
  return "";
}

export function isHttpMode() {
  const mode = resolveApiMode();
  if (mode) return mode === "http";
  const isTestEnv =
    globalThis.process?.env?.VITEST ||
    globalThis.process?.env?.NODE_ENV === "test" ||
    (typeof window !== "undefined" &&
      typeof window.navigator?.userAgent === "string" &&
      window.navigator.userAgent.includes("HappyDOM"));
  if (isTestEnv) return false;
  return typeof window !== "undefined" && typeof fetch === "function";
}

function resolveBase() {
  if (typeof window !== "undefined" && window.__DOGULE_API_BASE__) {
    return window.__DOGULE_API_BASE__;
  }
  if (globalThis.DOGULE1_API_BASE) {
    return String(globalThis.DOGULE1_API_BASE);
  }
  if (globalThis.process?.env?.DOGULE1_API_BASE) {
    return String(globalThis.process.env.DOGULE1_API_BASE);
  }
  return "/api";
}

async function doFetch(path, options = {}) {
  const res = await fetch(`${resolveBase()}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (res.status >= 200 && res.status < 300) {
    return json;
  }
  const message = json?.message || "server_error";
  const err = new Error(message);
  err.code = json?.code || "SERVER_ERROR";
  throw err;
}

export async function httpList(entity) {
  return doFetch(`/${entity}`, { method: "GET" });
}

export async function httpGet(entity, id) {
  return doFetch(`/${entity}/${id}`, { method: "GET" });
}

export async function httpCreate(entity, data) {
  return doFetch(`/${entity}`, { method: "POST", body: data });
}

export async function httpUpdate(entity, id, data) {
  return doFetch(`/${entity}/${id}`, { method: "PUT", body: data });
}

export async function httpDelete(entity, id) {
  return doFetch(`/${entity}/${id}`, { method: "DELETE" });
}
