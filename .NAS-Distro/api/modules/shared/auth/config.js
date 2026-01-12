/* global process */
const DEFAULT_HASH = {
  algorithm: "PBKDF2",
  digest: "SHA-256",
  iterations: 120000,
  saltBytes: 16,
  keyLength: 32,
};

const DEFAULT_LOCKOUT = {
  maxAttempts: 5,
  windowMs: 5 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
};

const DEFAULT_TOKENS = {
  accessTtlMs: 24 * 60 * 60 * 1000,
  refreshTtlMs: 7 * 24 * 60 * 60 * 1000,
};

function readEnv(key, fallback) {
  if (typeof process !== "undefined" && process?.env?.[key]) return process.env[key];
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) return import.meta.env[key];
  return fallback;
}

export function resolveAuthConfig(overrides = {}) {
  const enabled = overrides.enabled ?? readEnv("DOGULE1_AUTH_ENABLED", "false") === "true";
  const sessionCookieName = readEnv("DOGULE1_SESSION_COOKIE_NAME", "dogule1.sid");
  const requireAdmin2fa =
    overrides.requireAdmin2fa ??
    readEnv("DOGULE1_REQUIRE_ADMIN_2FA", "false").toLowerCase() === "true";

  return {
    enabled,
    hash: { ...DEFAULT_HASH, ...(overrides.hash || {}) },
    lockout: { ...DEFAULT_LOCKOUT, ...(overrides.lockout || {}) },
    tokens: { ...DEFAULT_TOKENS, ...(overrides.tokens || {}) },
    secrets: {
      access: overrides.accessSecret ?? readEnv("DOGULE1_AUTH_SECRET", "dev-access-secret"),
      refresh: overrides.refreshSecret ?? readEnv("DOGULE1_REFRESH_SECRET", "dev-refresh-secret"),
    },
    sessionCookieName,
    requireAdmin2fa,
  };
}
