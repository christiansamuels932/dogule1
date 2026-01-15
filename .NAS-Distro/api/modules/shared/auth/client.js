/* global window, localStorage */
import { getKommunikationActions, getAllowedModules } from "./rbac.js";

const STORAGE_KEY = "dogule1.auth.session";
let cachedSession = null;

function resolveStorage() {
  if (typeof localStorage === "undefined" || !localStorage) return null;
  if (typeof localStorage.getItem !== "function") return null;
  if (typeof localStorage.setItem !== "function") return null;
  if (typeof localStorage.removeItem !== "function") return null;
  return localStorage;
}

function safeParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function loadSession() {
  if (cachedSession) return cachedSession;
  const storage = resolveStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw);
  cachedSession = parsed && parsed.accessToken ? parsed : null;
  return cachedSession;
}

export function saveSession(session) {
  cachedSession = session;
  const storage = resolveStorage();
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(session));
  syncWindowAuth(session);
}

export function clearSession() {
  cachedSession = null;
  const storage = resolveStorage();
  if (storage) storage.removeItem(STORAGE_KEY);
  syncWindowAuth(null);
}

export function getSession() {
  return loadSession();
}

export function getAuthHeaders() {
  const session = loadSession();
  if (!session?.accessToken) return {};
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "x-dogule-actor-id": session.user?.id || "",
    "x-dogule-actor-role": session.user?.role || "",
  };
}

export function getAllowedNavModules(role) {
  return getAllowedModules(role);
}

export function syncWindowAuth(session = loadSession()) {
  if (typeof window === "undefined") return;
  if (!session || !session.user) {
    window.__DOGULE_AUTH__ = null;
    window.__DOGULE_ACTOR__ = null;
    window.__DOGULE_AUTHZ__ = null;
    return;
  }
  const role = session.user.role || "";
  const actions = getKommunikationActions(role);
  window.__DOGULE_AUTH__ = session;
  window.__DOGULE_ACTOR__ = {
    id: session.user.id,
    role,
  };
  window.__DOGULE_AUTHZ__ = {
    allowedActions: actions,
  };
}

export function getDefaultModuleForRole(role) {
  const allowed = getAllowedModules(role);
  return allowed.includes("dashboard") ? "dashboard" : allowed[0] || "auth";
}
