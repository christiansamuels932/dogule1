import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAuthService } from "./authService.js";
import { AUTH_ERROR_CODES } from "./errors.js";
import { createUserStore, getSeedUsers } from "./users.js";
import { resolveAuthConfig } from "./config.js";
import { hashPassword } from "./hash.js";

const FIXED_NOW = Date.UTC(2025, 0, 1, 12, 0, 0);
const PASSWORD = "testpass";

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

  beforeEach(async () => {
    audit = createAuditSpy();
    now = vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
    const userStore = createUserStore(getSeedUsers());
    const config = resolveAuthConfig(baseConfig());
    const developer = userStore.getUserByUsername("Developer");
    if (developer) {
      const passwordHash = await hashPassword(PASSWORD, config.hash);
      userStore.updateUser({ id: developer.id, passwordHash });
    }
    service = createAuthService({
      audit: audit.spy,
      config: baseConfig(),
      userStore,
    });
  });

  it("logs in with a valid user and returns tokens", async () => {
    const result = await service.login("Developer", PASSWORD, { requestId: "req-1" });
    expect(result.user.role).toBe("developer");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(
      audit.entries.find((e) => e.actionId === "auth.login" && e.result === "success")
    ).toBeTruthy();
  });

  it("rejects unknown users and triggers lockout after threshold", async () => {
    const cfg = baseConfig({
      lockout: { maxAttempts: 3, windowMs: 5 * 60 * 1000, lockoutMs: 15 * 60 * 1000 },
    });
    service = createAuthService({ audit: audit.spy, config: cfg });
    await expect(service.login("ghost", "", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
    await expect(service.login("ghost", "", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
    await expect(service.login("ghost", "", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.INVALID_CREDENTIALS
    );
    const lock = service._internal.failures.get("ghost");
    expect(lock.lockoutUntil).toBeGreaterThan(FIXED_NOW);
    await expect(service.login("ghost", "", {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.LOCKED_OUT
    );
    expect(audit.entries.find((e) => e.actionId === "auth.lockout")).toBeTruthy();
  });

  it("refreshes tokens and revokes old refresh token", async () => {
    const login = await service.login("Developer", PASSWORD, {});
    const firstRefresh = await service.refresh(login.refreshToken, {});
    expect(firstRefresh.accessToken).not.toBe(login.accessToken);
    expect(firstRefresh.refreshToken).not.toBe(login.refreshToken);
    await expect(service.refresh(login.refreshToken, {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.DENIED
    );
  });

  it("logout revokes session", async () => {
    const login = await service.login("Developer", PASSWORD, {});
    const ok = await service.logout(login.refreshToken, {});
    expect(ok).toBe(true);
    await expect(service.refresh(login.refreshToken, {})).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.DENIED
    );
  });

  it("denies validateAccessToken for expired tokens", async () => {
    const login = await service.login("Developer", PASSWORD, {});
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
    await expect(service.login("Developer", PASSWORD)).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.DISABLED
    );
  });

  it("enforces admin 2FA flag when required", async () => {
    const config = resolveAuthConfig(baseConfig());
    const passwordHash = await hashPassword("adminpass", config.hash);
    service = createAuthService({
      audit: audit.spy,
      config: { ...baseConfig(), requireAdmin2fa: true },
      userStore: {
        getUserByUsername: () => ({
          id: "user-admin",
          username: "Admin",
          role: "admin",
          requires2fa: false,
          passwordHash,
        }),
        getUserById: () => ({
          id: "user-admin",
          username: "Admin",
          role: "admin",
          requires2fa: false,
          passwordHash,
        }),
      },
    });
    await expect(service.login("Admin", "adminpass")).rejects.toHaveProperty(
      "code",
      AUTH_ERROR_CODES.REQUIRE_2FA
    );
  });
});
