import { logEvent } from "../logging/logger.js";
import { alertEvent } from "../logging/alerts.js";
import { StorageError, STORAGE_ERROR_CODES } from "./errors.js";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildActor(actorId, actorRole) {
  const type = actorRole === "system" ? "system" : "user";
  return { type, id: actorId, role: actorRole };
}

function buildTarget(entity, targetId) {
  return { type: entity, id: targetId || "unknown" };
}

function isAllowed(authz) {
  if (authz === true) return true;
  if (!authz) return false;
  if (authz.allowed === true) return true;
  if (authz.decision === "allow") return true;
  return false;
}

function validateContext({ mode, entity, operation, actionId, actorId, actorRole }) {
  const missing = [];
  if (!isNonEmptyString(mode)) missing.push("mode");
  if (!isNonEmptyString(entity)) missing.push("entity");
  if (!isNonEmptyString(operation)) missing.push("operation");
  if (!isNonEmptyString(actionId)) missing.push("actionId");
  if (!isNonEmptyString(actorId)) missing.push("actorId");
  if (!isNonEmptyString(actorRole)) missing.push("actorRole");
  if (missing.length > 0) {
    throw new StorageError(
      STORAGE_ERROR_CODES.DENIED,
      `Missing required write context: ${missing.join(", ")}`
    );
  }
  if (mode !== "mock" && mode !== "real" && mode !== "mariadb") {
    throw new StorageError(STORAGE_ERROR_CODES.STORAGE_ERROR, `Unsupported storage mode: ${mode}`);
  }
}

function requireAudit(audit, auditContext) {
  if (typeof audit !== "function") {
    throw new StorageError(
      STORAGE_ERROR_CODES.STORAGE_ERROR,
      "Audit hook is required for storage writes"
    );
  }
  if (
    !auditContext ||
    auditContext.hashPrev === undefined ||
    auditContext.hashIndex === undefined
  ) {
    throw new StorageError(
      STORAGE_ERROR_CODES.STORAGE_ERROR,
      "Audit context with hashPrev and hashIndex is required for storage writes"
    );
  }
}

function emitIncident({
  logger,
  alerter,
  incident,
  actionId,
  actorId,
  actorRole,
  entity,
  operation,
  targetId,
  requestId,
}) {
  const isDenied = incident === "denied";
  const message = isDenied ? "STORAGE-WRITE-DENIED" : "STORAGE-WRITE-ERROR";
  const result = isDenied ? "denied" : "error";
  const code = isDenied ? "STORAGE_DENIED" : "STORAGE_ERROR";
  const alertCode = isDenied ? "storage.write.denied" : "storage.write.error";
  const eventRequestId = requestId || "storage-write";
  const logPayload = {
    actionId,
    actor: buildActor(actorId, actorRole),
    target: buildTarget(entity, targetId),
    result,
    requestId: eventRequestId,
    message,
    level: isDenied ? "warning" : "critical",
    severity: isDenied ? "WARNING" : "CRITICAL",
    meta: { code },
  };
  logger(logPayload);
  if (alerter) {
    alerter({
      ...logPayload,
      alertCode,
      throttleKey: `${entity}:${operation}:${result}:${targetId || "unknown"}`,
      result,
    });
  }
}

export async function executeWriteContract({
  mode,
  entity,
  operation,
  actionId,
  actorId,
  actorRole,
  targetId,
  requestId,
  authz,
  audit,
  auditContext,
  perform,
  logger = logEvent,
  alerter = alertEvent,
}) {
  validateContext({ mode, entity, operation, actionId, actorId, actorRole });
  if (typeof perform !== "function") {
    throw new StorageError(
      STORAGE_ERROR_CODES.STORAGE_ERROR,
      "Write handler is required for storage operations"
    );
  }

  if (!isAllowed(authz)) {
    emitIncident({
      logger,
      alerter,
      incident: "denied",
      actionId,
      actorId,
      actorRole,
      entity,
      operation,
      targetId,
      requestId,
    });
    throw new StorageError(
      STORAGE_ERROR_CODES.DENIED,
      `Authorization required for ${entity}.${operation}`
    );
  }

  requireAudit(audit, auditContext);

  try {
    const result = await perform();
    const auditTarget = { module: entity, id: targetId || result?.id || "unknown" };
    await audit({
      actionId,
      actorId,
      actorRole,
      target: auditTarget,
      result: "success",
      before: auditContext.before ?? null,
      after: auditContext.after ?? result ?? null,
      context: auditContext.context ?? null,
      hashPrev: auditContext.hashPrev,
      hashIndex: auditContext.hashIndex,
      merkleRoot: auditContext.merkleRoot ?? null,
      requestId: auditContext.requestId ?? requestId ?? null,
    });
    return result;
  } catch (error) {
    emitIncident({
      logger,
      alerter,
      incident: "error",
      actionId,
      actorId,
      actorRole,
      entity,
      operation,
      targetId,
      requestId,
    });
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      STORAGE_ERROR_CODES.STORAGE_ERROR,
      error?.message || "Storage write failed",
      { cause: error }
    );
  }
}
