/* eslint-env node */
/* global Buffer, process */
import { validateLogEvent } from "./schema.js";

const LEVEL_TO_SEVERITY = {
  debug: "INFO",
  info: "INFO",
  warning: "WARNING",
  alert: "ALERT",
  critical: "CRITICAL",
};

const SEVERITY_TO_LEVEL = {
  INFO: "info",
  WARNING: "warning",
  ALERT: "alert",
  CRITICAL: "critical",
};

let invalidSeenInProd = false;

function cloneEvent(event) {
  if (event === null || typeof event !== "object") return {};
  return JSON.parse(JSON.stringify(event));
}

function applyDefaults(event) {
  const enriched = cloneEvent(event);
  if (!enriched.ts) enriched.ts = new Date().toISOString();
  if (!enriched.level && enriched.severity && SEVERITY_TO_LEVEL[enriched.severity]) {
    enriched.level = SEVERITY_TO_LEVEL[enriched.severity];
  }
  if (!enriched.level) enriched.level = "info";
  if (!enriched.severity && enriched.level && LEVEL_TO_SEVERITY[enriched.level]) {
    enriched.severity = LEVEL_TO_SEVERITY[enriched.level];
  }
  return enriched;
}

function stringify(event) {
  return `${JSON.stringify(event)}\n`;
}

function validate(event) {
  const errors = [];
  if (event.meta !== undefined) {
    const metaSize = Buffer.byteLength(JSON.stringify(event.meta), "utf8");
    if (metaSize > 1024) {
      errors.push("meta exceeds 1024 bytes");
    }
  }
  const { ok, errors: schemaErrors } = validateLogEvent(event);
  if (!ok) errors.push(...schemaErrors);
  return errors;
}

function handleInvalid(event, errors) {
  const env = process.env.NODE_ENV || "development";
  if (env === "production") {
    if (invalidSeenInProd) return;
    invalidSeenInProd = true;
    const criticalEvent = applyDefaults({
      level: "critical",
      severity: "CRITICAL",
      actionId: "logging.schema.invalid",
      actor: { type: "system", id: "logger", role: null },
      target: null,
      result: "error",
      requestId: event?.requestId || "log-schema-check",
      message: "LOG-SCHEMA-INVALID",
      meta: { code: "LOG-SCHEMA-INVALID" },
    });
    process.stdout.write(stringify(criticalEvent));
    return;
  }
  throw new Error(`Invalid log event: ${errors.join("; ")}`);
}

export function logEvent(event) {
  const enriched = applyDefaults(event);
  const errors = validate(enriched);
  if (errors.length > 0) {
    handleInvalid(enriched, errors);
    return;
  }
  process.stdout.write(stringify(enriched));
}
