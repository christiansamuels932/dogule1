/* eslint-env node */
import { logEvent } from "../logging/logger.js";
import { rateLimit } from "../ratelimit/limiter.js";

function jsonResponse(res, statusCode, body) {
  res.statusCode = statusCode;
  if (typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json");
  }
  const payload = JSON.stringify(body);
  if (typeof res.end === "function") {
    res.end(payload);
  } else if (typeof res.send === "function") {
    res.send(payload);
  }
}

function defaultReadinessCheck() {
  return {
    configLoaded: true,
    loggerReady: typeof logEvent === "function",
    rateLimitReady: typeof rateLimit === "function",
  };
}

function logNotReady(checks, options = {}) {
  const logger = options.logger || logEvent;
  logger({
    level: "warning",
    severity: "WARNING",
    actionId: "system.health.readiness",
    actor: { type: "system", id: "health", role: null },
    target: { type: "health", id: "readyz" },
    result: "error",
    requestId: options.requestId || "health-readyz",
    message: "READINESS-NOT-READY",
    meta: { code: "READINESS-NOT-READY", missing: Object.keys(checks).filter((k) => !checks[k]) },
  });
}

export function createHealthHandlers(options = {}) {
  const readinessCheck = options.readinessCheck || defaultReadinessCheck;
  const logger = options.logger || logEvent;

  function handleHealthz(req, res) {
    jsonResponse(res, 200, { status: "ok" });
  }

  function handleReadyz(req, res) {
    const checks = readinessCheck();
    const ready = checks && Object.values(checks).every(Boolean);
    if (ready) {
      jsonResponse(res, 200, { status: "ok" });
      return;
    }
    logNotReady(checks || {}, { logger, requestId: req?.id || req?.requestId });
    jsonResponse(res, 503, { status: "not_ready" });
  }

  return { handleHealthz, handleReadyz };
}
