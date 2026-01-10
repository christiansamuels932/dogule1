/* global process */
function readEnv(key, fallback) {
  if (typeof process !== "undefined" && process?.env?.[key]) return process.env[key];
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) return import.meta.env[key];
  return fallback;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

const DEFAULTS = {
  provider: "outlook",
  senderEmail: "info@fontanas-dogworld.ch",
  senderName: "",
  replyTo: "",
  smtpHost: "",
  smtpPort: null,
  smtpSecure: true,
  smtpUser: "",
  smtpPassword: "",
  sendingEnabled: false,
  birthdayEnabled: true,
  certificateEnabled: true,
};

export function resolveAutomationConfig(overrides = {}) {
  return {
    provider: overrides.provider ?? readEnv("DOGULE1_AUTOMATION_PROVIDER", DEFAULTS.provider),
    senderEmail:
      overrides.senderEmail ?? readEnv("DOGULE1_AUTOMATION_SENDER_EMAIL", DEFAULTS.senderEmail),
    senderName:
      overrides.senderName ?? readEnv("DOGULE1_AUTOMATION_SENDER_NAME", DEFAULTS.senderName),
    replyTo: overrides.replyTo ?? readEnv("DOGULE1_AUTOMATION_REPLY_TO", DEFAULTS.replyTo),
    smtpHost: overrides.smtpHost ?? readEnv("DOGULE1_AUTOMATION_SMTP_HOST", DEFAULTS.smtpHost),
    smtpPort: overrides.smtpPort ?? DEFAULTS.smtpPort,
    smtpSecure: parseBoolean(
      overrides.smtpSecure ?? readEnv("DOGULE1_AUTOMATION_SMTP_SECURE", ""),
      DEFAULTS.smtpSecure
    ),
    smtpUser: overrides.smtpUser ?? readEnv("DOGULE1_AUTOMATION_SMTP_USER", DEFAULTS.smtpUser),
    smtpPassword:
      overrides.smtpPassword ?? readEnv("DOGULE1_AUTOMATION_SMTP_PASS", DEFAULTS.smtpPassword),
    sendingEnabled: parseBoolean(
      overrides.sendingEnabled ??
        readEnv("DOGULE1_AUTOMATION_SENDING_ENABLED", DEFAULTS.sendingEnabled),
      DEFAULTS.sendingEnabled
    ),
    birthdayEnabled: parseBoolean(
      overrides.birthdayEnabled ??
        readEnv("DOGULE1_AUTOMATION_BIRTHDAY_ENABLED", DEFAULTS.birthdayEnabled),
      DEFAULTS.birthdayEnabled
    ),
    certificateEnabled: parseBoolean(
      overrides.certificateEnabled ??
        readEnv("DOGULE1_AUTOMATION_CERTIFICATE_ENABLED", DEFAULTS.certificateEnabled),
      DEFAULTS.certificateEnabled
    ),
  };
}
