/* eslint-env node */
import { logEvent } from "../../shared/logging/logger.js";
import { createGroupchatSal } from "./sal.js";

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
      requestId: requestId || "groupchat-api",
      message: "GROUPCHAT-API",
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

export function createGroupchatApiHandlers(options = {}) {
  const sal = options.sal || createGroupchatSal(options.salOptions || {});

  async function handleListMessages(req, res) {
    const actor = toActor(req);
    const limit = parseLimit(req?.query?.limit);
    const cursor = req?.query?.cursor;
    try {
      const result = await sal.listMessages(
        "global",
        { limit, cursor },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.chat.read"),
          requestId: req?.id || req?.requestId,
        }
      );
      jsonResponse(res, 200, {
        messages: result.messages,
        nextCursor: result.nextCursor,
        unreadCount: result.unreadCount,
      });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
    }
  }

  async function handleSendMessage(req, res) {
    const actor = toActor(req);
    const body = req?.body || {};
    try {
      const message = await sal.sendMessage(
        "global",
        { body: body.body, clientNonce: body.clientNonce },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.chat.send"),
          requestId: req?.id || req?.requestId,
        }
      );
      logApiEvent({
        actionId: "kommunikation.chat.send",
        actor,
        result: "success",
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, { message });
    } catch (error) {
      const mapped = mapError(error);
      logApiEvent({
        actionId: "kommunikation.chat.send",
        actor,
        result: mapped.status === 200 ? "success" : "error",
        requestId: req?.id || req?.requestId,
        meta: { code: mapped.body?.error },
      });
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
    }
  }

  async function handleGetReadMarker(req, res) {
    const actor = toActor(req);
    try {
      const result = await sal.getReadMarker("global", {
        actorId: actor.id,
        actorRole: actor.role,
        authz: resolveAuthz(req, "kommunikation.chat.read"),
        requestId: req?.id || req?.requestId,
      });
      jsonResponse(res, 200, result);
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
    }
  }

  async function handleSetReadMarker(req, res) {
    const actor = toActor(req);
    const body = req?.body || {};
    try {
      const marker = await sal.setReadMarker(
        "global",
        { lastReadMessageId: body.messageId },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.chat.readMarker.set"),
          requestId: req?.id || req?.requestId,
        }
      );
      // Refresh unread count after marker update
      const list = await sal.listMessages(
        "global",
        { limit: 1 },
        {
          actorId: actor.id,
          actorRole: actor.role,
          authz: resolveAuthz(req, "kommunikation.chat.read"),
          requestId: req?.id || req?.requestId,
        }
      );
      jsonResponse(res, 200, { ...marker, unreadCount: list.unreadCount });
    } catch (error) {
      const mapped = mapError(error);
      jsonResponse(res, mapped.status, mapped.body, mapped.headers);
    }
  }

  return {
    handleListMessages,
    handleSendMessage,
    handleGetReadMarker,
    handleSetReadMarker,
  };
}
