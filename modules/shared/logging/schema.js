import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../../../tools/ops/log_event.schema.json");
const logEventSchema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const levelEnum = new Set(logEventSchema.properties.level.enum);
const severityEnum = new Set(logEventSchema.properties.severity.enum);
const resultEnum = new Set(logEventSchema.properties.result.enum);
const actorTypeEnum = new Set(logEventSchema.properties.actor.properties.type.enum);

const metaAllowedKeys = new Set(Object.keys(logEventSchema.properties.meta.properties));
const requiredTopLevel = new Set(logEventSchema.required);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkString(value, { field, min, max }, errors) {
  if (typeof value !== "string") {
    errors.push(`${field} must be a string`);
    return;
  }
  if (value.length < min || value.length > max) {
    errors.push(`${field} must be ${min}-${max} characters`);
  }
}

function checkOptionalString(value, { field, min, max, allowNull = false }, errors) {
  if (value === undefined) return;
  if (value === null) {
    if (!allowNull) errors.push(`${field} must be a string`);
    return;
  }
  checkString(value, { field, min, max }, errors);
}

function validateActor(actor, errors) {
  if (!isObject(actor)) {
    errors.push("actor must be an object");
    return;
  }
  if (!actorTypeEnum.has(actor.type)) {
    errors.push("actor.type must be one of user|system|anonymous");
  }
  checkOptionalString(actor.id, { field: "actor.id", min: 1, max: 128, allowNull: true }, errors);
  checkOptionalString(actor.role, { field: "actor.role", min: 1, max: 64, allowNull: true }, errors);
  const allowedKeys = ["type", "id", "role"];
  Object.keys(actor).forEach((key) => {
    if (!allowedKeys.includes(key)) errors.push(`actor.${key} is not allowed`);
  });
}

function validateTarget(target, errors) {
  if (target === null || target === undefined) return;
  if (!isObject(target)) {
    errors.push("target must be null or an object");
    return;
  }
  checkString(target.type, { field: "target.type", min: 1, max: 64 }, errors);
  checkString(target.id, { field: "target.id", min: 1, max: 128 }, errors);
  const allowedKeys = ["type", "id"];
  Object.keys(target).forEach((key) => {
    if (!allowedKeys.includes(key)) errors.push(`target.${key} is not allowed`);
  });
}

function validateMeta(meta, errors) {
  if (meta === undefined) return;
  if (!isObject(meta)) {
    errors.push("meta must be an object if provided");
    return;
  }
  const keys = Object.keys(meta);
  if (keys.length > 5) {
    errors.push("meta must not have more than 5 entries");
  }
  keys.forEach((key) => {
    if (!metaAllowedKeys.has(key)) {
      errors.push(`meta.${key} is not allowed`);
    }
  });
  if (meta.requestPath !== undefined) {
    checkString(meta.requestPath, { field: "meta.requestPath", min: 1, max: 200 }, errors);
  }
  if (meta.ipHash !== undefined) {
    checkString(meta.ipHash, { field: "meta.ipHash", min: 1, max: 128 }, errors);
  }
  if (meta.windowSeconds !== undefined) {
    if (!Number.isInteger(meta.windowSeconds)) {
      errors.push("meta.windowSeconds must be an integer");
    } else if (meta.windowSeconds < 1 || meta.windowSeconds > 86400) {
      errors.push("meta.windowSeconds must be between 1 and 86400");
    }
  }
  if (meta.limit !== undefined) {
    if (!Number.isInteger(meta.limit)) {
      errors.push("meta.limit must be an integer");
    } else if (meta.limit < 1 || meta.limit > 100000) {
      errors.push("meta.limit must be between 1 and 100000");
    }
  }
  if (meta.code !== undefined) {
    checkString(meta.code, { field: "meta.code", min: 1, max: 64 }, errors);
  }
}

function validateRequired(event, errors) {
  requiredTopLevel.forEach((field) => {
    if (event[field] === undefined) {
      errors.push(`${field} is required`);
    }
  });
}

export function validateLogEvent(event) {
  const errors = [];
  if (!isObject(event)) {
    return { ok: false, errors: ["event must be an object"] };
  }

  validateRequired(event, errors);

  if (event.ts !== undefined) {
    checkString(event.ts, { field: "ts", min: 1, max: 128 }, errors);
    if (typeof event.ts === "string" && Number.isNaN(Date.parse(event.ts))) {
      errors.push("ts must be an ISO-8601 date-time string");
    }
  }

  if (event.level !== undefined && !levelEnum.has(event.level)) {
    errors.push("level must be one of debug|info|warning|alert|critical");
  }

  if (event.severity !== undefined && !severityEnum.has(event.severity)) {
    errors.push("severity must be one of INFO|WARNING|ALERT|CRITICAL");
  }

  if (event.actionId !== undefined) {
    checkString(event.actionId, { field: "actionId", min: 1, max: 128 }, errors);
  }

  if (event.actor !== undefined) {
    validateActor(event.actor, errors);
  } else if (requiredTopLevel.has("actor")) {
    errors.push("actor is required");
  }

  if (event.target !== undefined) {
    validateTarget(event.target, errors);
  }

  if (event.result !== undefined && !resultEnum.has(event.result)) {
    errors.push("result must be one of success|denied|rate_limited|error");
  }

  if (event.requestId !== undefined) {
    checkString(event.requestId, { field: "requestId", min: 1, max: 128 }, errors);
  }

  if (event.message !== undefined) {
    checkString(event.message, { field: "message", min: 1, max: 128 }, errors);
  }

  if (event.meta !== undefined) {
    validateMeta(event.meta, errors);
  }

  if (event.alertCode !== undefined) {
    checkString(event.alertCode, { field: "alertCode", min: 1, max: 64 }, errors);
  }

  if (event.throttleKey !== undefined) {
    checkString(event.throttleKey, { field: "throttleKey", min: 1, max: 128 }, errors);
  }

  return { ok: errors.length === 0, errors };
}

// Minimal, schema-aligned subset validator until an in-repo JSON Schema validator is available (Station 62).
