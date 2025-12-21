/* eslint-env node */
/* global process */
import { logEvent } from "./logger.js";

const throttleWindowMs = 5 * 60 * 1000;
const throttleCache = new Map(); // key -> timestamp ms

function nowMs() {
  return Date.now();
}

function makeThrottleKey(alertCode, throttleKey) {
  return `${alertCode}::${throttleKey}`;
}

export function alertEvent(event) {
  const env = process.env.NODE_ENV || "development";
  const alertCode = event?.alertCode;
  const throttleKey = event?.throttleKey;
  if (!alertCode || !throttleKey) {
    const err = new Error("alertCode and throttleKey are required for alerts");
    if (env === "production") return;
    throw err;
  }

  const key = makeThrottleKey(alertCode, throttleKey);
  const lastTs = throttleCache.get(key);
  const now = nowMs();
  if (lastTs && now - lastTs < throttleWindowMs) {
    return;
  }
  throttleCache.set(key, now);

  const payload = {
    ...event,
    level: "alert",
    severity: "ALERT",
  };

  logEvent(payload);
}
