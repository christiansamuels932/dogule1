/* eslint-env node */
import { describe, expect, it, vi } from "vitest";
import { rateLimit } from "./limiter.js";

const actionId = "test.limit";
const key = "user:1";

describe("rateLimit", () => {
  it("allows within window until limit is reached", () => {
    const result1 = rateLimit({ actionId, key, limit: 2, windowMs: 1000 });
    const result2 = rateLimit({ actionId, key, limit: 2, windowMs: 1000 });
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(0);
    expect(result1.resetAt).toBe(result2.resetAt);
  });

  it("blocks after limit is exceeded", () => {
    rateLimit({ actionId, key: "user:2", limit: 1, windowMs: 1000 });
    const result = rateLimit({ actionId, key: "user:2", limit: 1, windowMs: 1000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window passes", () => {
    vi.useFakeTimers();
    const res1 = rateLimit({ actionId, key: "user:3", limit: 1, windowMs: 1000 });
    expect(res1.allowed).toBe(true);
    vi.advanceTimersByTime(1001);
    const res2 = rateLimit({ actionId, key: "user:3", limit: 1, windowMs: 1000 });
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(0);
    vi.useRealTimers();
  });

  it("returns deterministic resetAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    const res = rateLimit({ actionId, key: "user:4", limit: 1, windowMs: 5000 });
    expect(res.resetAt).toBe(new Date("2024-01-01T00:00:05.000Z").getTime());
    vi.useRealTimers();
  });
});
