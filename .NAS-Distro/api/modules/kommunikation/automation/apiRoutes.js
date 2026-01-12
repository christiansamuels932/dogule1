/* eslint-env node */
import { logEvent } from "../../shared/logging/logger.js";
import { createAutomationSal } from "./sal.js";

function jsonResponse(res, statusCode, body, headers = {}) {
  res.statusCode = statusCode;
  if (typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json");
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  }
  const payload = JSON.stringify(body);
  if (typeof res.end === "function") {
    res.end(payload);
  } else if (typeof res.send === "function") {
    res.send(payload);
  } else {
    res.body = payload;
  }
}

function parseLimit(raw) {
  if (raw === undefined || raw === null) return undefined;
  const num = Number(raw);
  if (Number.isNaN(num) || num <= 0) return undefined;
  return num;
}

function toActor(req) {
  const actor = req?.actor || {};
  return { id: actor.id || null, role: actor.role || null };
}

function resolveAuthz(req, actionId) {
  if (typeof req?.resolveAuthz === "function") {
    return req.resolveAuthz(actionId);
  }
  if (Array.isArray(req?.authz?.allowedActions)) {
    return { allowedActions: req.authz.allowedActions };
  }
  return req?.authz;
}

function logApiEvent({ actionId, actor, result, requestId, meta }) {
  try {
    logEvent({
      actionId,
      actor: {
        type: actor?.role === "system" ? "system" : "user",
        id: actor?.id,
        role: actor?.role,
      },
      target: { type: "api", id: actionId },
      result,
      requestId: requestId || "automation-api",
      message: "AUTOMATION-API",
      level: "info",
      severity: "INFO",
      meta: meta && meta.code ? { code: meta.code } : undefined,
    });
  } catch {
    // logging must not break API handlers
  }
}

function mapError(error) {
  if (!error) return { status: 500, body: { error: "unknown" } };
  if (error.code === "DENIED") {
    return { status: 403, body: { error: "denied" } };
  }
  if (error.code === "INVALID_INPUT") {
    return { status: 400, body: { error: "invalid_input", message: error.message } };
  }
  if (error.code === "SMTP_NOT_READY") {
    return { status: 400, body: { error: "smtp_not_ready", message: error.message } };
  }
  if (error.code === "SMTP_FAILED") {
    return { status: 502, body: { error: "smtp_failed", message: error.message } };
  }
  if (error.code === "NOT_FOUND") {
    return { status: 404, body: { error: "not_found" } };
  }
  return { status: 500, body: { error: "server_error", message: error.message } };
}

export function createAutomationApiHandlers(options = {}) {
  const sal = options.sal || createAutomationSal(options.salOptions || {});

  async function handleGetSettings(req, res) {
    const actor = toActor(req);
    try {
      const settings = await sal.getSettings({
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.system.view"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, { settings });
      logApiEvent({
        actionId: "kommunikation.system.view",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.system.view",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleUpdateSettings(req, res) {
    const actor = toActor(req);
    const body = req?.body || {};
    try {
      const settings = await sal.updateSettings(body, {
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.system.manage"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, { settings });
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleListEvents(req, res) {
    const actor = toActor(req);
    const limit = parseLimit(req?.query?.limit);
    try {
      const result = await sal.listEvents(
        { limit },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.system.view"),
          requestId: req?.id || req?.requestId,
        }
      );
      jsonResponse(res, 200, result);
      logApiEvent({
        actionId: "kommunikation.system.view",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.system.view",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleRecordEvent(req, res) {
    const actor = toActor(req);
    const body = req?.body || {};
    try {
      const event = await sal.recordEvent(body, {
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.system.manage"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, { event });
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleUpdateEvent(req, res) {
    const actor = toActor(req);
    const body = req?.body || {};
    const eventId = req?.params?.id || req?.params?.eventId || req?.query?.id || null;
    try {
      const event = await sal.updateEvent(eventId, body, {
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.system.manage"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, { event });
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleTestConnection(req, res) {
    const actor = toActor(req);
    try {
      const result = await sal.testConnection({
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.system.manage"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, result);
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.system.manage",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  return {
    handleGetSettings,
    handleUpdateSettings,
    handleListEvents,
    handleRecordEvent,
    handleUpdateEvent,
    handleTestConnection,
  };
}
