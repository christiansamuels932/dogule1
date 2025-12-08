import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthService } from "./authService.js";
import { AUTH_ERROR_CODES } from "./errors.js";
import { getSeedUsers } from "./users.js";

const FIXED_NOW = Date.UTC(2025, 0, 1, 12, 0, 0);

function createAuditSpy() {
  const entries = [];
  const spy = (entry) => entries.push(entry);
  return { spy, entries };
}

function baseConfig(overrides = {}) {
  return {
    enabled: true,
    accessSecret: "test-access-secret",
    refreshSecret: "test-refresh-secret",
    requireAdmin2fa: false,
    ...overrides,
  };
}

describe("authService", () => {
  let audit;
  let service;
  let now;

  beforeEach(() => {
    audit = createAuditSpy();
    now = vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
    service = createAuthService({
      audit: audit.spy,
      config: baseConfig(),
    });
  });

  it("logs in with valid credentials and returns tokens", async () => {
    const result = await service.login("admin", "adminpass", { requestId: "req-1" });
    expect(result.user.role).toBe("admin");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(
      audit.entries.find((e) => e.actionId === "auth.login" && e.result === "success")
    ).toBeTruthy();
  });

  it("rejects invalid password and triggers lockout after threshold", async () => {
    const cfg = baseConfig({
      lockout: { maxAttempts: 3, windowMs: 5 * 60 * 1000, lockoutMs: 15 * 60 * 1000 },
    });
    service = createAuthService({ audit: audit.spy, config: cfg });
    await expect(service.login("admin", "wrong", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
    await expect(service.login("admin", "wrong", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
    await expect(service.login("admin", "wrong", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
    const lock = service._internal.failures.get("admin");
    expect(lock.lockoutUntil).toBeGreaterThan(FIXED_NOW);
    await expect(service.login("admin", "adminpass", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.LOCKED_OUT
    );
    expect(audit.entries.find((e) => e.actionId === "auth.lockout")).toBeTruthy();
  });

  it("refreshes tokens and revokes old refresh token", async () => {
    const login = await service.login("staff", "staffpass", {});
    const firstRefresh = await service.refresh(login.refreshToken, {});
    expect(firstRefresh.accessToken).not.toBe(login.accessToken);
    expect(firstRefresh.refreshToken).not.toBe(login.refreshToken);
    await expect(service.refresh(login.refreshToken, {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.DENIED
    );
  });

  it("logout revokes session", async () => {
    const login = await service.login("trainer", "trainerpass", {});
    const ok = await service.logout(login.refreshToken, {});
    expect(ok).toBe(true);
    await expect(service.refresh(login.refreshToken, {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.DENIED
    );
  });

  it("denies validateAccessToken for expired tokens", async () => {
    const login = await service.login("admin", "adminpass", {});
    now.mockReturnValue(FIXED_NOW + 16 * 60 * 1000); // beyond access ttl
    await expect(service.validateAccessToken(login.accessToken)).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.TOKEN_EXPIRED
    );
  });

  it("fails when auth is disabled", async () => {
    service = createAuthService({
      audit: audit.spy,
      config: { ...baseConfig(), enabled: false },
    });
    await expect(service.login("admin", "adminpass")).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.DISABLED
    );
  });

  it("enforces admin 2FA flag when required", async () => {
    service = createAuthService({
      audit: audit.spy,
      config: { ...baseConfig(), requireAdmin2fa: true },
      userStore: {
        getUserByUsername: () => ({ ...getSeedUsers()[0], role: "admin", requires2fa: false }),
        getUserById: () => ({ ...getSeedUsers()[0], role: "admin", requires2fa: false }),
      },
    });
    await expect(service.login("admin", "adminpass")).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.REQUIRE_2FA
    );
  });
});
