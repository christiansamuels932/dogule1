/* eslint-env node */
/* global process */
import { describe, expect, it, vi, beforeEach } from "vitest";

const baseAlert = {
  actionId: "auth.lockout",
  actor: { type: "system", id: "auth", role: null },
  target: { type: "user", id: "u1" },
  result: "alerted",
  requestId: "req-alert",
  message: "auth.lockout.alert",
  alertCode: "AUTH-LOCKOUT",
  throttleKey: "user:u1",
};

let alertsModule;

async function loadAlerts(env = "test") {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  vi.resetModules();
  alertsModule = await import("./alerts.js");
  process.env.NODE_ENV = previousEnv;
  return alertsModule.alertEvent;
}

describe("alertEvent", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("requires alertCode and throttleKey", async () => {
    const alertEvent = await loadAlerts("test");
    expect(() => alertEvent({ ...baseAlert, alertCode: undefined })).toThrow();
    expect(() => alertEvent({ ...baseAlert, throttleKey: undefined })).toThrow();
  });

  it("emits once and then throttles subsequent events for 5 minutes", async () => {
    const alertEvent = await loadAlerts("production");
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    alertEvent({ ...baseAlert, result: "error" });
    alertEvent({ ...baseAlert, result: "error" });
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(payload.level).toBe("alert");
    expect(payload.severity).toBe("ALERT");
    writeSpy.mockRestore();
  });

  it("emits once when requirements are met", async () => {
    const alertEvent = await loadAlerts("test");
    const writeSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    alertEvent({ ...baseAlert, result: "error" });
    expect(writeSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(payload.alertCode).toBe(baseAlert.alertCode);
    expect(payload.throttleKey).toBe(baseAlert.throttleKey);
    expect(payload.level).toBe("alert");
    expect(payload.severity).toBe("ALERT");
    writeSpy.mockRestore();
  });
});
