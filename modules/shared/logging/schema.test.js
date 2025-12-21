import { describe, expect, it } from "vitest";
import { validateLogEvent } from "./schema.js";

const baseEvent = {
  ts: "2024-12-20T12:00:00.000Z",
  level: "info",
  severity: "INFO",
  actionId: "auth.login",
  actor: { type: "user", id: "user-1", role: "admin" },
  target: { type: "session", id: "sess-1" },
  result: "success",
  requestId: "req-123",
  message: "auth.login.success",
  meta: { requestPath: "/login", limit: 5, windowSeconds: 60 },
};

const cloneEvent = () => JSON.parse(JSON.stringify(baseEvent));

describe("validateLogEvent", () => {
  it("accepts a valid event", () => {
    const { ok, errors } = validateLogEvent(cloneEvent());
    expect(ok).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("rejects when a required field is missing", () => {
    const event = cloneEvent();
    delete event.ts;
    const { ok, errors } = validateLogEvent(event);
    expect(ok).toBe(false);
    expect(errors.some((msg) => msg.includes("ts"))).toBe(true);
  });

  it("rejects an invalid enum value", () => {
    const event = cloneEvent();
    event.level = "notice";
    const { ok, errors } = validateLogEvent(event);
    expect(ok).toBe(false);
    expect(errors.some((msg) => msg.includes("level"))).toBe(true);
  });

  it("rejects wrong types", () => {
    const event = cloneEvent();
    event.actor.id = 123;
    const { ok, errors } = validateLogEvent(event);
    expect(ok).toBe(false);
    expect(errors.some((msg) => msg.includes("actor.id"))).toBe(true);
  });

  it("rejects meta with disallowed keys", () => {
    const event = cloneEvent();
    event.meta.unknown = "noop";
    const { ok, errors } = validateLogEvent(event);
    expect(ok).toBe(false);
    expect(errors.some((msg) => msg.includes("meta.unknown"))).toBe(true);
  });

  it("rejects meta values that exceed limits", () => {
    const event = cloneEvent();
    event.meta.requestPath = "x".repeat(201);
    const { ok, errors } = validateLogEvent(event);
    expect(ok).toBe(false);
    expect(errors.some((msg) => msg.includes("meta.requestPath"))).toBe(true);
  });
});
