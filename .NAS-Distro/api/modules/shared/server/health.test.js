/* eslint-env node */
import { describe, expect, it, vi } from "vitest";
import { createHealthHandlers } from "./health.js";

function createMockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: null,
    setHeader: vi.fn((key, value) => {
      res.headers[key] = value;
    }),
    end: vi.fn((payload) => {
      res.body = payload;
    }),
  };
  return res;
}

describe("health handlers", () => {
  it("/healthz always returns ok", () => {
    const { handleHealthz } = createHealthHandlers();
    const res = createMockRes();
    handleHealthz({}, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: "ok" });
  });

  it("/readyz returns ok when checks pass and does not log", () => {
    const logger = vi.fn();
    const readinessCheck = vi.fn(() => ({
      configLoaded: true,
      loggerReady: true,
      rateLimitReady: true,
    }));
    const { handleReadyz } = createHealthHandlers({ readinessCheck, logger });
    const res = createMockRes();
    handleReadyz({}, res);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: "ok" });
    expect(logger).not.toHaveBeenCalled();
  });

  it("/readyz returns not_ready and logs warning when checks fail", () => {
    const logger = vi.fn();
    const readinessCheck = vi.fn(() => ({
      configLoaded: true,
      loggerReady: false,
      rateLimitReady: true,
    }));
    const { handleReadyz } = createHealthHandlers({ readinessCheck, logger });
    const res = createMockRes();
    handleReadyz({ id: "req-1" }, res);
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body)).toEqual({ status: "not_ready" });
    expect(logger).toHaveBeenCalledTimes(1);
    const payload = logger.mock.calls[0][0];
    expect(payload.level).toBe("warning");
    expect(payload.actionId).toBe("system.health.readiness");
    expect(payload.result).toBe("error");
  });
});
