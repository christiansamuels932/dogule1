/* global process */
function readEnv(key, fallback) {
  if (typeof process !== "undefined" && process?.env?.[key]) return process.env[key];
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) return import.meta.env[key];
  return fallback;
}

function parsePositiveInt(value, label, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`${label} must be an integer >= 1`);
  }
  return num;
}

function parseNonNegativeInt(value, label, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`${label} must be an integer >= 0`);
  }
  return num;
}

const DEFAULTS = {
  slaHours: 48,
  reminderLeadHours: 24,
  escalationGraceHours: 0,
};

export function resolveInfochannelConfig(overrides = {}) {
  const slaHours = parsePositiveInt(
    overrides.slaHours ?? readEnv("DOGULE1_INFOCHANNEL_SLA_HOURS", DEFAULTS.slaHours),
    "slaHours",
    DEFAULTS.slaHours
  );

  const reminderLeadHours = parsePositiveInt(
    overrides.reminderLeadHours ??
      readEnv("DOGULE1_INFOCHANNEL_REMINDER_LEAD_HOURS", DEFAULTS.reminderLeadHours),
    "reminderLeadHours",
    DEFAULTS.reminderLeadHours
  );

  const escalationGraceHours = parseNonNegativeInt(
    overrides.escalationGraceHours ??
      readEnv("DOGULE1_INFOCHANNEL_ESCALATION_GRACE_HOURS", DEFAULTS.escalationGraceHours),
    "escalationGraceHours",
    DEFAULTS.escalationGraceHours
  );

  return {
    slaHours,
    reminderLeadHours,
    escalationGraceHours,
  };
}
