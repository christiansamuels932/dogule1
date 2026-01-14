const ALL_MODULES = [
  "dashboard",
  "anmeldung",
  "kunden",
  "hunde",
  "kurse",
  "trainer",
  "zertifikate",
  "kommunikation",
  "kalender",
  "finanzen",
  "waren",
];

const ALL_API_ENTITIES = [...ALL_MODULES, "historie"];

const ROLE_MODULES = {
  admin: ALL_MODULES,
  developer: ALL_MODULES,
  trainer: ["kunden", "hunde"],
};

const API_ACCESS = {
  admin: { read: ALL_API_ENTITIES, write: ALL_API_ENTITIES },
  developer: { read: ALL_API_ENTITIES, write: ALL_API_ENTITIES },
  trainer: {
    read: ["kunden", "hunde"],
    write: ["kunden", "hunde"],
  },
};

const KOMMUNIKATION_ACTIONS = {
  admin: ["*"],
  developer: ["*"],
  trainer: [],
};

export function normalizeRole(role) {
  if (!role) return null;
  return String(role).trim().toLowerCase() || null;
}

export function getAllowedModules(role) {
  const normalized = normalizeRole(role);
  return ROLE_MODULES[normalized] ? [...ROLE_MODULES[normalized]] : [];
}

export function isModuleAllowed(role, moduleId) {
  const normalized = normalizeRole(role);
  if (!normalized || !moduleId) return false;
  const allowed = ROLE_MODULES[normalized] || [];
  return allowed.includes(moduleId);
}

export function isApiAllowed(role, entity, action) {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  const permissions = API_ACCESS[normalized];
  if (!permissions) return false;
  if (action === "read") {
    return permissions.read.includes(entity);
  }
  if (action === "write") {
    return permissions.write.includes(entity);
  }
  return false;
}

export function getKommunikationActions(role) {
  const normalized = normalizeRole(role);
  return KOMMUNIKATION_ACTIONS[normalized] ? [...KOMMUNIKATION_ACTIONS[normalized]] : [];
}
