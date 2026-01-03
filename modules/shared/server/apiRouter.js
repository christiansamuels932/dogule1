/* global process */
import { URL } from "node:url";
import path from "node:path";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { createGroupchatApiHandlers } from "../../kommunikation/groupchat/apiRoutes.js";
import { createInfochannelApiHandlers } from "../../kommunikation/infochannel/apiRoutes.js";
import { createCoreApiRouter } from "./coreApiRouter.js";
import { createAuthService } from "../auth/authService.js";
import { resolveAuthConfig } from "../auth/config.js";
import { createUserStore, getSeedUsers } from "../auth/users.js";
import { getKommunikationActions, isApiAllowed, normalizeRole } from "../auth/rbac.js";

function jsonResponse(res, statusCode, body) {
  res.statusCode = statusCode;
  if (typeof res.setHeader === "function") {
    res.setHeader("Content-Type", "application/json");
  }
  const payload = JSON.stringify(body);
  if (typeof res.end === "function") {
    res.end(payload);
  } else if (typeof res.send === "function") {
    res.send(payload);
  }
}

async function readJsonBody(req) {
  if (!req || req.method === "GET" || req.method === "HEAD") return {};
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function extractQuery(reqUrl) {
  const parsed = new URL(reqUrl, "http://localhost");
  return Object.fromEntries(parsed.searchParams.entries());
}

function buildActor(req) {
  const id = req.headers["x-dogule-actor-id"] || null;
  const role = req.headers["x-dogule-actor-role"] || null;
  return { id, role };
}

function buildAuthz(req) {
  const raw = req.headers["x-dogule-authz"];
  if (!raw) return null;
  if (raw === "*") return { allowedActions: ["*"] };
  const list = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length ? { allowedActions: list } : null;
}

function extractAccessToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization;
  if (header && typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice("bearer ".length).trim();
  }
  return req.headers?.["x-dogule-access-token"] || null;
}

function resolveRequestId(req) {
  const header =
    req.headers["x-request-id"] || req.headers["x-dogule-request-id"] || req.headers["x-trace-id"];
  if (header) return header;
  return crypto.randomUUID ? crypto.randomUUID() : `req-${Math.random().toString(36).slice(2)}`;
}

function buildReq(req, { body, params, query }) {
  const actor = buildActor(req);
  const authz = buildAuthz(req);
  return {
    ...req,
    body,
    params,
    query,
    actor,
    authz,
    id: resolveRequestId(req),
    resolveAuthz() {
      if (authz?.allowedActions) {
        return { allowedActions: authz.allowedActions };
      }
      return authz || null;
    },
  };
}

async function handleAuthRoutes(req, res, auth) {
  const reqUrl = req?.url || "";
  if (!reqUrl.startsWith("/api/auth")) return false;
  const body = await readJsonBody(req);
  const method = (req.method || "GET").toUpperCase();
  if (reqUrl === "/api/auth/login" && method === "POST") {
    try {
      const result = await auth.login(body.username || "", body.password || "", {
        requestId: resolveRequestId(req),
      });
      jsonResponse(res, 200, result);
    } catch (error) {
      jsonResponse(res, 401, { message: "invalid_credentials", code: error?.code });
    }
    return true;
  }
  if (reqUrl === "/api/auth/refresh" && method === "POST") {
    try {
      const result = await auth.refresh(body.refreshToken || "", {
        requestId: resolveRequestId(req),
      });
      jsonResponse(res, 200, result);
    } catch (error) {
      jsonResponse(res, 401, { message: "invalid_refresh", code: error?.code });
    }
    return true;
  }
  if (reqUrl === "/api/auth/logout" && method === "POST") {
    try {
      await auth.logout(body.refreshToken || "", { requestId: resolveRequestId(req) });
      jsonResponse(res, 200, { ok: true });
    } catch (error) {
      jsonResponse(res, 401, { message: "invalid_refresh", code: error?.code });
    }
    return true;
  }
  if (reqUrl === "/api/auth/me" && method === "GET") {
    try {
      const token = extractAccessToken(req);
      if (!token) {
        jsonResponse(res, 401, { message: "missing_token" });
        return true;
      }
      const payload = await auth.validateAccessToken(token, {
        requestId: resolveRequestId(req),
      });
      jsonResponse(res, 200, { user: { id: payload.sub, role: payload.role } });
    } catch (error) {
      jsonResponse(res, 401, { message: "invalid_token", code: error?.code });
    }
    return true;
  }
  jsonResponse(res, 404, { message: "not_found" });
  return true;
}

export function createKommunikationApiRouter(options = {}) {
  const storageRoot =
    options.storageRoot ||
    process.env.DOGULE1_STORAGE_ROOT ||
    path.resolve(process.cwd(), ".local", "storage");
  const salOptions = { mode: "real", paths: { root: storageRoot } };
  const groupchat = createGroupchatApiHandlers({
    ...(options.groupchat || {}),
    salOptions: { ...salOptions, ...(options.groupchat?.salOptions || {}) },
  });
  const infochannel = createInfochannelApiHandlers({
    ...(options.infochannel || {}),
    salOptions: { ...salOptions, ...(options.infochannel?.salOptions || {}) },
  });

  async function handle(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/kommunikation/")) return false;

    const query = extractQuery(reqUrl);
    const body = await readJsonBody(req);
    const path = reqUrl.split("?")[0];
    const method = (req.method || "GET").toUpperCase();

    if (path === "/api/kommunikation/groupchat/messages") {
      const handler =
        method === "POST" ? groupchat.handleSendMessage : groupchat.handleListMessages;
      await handler(buildReq(req, { body, params: {}, query }), res);
      return true;
    }
    if (path === "/api/kommunikation/groupchat/read-marker") {
      const handler =
        method === "POST" ? groupchat.handleSetReadMarker : groupchat.handleGetReadMarker;
      await handler(buildReq(req, { body, params: {}, query }), res);
      return true;
    }

    if (path === "/api/kommunikation/infochannel/notices") {
      const handler =
        method === "POST" ? infochannel.handleCreateNotice : infochannel.handleListNotices;
      await handler(buildReq(req, { body, params: {}, query }), res);
      return true;
    }
    if (path === "/api/kommunikation/infochannel/jobs/sla" && method === "POST") {
      await infochannel.handleRunSlaJob(buildReq(req, { body, params: {}, query }), res);
      return true;
    }
    const noticeMatch = path.match(/^\/api\/kommunikation\/infochannel\/notices\/([^/]+)$/);
    if (noticeMatch) {
      await infochannel.handleGetNotice(
        buildReq(req, { body, params: { id: noticeMatch[1] }, query }),
        res
      );
      return true;
    }
    const confirmMatch = path.match(
      /^\/api\/kommunikation\/infochannel\/notices\/([^/]+)\/confirm$/
    );
    if (confirmMatch && method === "POST") {
      await infochannel.handleConfirmNotice(
        buildReq(req, { body, params: { id: confirmMatch[1] }, query }),
        res
      );
      return true;
    }

    return false;
  }

  return { handle };
}

export function createApiRouter(options = {}) {
  if (process.env.DOGULE1_STORAGE_MODE !== "mariadb") {
    throw new Error("MARIADB_REQUIRED");
  }
  const authConfig = resolveAuthConfig({ enabled: true });
  const seedUsers = getSeedUsers();
  const userStore = options.userStore || createUserStore(seedUsers);
  const authService = createAuthService({ config: authConfig, userStore });
  const trainerSeed = seedUsers.find((user) => user.role === "trainer");
  const trainerPasswordHash = trainerSeed?.passwordHash || "";

  const buildTrainerUsername = (trainer) => {
    const email = String(trainer?.email || "")
      .trim()
      .toLowerCase();
    if (email && email.includes("@")) {
      return email.split("@")[0] || "";
    }
    const code = String(trainer?.code || "")
      .trim()
      .toLowerCase();
    if (code) return code.replace(/\s+/g, "-");
    const name = String(trainer?.name || "")
      .trim()
      .toLowerCase();
    if (name) return name.replace(/\s+/g, "-");
    return "";
  };

  const provisionTrainerLogin = (trainer) => {
    if (!trainer?.id || !trainerPasswordHash) return null;
    let base = buildTrainerUsername(trainer);
    if (!base) {
      base = `trainer-${trainer.id.slice(0, 6)}`;
    }
    let username = base;
    let suffix = 1;
    while (userStore.hasUser(username)) {
      suffix += 1;
      username = `${base}-${suffix}`;
    }
    const user = {
      id: `user-${trainer.id}`,
      username,
      role: "trainer",
      passwordHash: trainerPasswordHash,
      requires2fa: false,
    };
    if (!userStore.addUser(user)) return null;
    return { username, tempPassword: "trainerpass" };
  };

  const defaultAfterCreate = async ({ entity, record }) => {
    if (entity !== "trainer") return record;
    const login = provisionTrainerLogin(record);
    if (!login) return record;
    return { ...record, login };
  };

  const core = createCoreApiRouter({
    ...(options.core || {}),
    afterCreate: options.afterCreate || defaultAfterCreate,
  });
  const kommunikation = createKommunikationApiRouter(options.kommunikation || {});

  async function handle(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/")) return false;
    if (await handleAuthRoutes(req, res, authService)) return true;

    const token = extractAccessToken(req);
    if (!token) {
      jsonResponse(res, 401, { message: "missing_token" });
      return true;
    }
    let payload = null;
    try {
      payload = await authService.validateAccessToken(token, {
        requestId: resolveRequestId(req),
      });
    } catch (error) {
      jsonResponse(res, 401, { message: "invalid_token", code: error?.code });
      return true;
    }

    const role = normalizeRole(payload?.role);
    req.headers["x-dogule-actor-id"] = payload.sub;
    req.headers["x-dogule-actor-role"] = role;
    const allowedActions = getKommunikationActions(role);
    if (allowedActions.length) {
      req.headers["x-dogule-authz"] = allowedActions.includes("*") ? "*" : allowedActions.join(",");
    }

    const entityMatch = reqUrl.match(
      /^\/api\/(kunden|hunde|kurse|trainer|kalender|finanzen|waren)(?:\/|$)/
    );
    if (entityMatch) {
      const entity = entityMatch[1];
      const method = (req.method || "GET").toUpperCase();
      const action = method === "GET" || method === "HEAD" ? "read" : "write";
      if (!isApiAllowed(role, entity, action)) {
        jsonResponse(res, 403, { message: "forbidden" });
        return true;
      }
    }

    if (await core.handle(req, res)) return true;
    return kommunikation.handle(req, res);
  }

  return { handle, authService, userStore };
}

export { createCoreApiRouter };
