/* eslint-env node */
import { logEvent } from "../logging/logger.js";

const buckets = new Map(); // key -> { count, resetAt }

function nowMs() {
  return Date.now();
}

function toResetAt(startMs, windowMs) {
  return startMs + windowMs;
}

export function rateLimit({ actionId, key, limit, windowMs }) {
  void actionId; // reserved for future audit/log coupling
  const now = nowMs();
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    const resetAt = toResetAt(now, windowMs);
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (bucket.count < limit) {
    bucket.count += 1;
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
  }
  return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
}

export function logRateLimitHit({ actionId, actor, requestId, key }) {
  logEvent({
    ts: new Date().toISOString(),
    level: "warning",
    severity: "WARNING",
    actionId,
    actor,
    target: { type: "ratelimit", id: key },
    result: "rate_limited",
    requestId,
    message: "RATE-LIMIT-HIT",
    meta: {
      code: "RATE-LIMIT-HIT",
    },
  });
}
