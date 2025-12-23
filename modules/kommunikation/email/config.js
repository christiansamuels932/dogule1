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

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

const DEFAULTS = {
  sendEnabled: true,
  dryRun: false,
  maxRecipients: 3,
  maxCcBcc: 5,
  maxSubjectLength: 200,
  maxBodyLength: 10000,
  rateLimitMinute: 5,
  rateLimitHour: 30,
  rateLimitDay: 200,
};

export function resolveEmailConfig(overrides = {}) {
  const sendEnabled = parseBoolean(
    overrides.sendEnabled ?? readEnv("DOGULE1_EMAIL_SEND_ENABLED", DEFAULTS.sendEnabled),
    DEFAULTS.sendEnabled
  );
  const dryRun = parseBoolean(
    overrides.dryRun ?? readEnv("DOGULE1_EMAIL_SEND_DRY_RUN", DEFAULTS.dryRun),
    DEFAULTS.dryRun
  );
  const maxRecipients = parsePositiveInt(
    overrides.maxRecipients ?? readEnv("DOGULE1_EMAIL_MAX_RECIPIENTS", DEFAULTS.maxRecipients),
    "maxRecipients",
    DEFAULTS.maxRecipients
  );
  const maxCcBcc = parsePositiveInt(
    overrides.maxCcBcc ?? readEnv("DOGULE1_EMAIL_MAX_CC_BCC", DEFAULTS.maxCcBcc),
    "maxCcBcc",
    DEFAULTS.maxCcBcc
  );
  const maxSubjectLength = parsePositiveInt(
    overrides.maxSubjectLength ??
      readEnv("DOGULE1_EMAIL_MAX_SUBJECT_LENGTH", DEFAULTS.maxSubjectLength),
    "maxSubjectLength",
    DEFAULTS.maxSubjectLength
  );
  const maxBodyLength = parsePositiveInt(
    overrides.maxBodyLength ?? readEnv("DOGULE1_EMAIL_MAX_BODY_LENGTH", DEFAULTS.maxBodyLength),
    "maxBodyLength",
    DEFAULTS.maxBodyLength
  );
  const rateLimitMinute = parsePositiveInt(
    overrides.rateLimitMinute ?? readEnv("DOGULE1_EMAIL_RATE_MINUTE", DEFAULTS.rateLimitMinute),
    "rateLimitMinute",
    DEFAULTS.rateLimitMinute
  );
  const rateLimitHour = parsePositiveInt(
    overrides.rateLimitHour ?? readEnv("DOGULE1_EMAIL_RATE_HOUR", DEFAULTS.rateLimitHour),
    "rateLimitHour",
    DEFAULTS.rateLimitHour
  );
  const rateLimitDay = parsePositiveInt(
    overrides.rateLimitDay ?? readEnv("DOGULE1_EMAIL_RATE_DAY", DEFAULTS.rateLimitDay),
    "rateLimitDay",
    DEFAULTS.rateLimitDay
  );

  return {
    sendEnabled,
    dryRun,
    maxRecipients,
    maxCcBcc,
    maxSubjectLength,
    maxBodyLength,
    rateLimitMinute,
    rateLimitHour,
    rateLimitDay,
  };
}
