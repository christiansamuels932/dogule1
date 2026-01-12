/* eslint-env node */
import { logEvent } from "../../shared/logging/logger.js";
import { createInfochannelSal } from "./sal.js";

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
      requestId: requestId || "infochannel-api",
      message: "INFOCHANNEL-API",
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
  if (error.code === "RATE_LIMITED") {
    return {
      status: 429,
      body: { error: "rate_limited", retryAfterSeconds: error.details?.retryAfterSeconds },
      headers: error.details?.retryAfterSeconds
        ? { "Retry-After": String(error.details.retryAfterSeconds) }
        : {},
    };
  }
  if (error.code === "DENIED") {
    return { status: 403, body: { error: "denied" } };
  }
  if (error.code === "INVALID_INPUT") {
    return { status: 400, body: { error: "invalid_input", message: error.message } };
  }
  if (error.code === "NOT_FOUND") {
    return { status: 404, body: { error: "not_found" } };
  }
  return { status: 500, body: { error: "server_error", message: error.message } };
}

export function createInfochannelApiHandlers(options = {}) {
  const sal = options.sal || createInfochannelSal(options.salOptions || {});

  async function handleListNotices(req, res) {
    const actor = toActor(req);
    const limit = parseLimit(req?.query?.limit);
    const cursor = req?.query?.cursor;
    try {
      const result = await sal.listNotices(
        { limit, cursor },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.infochannel.view"),
          requestId: req?.id || req?.requestId,
        }
      );
      jsonResponse(res, 200, result);
      logApiEvent({
        actionId: "kommunikation.infochannel.view",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.infochannel.view",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleCreateNotice(req, res) {
    const actor = toActor(req);
    const body = req?.body || {};
    try {
      const notice = await sal.publishNotice(
        {
          title: body.title,
          body: body.body,
          slaHours: body.slaHours,
        },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.infochannel.publish"),
          requestId: req?.id || req?.requestId,
        }
      );
      jsonResponse(res, 200, { notice });
      logApiEvent({
        actionId: "kommunikation.infochannel.publish",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.infochannel.publish",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleGetNotice(req, res) {
    const actor = toActor(req);
    const noticeId = req?.params?.id || req?.params?.noticeId || req?.query?.id || null;
    try {
      const result = await sal.getNotice(noticeId, {
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.infochannel.view"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, result);
      logApiEvent({
        actionId: "kommunikation.infochannel.view",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.infochannel.view",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleConfirmNotice(req, res) {
    const actor = toActor(req);
    const noticeId =
      req?.params?.id || req?.params?.noticeId || req?.body?.noticeId || req?.query?.id || null;
    try {
      const confirmation = await sal.confirmNotice(noticeId, {
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.infochannel.confirm"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, { confirmation });
      logApiEvent({
        actionId: "kommunikation.infochannel.confirm",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.infochannel.confirm",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleRunSlaJob(req, res) {
    const actor = toActor(req);
    try {
      const result = await sal.runSlaJob({
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.infochannel.sla.run"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, result);
      logApiEvent({
        actionId: "kommunikation.infochannel.sla.run",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.infochannel.sla.run",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  return {
    handleListNotices,
    handleCreateNotice,
    handleGetNotice,
    handleConfirmNotice,
    handleRunSlaJob,
  };
}
