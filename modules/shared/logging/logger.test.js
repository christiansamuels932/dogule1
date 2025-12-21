/* eslint-env node */
/* global process */
import { describe, expect, it, vi } from "vitest";

const baseEvent = {
  level: "info",
  actionId: "auth.login",
  actor: { type: "user", id: "u1", role: "admin" },
  target: { type: "session", id: "s1" },
  result: "success",
  requestId: "req-1",
  message: "auth.login.success",
};

async function loadLogger(env) {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  vi.resetModules();
  const mod = await import("./logger.js");
  return { logEvent: mod.logEvent, restoreEnv: () => (process.env.NODE_ENV = previousEnv) };
}

describe("logger", () => {
  it("emits one JSON line for a valid event", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const { logEvent, restoreEnv } = await loadLogger("test");
    logEvent({ ...baseEvent });
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(payload.message).toBe(baseEvent.message);
    expect(payload.severity).toBe("INFO");
    expect(payload.ts).toBeDefined();
    writeSpy.mockRestore();
    restoreEnv();
  });

  it("throws on schema violation in test env", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const { logEvent, restoreEnv } = await loadLogger("test");
    expect(() => logEvent({ message: "missing-required-fields" })).toThrow();
    expect(writeSpy).not.toHaveBeenCalled();
    writeSpy.mockRestore();
    restoreEnv();
  });

  it("emits one critical then drops subsequent invalid events in production", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const { logEvent, restoreEnv } = await loadLogger("production");
    logEvent({ message: "missing-required-fields" });
    logEvent({ message: "missing-required-fields" });
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(payload.message).toBe("LOG-SCHEMA-INVALID");
    expect(payload.level).toBe("critical");
    writeSpy.mockRestore();
    restoreEnv();
  });
});
