const ALL_MODULES = [
  "dashboard",
  "kunden",
  "hunde",
  "kurse",
  "trainer",
  "kommunikation",
  "kalender",
  "finanzen",
  "waren",
];

const ROLE_MODULES = {
  admin: ALL_MODULES,
  staff: ALL_MODULES,
  developer: ALL_MODULES,
  trainer: ["dashboard", "kurse", "kalender", "kommunikation"],
};

const API_ACCESS = {
  admin: { read: ALL_MODULES, write: ALL_MODULES },
  staff: { read: ALL_MODULES, write: ALL_MODULES },
  developer: { read: ALL_MODULES, write: ALL_MODULES },
  trainer: {
    read: ["kunden", "hunde", "kurse", "trainer", "kalender"],
    write: ["kurse", "kalender"],
  },
};

const KOMMUNIKATION_ACTIONS = {
  admin: ["*"],
  staff: ["*"],
  developer: ["*"],
  trainer: [
    "kommunikation.chat.read",
    "kommunikation.chat.send",
    "kommunikation.chat.readMarker.set",
    "kommunikation.infochannel.view",
    "kommunikation.infochannel.confirm",
  ],
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
