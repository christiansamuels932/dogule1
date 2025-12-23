/* eslint-env node */
import { logEvent } from "../../shared/logging/logger.js";
import { createEmailSal } from "./sal.js";

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
      requestId: requestId || "email-api",
      message: "EMAIL-API",
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
  if (error.code === "SEND_DISABLED") {
    return { status: 503, body: { error: "send_disabled" } };
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

export function createEmailApiHandlers(options = {}) {
  const sal = options.sal || createEmailSal(options.salOptions || {});

  async function handleListEmails(req, res) {
    const actor = toActor(req);
    const limit = parseLimit(req?.query?.limit);
    const cursor = req?.query?.cursor;
    try {
      const result = await sal.listEmails(
        { limit, cursor },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.email.view"),
          requestId: req?.id || req?.requestId,
        }
      );
      jsonResponse(res, 200, result);
      logApiEvent({
        actionId: "kommunikation.email.view",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.email.view",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleSendEmail(req, res) {
    const actor = toActor(req);
    const body = req?.body || {};
    try {
      const email = await sal.sendEmail(
        {
          to: body.to,
          cc: body.cc,
          bcc: body.bcc,
          subject: body.subject,
          body: body.body,
        },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.email.send_customer"),
          requestId: req?.id || req?.requestId,
        }
      );
      jsonResponse(res, 200, { email });
      logApiEvent({
        actionId: "kommunikation.email.send_customer",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.email.send_customer",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  async function handleGetEmail(req, res) {
    const actor = toActor(req);
    const emailId = req?.params?.id || req?.params?.emailId || req?.query?.id || null;
    try {
      const email = await sal.getEmail(emailId, {
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.email.view"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, { email });
      logApiEvent({
        actionId: "kommunikation.email.view",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
      logApiEvent({
        actionId: "kommunikation.email.view",
        actor,
        result: "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
    }
  }

  return {
    handleListEmails,
    handleSendEmail,
    handleGetEmail,
  };
}
