import { resolveAuthConfig } from "./config.js";
import { verifyPassword } from "./hash.js";
import { AUTH_ERROR_CODES, AuthError } from "./errors.js";
import { createSignedToken, verifySignedToken, nowMs, randomId } from "./tokens.js";
import { createUserStore, getSeedUsers } from "./users.js";

function noopAudit() {}

function buildAuditPayload({
  actionId,
  actorId,
  actorRole,
  target,
  result,
  before,
  after,
  context,
}) {
  return {
    actionId,
    actorId,
    actorRole,
    target,
    result,
    before,
    after,
    hashPrev: context?.hashPrev || null,
    hashIndex: context?.hashIndex ?? null,
    merkleRoot: context?.merkleRoot || null,
    requestId: context?.requestId || null,
    context: context?.context || null,
  };
}

export function createAuthService(options = {}) {
  const config = resolveAuthConfig(options.config || {});
  const userStore = options.userStore || createUserStore(getSeedUsers());
  const audit = options.audit || noopAudit;
  const sessionById = new Map();
  const revokedRefresh = new Set();
  const failures = new Map(); // username -> { attempts: number[], lockoutUntil: number|null }
  const clock = options.now || nowMs;

  function requireEnabled() {
    if (!config.enabled) {
      throw new AuthError(AUTH_ERROR_CODES.DISABLED, "Authentication is disabled");
    }
  }

  function recordFailure(username) {
    const now = clock();
    const info = failures.get(username) || { attempts: [], lockoutUntil: null };
    const windowStart = now - config.lockout.windowMs;
    const pruned = info.attempts.filter((ts) => ts > windowStart);
    pruned.push(now);
    info.attempts = pruned;
    if (pruned.length >= config.lockout.maxAttempts) {
      info.lockoutUntil = now + config.lockout.lockoutMs;
    }
    failures.set(username, info);
    return info;
  }

  function clearFailures(username) {
    failures.delete(username);
  }

  function isLocked(username) {
    const info = failures.get(username);
    if (!info?.lockoutUntil) return false;
    if (clock() < info.lockoutUntil) return true;
    failures.set(username, { attempts: [], lockoutUntil: null });
    return false;
  }

  async function issueTokens({ userId, role, sessionId }) {
    const now = clock();
    const accessPayload = {
      sub: userId,
      role,
      sid: sessionId,
      type: "access",
      exp: now + config.tokens.accessTtlMs,
      iat: now,
      jti: randomId(12),
    };
    const refreshPayload = {
      sub: userId,
      role,
      sid: sessionId,
      type: "refresh",
      exp: now + config.tokens.refreshTtlMs,
      iat: now,
      jti: randomId(12),
    };
    const accessToken = await createSignedToken(accessPayload, config.secrets.access);
    const refreshToken = await createSignedToken(refreshPayload, config.secrets.refresh);
    sessionById.set(sessionId, {
      userId,
      role,
      refreshJti: refreshPayload.jti,
      expiresAt: refreshPayload.exp,
    });
    return { accessToken, refreshToken, accessPayload, refreshPayload };
  }

  async function verifyAccessToken(token) {
    const payload = await verifySignedToken(token, config.secrets.access);
    if (payload.type !== "access")
      throw new AuthError(AUTH_ERROR_CODES.TOKEN_INVALID, "Invalid token type");
    if (payload.exp <= clock())
      throw new AuthError(AUTH_ERROR_CODES.TOKEN_EXPIRED, "Token expired");
    const session = sessionById.get(payload.sid);
    if (!session || session.userId !== payload.sub) {
      throw new AuthError(AUTH_ERROR_CODES.DENIED, "Session revoked or missing");
    }
    return payload;
  }

  async function verifyRefreshToken(token) {
    const payload = await verifySignedToken(token, config.secrets.refresh);
    if (payload.type !== "refresh")
      throw new AuthError(AUTH_ERROR_CODES.TOKEN_INVALID, "Invalid token type");
    if (payload.exp <= clock())
      throw new AuthError(AUTH_ERROR_CODES.TOKEN_EXPIRED, "Token expired");
    if (revokedRefresh.has(payload.jti))
      throw new AuthError(AUTH_ERROR_CODES.DENIED, "Refresh token revoked");
    const session = sessionById.get(payload.sid);
    if (!session || session.userId !== payload.sub || session.refreshJti !== payload.jti) {
      throw new AuthError(AUTH_ERROR_CODES.DENIED, "Session revoked");
    }
    return payload;
  }

  async function login(username, password, auditContext = {}) {
    requireEnabled();
    const user = userStore.getUserByUsername(username);
    if (isLocked(username)) {
      audit(
        buildAuditPayload({
          actionId: "auth.lockout",
          actorId: user?.id || username,
          actorRole: user?.role,
          target: { module: "auth", id: username },
          result: "denied",
          context: auditContext,
        })
      );
      throw new AuthError(AUTH_ERROR_CODES.LOCKED_OUT, "Account locked");
    }
    if (!user) {
      recordFailure(username);
      audit(
        buildAuditPayload({
          actionId: "auth.login",
          actorId: username,
          actorRole: "unknown",
          target: { module: "auth", id: username },
          result: "denied",
          context: auditContext,
        })
      );
      throw new AuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS, "Invalid credentials");
    }
    if (config.requireAdmin2fa && user.role === "admin" && !user.requires2fa) {
      recordFailure(username);
      audit(
        buildAuditPayload({
          actionId: "auth.login",
          actorId: user.id,
          actorRole: user.role,
          target: { module: "auth", id: user.id },
          result: "denied",
          context: auditContext,
        })
      );
      throw new AuthError(AUTH_ERROR_CODES.REQUIRE_2FA, "Admin requires 2FA");
    }
    const ok = await verifyPassword(password, user.passwordHash, config.hash);
    if (!ok) {
      const info = recordFailure(username);
      const locked = info.lockoutUntil && info.lockoutUntil > clock();
      audit(
        buildAuditPayload({
          actionId: "auth.login",
          actorId: user.id,
          actorRole: user.role,
          target: { module: "auth", id: user.id },
          result: "denied",
          context: auditContext,
        })
      );
      if (locked) {
        audit(
          buildAuditPayload({
            actionId: "auth.lockout",
            actorId: user.id,
            actorRole: user.role,
            target: { module: "auth", id: user.id },
            result: "denied",
            context: auditContext,
          })
        );
      }
      throw new AuthError(AUTH_ERROR_CODES.INVALID_CREDENTIALS, "Invalid credentials");
    }
    clearFailures(username);
    const sessionId = randomId(12);
    const tokens = await issueTokens({ userId: user.id, role: user.role, sessionId });
    audit(
      buildAuditPayload({
        actionId: "auth.login",
        actorId: user.id,
        actorRole: user.role,
        target: { module: "auth", id: user.id },
        result: "success",
        context: auditContext,
      })
    );
    return {
      user: { id: user.id, username: user.username, role: user.role },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.accessPayload.exp,
    };
  }

  async function refresh(refreshToken, auditContext = {}) {
    requireEnabled();
    const payload = await verifyRefreshToken(refreshToken);
    const user = userStore.getUserById(payload.sub);
    if (!user) throw new AuthError(AUTH_ERROR_CODES.DENIED, "User missing");
    revokedRefresh.add(payload.jti);
    const session = sessionById.get(payload.sid);
    if (!session) throw new AuthError(AUTH_ERROR_CODES.DENIED, "Session missing");
    const tokens = await issueTokens({ userId: user.id, role: user.role, sessionId: payload.sid });
    audit(
      buildAuditPayload({
        actionId: "auth.refresh",
        actorId: user.id,
        actorRole: user.role,
        target: { module: "auth", id: user.id },
        result: "success",
        context: auditContext,
      })
    );
    return {
      user: { id: user.id, username: user.username, role: user.role },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.accessPayload.exp,
    };
  }

  async function logout(refreshToken, auditContext = {}) {
    requireEnabled();
    if (!refreshToken) {
      throw new AuthError(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        "Refresh token required for logout"
      );
    }
    const payload = await verifyRefreshToken(refreshToken);
    revokedRefresh.add(payload.jti);
    sessionById.delete(payload.sid);
    const user = userStore.getUserById(payload.sub);
    audit(
      buildAuditPayload({
        actionId: "auth.logout",
        actorId: user?.id || payload.sub,
        actorRole: user?.role,
        target: { module: "auth", id: payload.sub },
        result: "success",
        context: auditContext,
      })
    );
    return true;
  }

  async function validateAccessToken(token, auditContext = {}) {
    requireEnabled();
    try {
      const payload = await verifyAccessToken(token);
      return payload;
    } catch (err) {
      audit(
        buildAuditPayload({
          actionId: "auth.denied",
          actorId: null,
          actorRole: null,
          target: { module: "auth", id: "access" },
          result: "denied",
          context: { ...auditContext, error: err?.code || err?.message },
        })
      );
      throw err;
    }
  }

  return {
    config,
    login,
    refresh,
    logout,
    validateAccessToken,
    _internal: { failures, sessionById, revokedRefresh },
  };
}
