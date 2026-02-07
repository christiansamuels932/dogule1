const ALL_MODULES = [
  "dashboard",
  "anmeldung",
  "kunden",
  "hunde",
  "kurse",
  "trainer",
  "zertifikate",
  "kommunikation",
  "schulungen",
  "uebungsbibliothek",
  "kalender",
  "finanzen",
  "waren",
];

const DISABLED_MODULES = new Set(["kalender", "finanzen", "waren"]);

const ALL_API_ENTITIES = [...ALL_MODULES, "rapporte", "historie"];

const ROLE_MODULES = {
  admin: ALL_MODULES,
  developer: ALL_MODULES,
  trainer: ["kunden", "hunde", "schulungen", "uebungsbibliothek", "kommunikation"],
  trainer_rapport: ["kunden", "hunde", "schulungen", "uebungsbibliothek", "kommunikation"],
};

const API_ACCESS = {
  admin: { read: ALL_API_ENTITIES, write: ALL_API_ENTITIES },
  developer: { read: ALL_API_ENTITIES, write: ALL_API_ENTITIES },
  trainer: {
    read: ["kunden", "hunde", "rapporte", "schulungen", "uebungsbibliothek"],
    write: ["kunden", "hunde", "rapporte", "uebungsbibliothek"],
  },
  trainer_rapport: {
    read: ["kunden", "hunde", "rapporte", "schulungen", "uebungsbibliothek"],
    write: ["rapporte", "uebungsbibliothek"],
  },
};

const KOMMUNIKATION_ACTIONS = {
  admin: [
    "kommunikation.infochannel.view",
    "kommunikation.infochannel.publish",
    "kommunikation.infochannel.confirm",
  ],
  developer: ["kommunikation.infochannel.view", "kommunikation.infochannel.confirm"],
  trainer: ["kommunikation.infochannel.view", "kommunikation.infochannel.confirm"],
  trainer_rapport: ["kommunikation.infochannel.view", "kommunikation.infochannel.confirm"],
};

export function normalizeRole(role) {
  if (!role) return null;
  return String(role).trim().toLowerCase() || null;
}

export function getAllowedModules(role) {
  const normalized = normalizeRole(role);
  if (!ROLE_MODULES[normalized]) return [];
  return ROLE_MODULES[normalized].filter((moduleId) => !DISABLED_MODULES.has(moduleId));
}

export function isModuleAllowed(role, moduleId) {
  const normalized = normalizeRole(role);
  if (!normalized || !moduleId) return false;
  if (DISABLED_MODULES.has(moduleId)) return false;
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
