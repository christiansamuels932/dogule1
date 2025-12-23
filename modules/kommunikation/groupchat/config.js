/* global process */
function readEnv(key, fallback) {
  if (typeof process !== "undefined" && process?.env?.[key]) return process.env[key];
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) return import.meta.env[key];
  return fallback;
}

function parseRetentionDays(value, label) {
  if (value === undefined || value === null || value === "") return null;
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isInteger(num) || num < 1) {
    throw new Error(`${label} must be an integer >= 1`);
  }
  return num;
}

const DEFAULT_PRUNE = {
  enabled: false,
  intervalMs: 60 * 60 * 1000,
  maxDeletes: 500,
  timeBudgetMs: 200,
};

export function resolveGroupchatRetentionConfig(overrides = {}) {
  const defaultRetentionDays = parseRetentionDays(
    overrides.defaultRetentionDays ?? readEnv("DOGULE1_GROUPCHAT_RETENTION_DAYS", null),
    "defaultRetentionDays"
  );

  const pruneEnabled =
    overrides.pruneEnabled ??
    readEnv("DOGULE1_GROUPCHAT_RETENTION_PRUNE_ENABLED", "false").toLowerCase() === "true";

  return {
    defaultRetentionDays,
    prune: {
      ...DEFAULT_PRUNE,
      ...(overrides.prune || {}),
      enabled: pruneEnabled,
    },
  };
}
