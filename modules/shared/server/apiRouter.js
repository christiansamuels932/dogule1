/* global process */
import { URL } from "node:url";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { Buffer } from "node:buffer";
import { createGroupchatApiHandlers } from "../../kommunikation/groupchat/apiRoutes.js";
import { createInfochannelApiHandlers } from "../../kommunikation/infochannel/apiRoutes.js";
import { createAutomationApiHandlers } from "../../kommunikation/automation/apiRoutes.js";
import { createCoreApiRouter } from "./coreApiRouter.js";
import { createAuthService } from "../auth/authService.js";
import { resolveAuthConfig } from "../auth/config.js";
import { hashPassword } from "../auth/hash.js";
import { createUserStore, getSeedUsers } from "../auth/users.js";
import { getKommunikationActions, isApiAllowed, normalizeRole } from "../auth/rbac.js";
import { createStorage } from "../storage/storage.js";
import { uuidv7 } from "../utils/uuidv7.js";

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

const PASSWORD_FILE = process.env.DOGULE1_PASSWORD_FILE
  ? path.resolve(process.env.DOGULE1_PASSWORD_FILE)
  : path.join(process.cwd(), "config", "dogule1.passwords");
let passwordConfigLoaded = false;
let passwordConfigCache = null;

async function loadPasswordConfig() {
  if (passwordConfigLoaded) return passwordConfigCache;
  passwordConfigLoaded = true;
  const byUsername = new Map();
  try {
    const raw = await fs.readFile(PASSWORD_FILE, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = String(line || "").trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separatorIndex = trimmed.indexOf(":");
      if (separatorIndex <= 0) return;
      const username = trimmed.slice(0, separatorIndex).trim();
      const password = trimmed.slice(separatorIndex + 1).trim();
      if (!username || !password) return;
      byUsername.set(username, password);
    });
  } catch {
    passwordConfigCache = { byUsername };
    return passwordConfigCache;
  }
  passwordConfigCache = { byUsername };
  return passwordConfigCache;
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

async function handleAuthRoutes(req, res, auth, options = {}) {
  const reqUrl = req?.url || "";
  if (!reqUrl.startsWith("/api/auth")) return false;
  const body = await readJsonBody(req);
  const method = (req.method || "GET").toUpperCase();
  if (options.ensurePasswords) {
    try {
      await options.ensurePasswords({ requestId: resolveRequestId(req) });
    } catch {
      // Non-blocking: allow auth routes even if password seeding fails.
    }
  }
  if (reqUrl === "/api/auth/options" && method === "GET") {
    try {
      const result = options.listAuthOptions
        ? await options.listAuthOptions({ requestId: resolveRequestId(req) })
        : { users: [] };
      jsonResponse(res, 200, result);
    } catch {
      jsonResponse(res, 500, { message: "options_failed" });
    }
    return true;
  }
  if (reqUrl === "/api/auth/login" && method === "POST") {
    try {
      if (options.ensureTrainerUsers) {
        try {
          await options.ensureTrainerUsers({ requestId: resolveRequestId(req) });
        } catch {
          // Non-blocking: allow login even if trainer sync fails.
        }
      }
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
  const automation = createAutomationApiHandlers({
    ...(options.automation || {}),
    salOptions: { ...salOptions, ...(options.automation?.salOptions || {}) },
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
    const noticeMatch = path.match(/^\/api\/kommunikation\/infochannel\/notices\/([^/]+)$/);
    if (noticeMatch) {
      const params = { id: noticeMatch[1] };
      if (method === "DELETE") {
        await infochannel.handleDeleteNotice(buildReq(req, { body, params, query }), res);
        return true;
      }
      await infochannel.handleGetNotice(buildReq(req, { body, params, query }), res);
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

    if (path === "/api/kommunikation/automation/settings") {
      const handler =
        method === "PATCH" ? automation.handleUpdateSettings : automation.handleGetSettings;
      await handler(buildReq(req, { body, params: {}, query }), res);
      return true;
    }
    if (path === "/api/kommunikation/automation/settings/test" && method === "POST") {
      await automation.handleTestConnection(buildReq(req, { body, params: {}, query }), res);
      return true;
    }
    if (path === "/api/kommunikation/automation/events") {
      const handler =
        method === "POST" ? automation.handleRecordEvent : automation.handleListEvents;
      await handler(buildReq(req, { body, params: {}, query }), res);
      return true;
    }
    const eventMatch = path.match(/^\/api\/kommunikation\/automation\/events\/([^/]+)$/);
    if (eventMatch && method === "PATCH") {
      await automation.handleUpdateEvent(
        buildReq(req, { body, params: { id: eventMatch[1] }, query }),
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
  const isNasRuntime = process.cwd().startsWith("/volume1/");
  const schulungenUploadRoot =
    process.env.DOGULE1_SCHULUNGEN_UPLOAD_ROOT ||
    path.resolve(process.cwd(), "uploads", "schulungen");
  const authConfig = resolveAuthConfig({
    enabled: true,
    allowLocalPasswordless: !isNasRuntime,
  });
  const seedUsers = getSeedUsers();
  const userStore = options.userStore || createUserStore(seedUsers);
  const authService = createAuthService({ config: authConfig, userStore });
  const storage =
    options.storage ||
    createStorage({
      mode: options.mode || "mariadb",
      ...options.storageOptions,
    });
  const adminTrainerCode = "TR-001";
  const adminTrainerName = "Fontana Richard";
  let passwordSeeded = false;

  const locks = new Map();
  async function withKeyLock(key, fn) {
    const previous = locks.get(key) || Promise.resolve();
    let release = null;
    const current = new Promise((resolve) => {
      release = resolve;
    });
    const chain = previous.then(() => current);
    locks.set(key, chain);
    await previous;
    try {
      return await fn();
    } finally {
      release?.();
      if (locks.get(key) === chain) {
        locks.delete(key);
      }
    }
  }

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

  const resolveTrainerRole = (trainer) => {
    const code = String(trainer?.code || "")
      .trim()
      .toUpperCase();
    const name = String(trainer?.name || "")
      .trim()
      .toLowerCase();
    if (code === adminTrainerCode || name === adminTrainerName.toLowerCase()) {
      return "admin";
    }
    return "trainer_rapport";
  };

  async function isRichardActor(actorId) {
    const trainerId = resolveTrainerIdFromActorId(actorId);
    if (!trainerId) return false;
    try {
      const trainer = await storage.trainer.get(trainerId);
      const code = String(trainer?.code || "")
        .trim()
        .toUpperCase();
      const name = String(trainer?.name || "")
        .trim()
        .toLowerCase();
      return code === adminTrainerCode || name === adminTrainerName.toLowerCase();
    } catch {
      return false;
    }
  }

  const ensurePasswordsSeeded = async () => {
    if (passwordSeeded) return;
    const config = await loadPasswordConfig();
    if (!config) {
      passwordSeeded = true;
      return;
    }
    const updates = [];
    config.byUsername.forEach((password, username) => {
      const user = userStore.getUserByUsername(username);
      if (!user) return;
      updates.push(
        hashPassword(password, authConfig.hash)
          .then((passwordHash) => {
            userStore.updateUser({ id: user.id, passwordHash });
          })
          .catch(() => {})
      );
    });
    await Promise.all(updates);
    passwordSeeded = true;
  };

  const applyTrainerPassword = async (user) => {
    if (!user) return user;
    const config = await loadPasswordConfig();
    const password = config?.byUsername?.get(user.username);
    if (!password) return user;
    try {
      const passwordHash = await hashPassword(password, authConfig.hash);
      userStore.updateUser({ id: user.id, passwordHash });
      return userStore.getUserById(user.id) || user;
    } catch {
      return user;
    }
  };

  const ensureTrainerUser = async (trainer) => {
    if (!trainer?.id) return null;
    const userId = `user-${trainer.id}`;
    const existing = userStore.getUserById(userId);
    if (existing) {
      await ensurePasswordsSeeded();
      return applyTrainerPassword(existing);
    }
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
      id: userId,
      username,
      role: resolveTrainerRole(trainer),
      passwordHash: "",
      requires2fa: false,
    };
    if (!userStore.addUser(user)) return null;
    await ensurePasswordsSeeded();
    return applyTrainerPassword(user);
  };

  const ensureTrainerUsers = async () => {
    if (!storage?.trainer?.list) return [];
    await ensurePasswordsSeeded();
    const trainers = await storage.trainer.list();
    const users = await Promise.all(trainers.map((trainer) => ensureTrainerUser(trainer)));
    return users.filter(Boolean);
  };

  const listAuthOptions = async () => {
    await ensurePasswordsSeeded();
    const trainers = await storage.trainer.list();
    const optionsList = [];
    const seen = new Set();
    const developerUser = userStore.getUserByUsername("Developer");
    const passwordlessUsers = [];
    if (developerUser) {
      optionsList.push({
        id: developerUser.id,
        username: developerUser.username,
        label: "Developer",
        role: developerUser.role,
      });
      seen.add(developerUser.username);
    }

    const trainerOptions = (
      await Promise.all(
        trainers.map(async (trainer) => {
          const user = await ensureTrainerUser(trainer);
          if (!user || seen.has(user.username)) return null;
          const name = String(trainer?.name || "").trim();
          const code = String(trainer?.code || "").trim();
          const baseLabel = code && name ? `${name} (${code})` : name || code || user.username;
          const suffix = user.role === "trainer_rapport" ? " - Rapport" : "";
          const label = `${baseLabel}${suffix}`;
          seen.add(user.username);
          return {
            id: user.id,
            username: user.username,
            label,
            role: user.role,
          };
        })
      )
    )
      .filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label, "de"));

    optionsList.push(...trainerOptions);
    if (authConfig.allowLocalPasswordless) {
      passwordlessUsers.push(...optionsList.map((user) => user.username).filter(Boolean));
    }
    return { users: optionsList, passwordlessUsers };
  };

  const defaultAfterCreate = async ({ entity, record }) => {
    if (entity !== "trainer") return record;
    const user = await ensureTrainerUser(record);
    if (!user) return record;
    return { ...record, login: { username: user.username } };
  };

  const core = createCoreApiRouter({
    ...(options.core || {}),
    storage,
    afterCreate: options.afterCreate || defaultAfterCreate,
  });
  const kommunikation = createKommunikationApiRouter({
    ...(options.kommunikation || {}),
    infochannel: {
      ...(options.kommunikation?.infochannel || {}),
      salOptions: {
        ...(options.kommunikation?.infochannel?.salOptions || {}),
        listTrainers: async () => storage.trainer.list(),
      },
    },
  });

  async function handleHistorieRoutes(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/historie")) return false;

    const query = extractQuery(reqUrl);
    const body = await readJsonBody(req);
    const path = reqUrl.split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    const requestId = resolveRequestId(req);

    if (path === "/api/historie" && method === "GET") {
      try {
        const entries = await storage.historie.list({ query, requestId });
        jsonResponse(res, 200, entries);
      } catch {
        jsonResponse(res, 500, { message: "historie_list_failed" });
      }
      return true;
    }

    if (path === "/api/historie" && method === "POST") {
      try {
        const actorId = req.headers["x-dogule-actor-id"] || "";
        const actorRole = req.headers["x-dogule-actor-role"] || "";
        const created = await storage.historie.create(
          {
            entityType: body.entityType,
            entityId: body.entityId,
            occurredAt: body.occurredAt,
            authorId: actorId,
            authorRole: actorRole,
            text: body.text,
          },
          { requestId }
        );
        jsonResponse(res, 201, created);
      } catch (error) {
        jsonResponse(res, 400, { message: "historie_create_failed", code: error?.code });
      }
      return true;
    }

    const entryMatch = path.match(/^\/api\/historie\/([^/]+)$/);
    if (entryMatch) {
      const id = entryMatch[1];
      if (method === "GET") {
        try {
          const entry = await storage.historie.get(id, { requestId });
          jsonResponse(res, 200, entry);
        } catch (error) {
          jsonResponse(res, error?.code === "NOT_FOUND" ? 404 : 500, { message: "not_found" });
        }
        return true;
      }
      if (method === "PATCH" || method === "PUT") {
        try {
          const updated = await storage.historie.update({ id, data: body }, { requestId });
          if (!updated) {
            jsonResponse(res, 404, { message: "not_found" });
            return true;
          }
          jsonResponse(res, 200, updated);
        } catch (error) {
          jsonResponse(res, 400, { message: "historie_update_failed", code: error?.code });
        }
        return true;
      }
      if (method === "DELETE") {
        try {
          const result = await storage.historie.delete(id, { requestId });
          jsonResponse(res, 200, result);
        } catch (error) {
          jsonResponse(res, 400, { message: "historie_delete_failed", code: error?.code });
        }
        return true;
      }
    }

    jsonResponse(res, 404, { message: "not_found" });
    return true;
  }

  async function handleKursTeilnehmerRoutes(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/kurse/")) return false;
    const path = reqUrl.split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    const requestId = resolveRequestId(req);
    const listMatch = path.match(/^\/api\/kurse\/([^/]+)\/teilnehmer\/?$/);
    if (listMatch) {
      const kursId = listMatch[1];
      if (!storage.kursTeilnehmer) {
        jsonResponse(res, 501, { message: "kurs_teilnehmer_unavailable" });
        return true;
      }
      if (method === "GET") {
        try {
          const entries = await storage.kursTeilnehmer.list({
            query: { kursId },
            requestId,
          });
          jsonResponse(res, 200, entries);
        } catch {
          jsonResponse(res, 500, { message: "kurs_teilnehmer_list_failed" });
        }
        return true;
      }
      if (method === "POST") {
        const body = await readJsonBody(req);
        try {
          const actorId = req.headers["x-dogule-actor-id"] || "";
          const createdByRaw = actorId || body.createdBy || "";
          const createdBy = String(createdByRaw || "").slice(0, 255);
          const created = await storage.kursTeilnehmer.create(
            {
              kursId,
              kundeId: body.kundeId,
              hundId: body.hundId,
              kundeNachname: body.kundeNachname,
              kundeVorname: body.kundeVorname,
              kundeOrt: body.kundeOrt,
              hundName: body.hundName,
              startDatum: body.startDatum,
              createdBy,
            },
            { requestId }
          );
          jsonResponse(res, 201, created);
        } catch (error) {
          console.error("[KURSE_TEILNEHMER_CREATE_FAILED]", error);
          jsonResponse(res, 400, {
            message: "kurs_teilnehmer_create_failed",
            code: error?.code,
            detail: error?.message,
          });
        }
        return true;
      }
    }
    const deleteMatch = path.match(/^\/api\/kurse\/([^/]+)\/teilnehmer\/([^/]+)$/);
    if (deleteMatch && method === "DELETE") {
      if (!storage.kursTeilnehmer) {
        jsonResponse(res, 501, { message: "kurs_teilnehmer_unavailable" });
        return true;
      }
      const id = deleteMatch[2];
      try {
        const result = await storage.kursTeilnehmer.delete(id, { requestId });
        jsonResponse(res, 200, result);
      } catch (error) {
        jsonResponse(res, 500, { message: "kurs_teilnehmer_delete_failed", code: error?.code });
      }
      return true;
    }
    return false;
  }

  function contentTypeForUpload(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".png") return "image/png";
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".gif") return "image/gif";
    if (ext === ".webp") return "image/webp";
    return "application/octet-stream";
  }

  function buildUploadFileName(mimeType) {
    const ext = mimeType.split("/")[1] || "";
    const safeExt = ext.replace(/[^a-z0-9]+/gi, "").toLowerCase();
    return safeExt ? `${uuidv7()}.${safeExt}` : `${uuidv7()}`;
  }

  function parseDataUrl(dataUrl = "") {
    const match = String(dataUrl).match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!match) return null;
    return { mime: match[1].toLowerCase(), data: match[2] };
  }

  async function handleSchulungenRoutes(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/schulungen")) return false;

    const body = await readJsonBody(req);
    const pathOnly = reqUrl.split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    const requestId = resolveRequestId(req);
    const actorId = req.headers["x-dogule-actor-id"] || "";

    if (pathOnly === "/api/schulungen/uploads" && method === "POST") {
      if (!(await isRichardActor(actorId))) {
        jsonResponse(res, 403, { message: "forbidden" });
        return true;
      }
      const payload = parseDataUrl(body?.dataUrl || "");
      if (!payload) {
        jsonResponse(res, 400, { message: "invalid_image" });
        return true;
      }
      const fileName = buildUploadFileName(payload.mime);
      const targetPath = path.join(schulungenUploadRoot, fileName);
      try {
        await fs.mkdir(schulungenUploadRoot, { recursive: true });
        await fs.writeFile(targetPath, Buffer.from(payload.data, "base64"));
        jsonResponse(res, 201, { url: `/api/schulungen/uploads/${fileName}`, name: fileName });
      } catch (error) {
        jsonResponse(res, 500, { message: "upload_failed", code: error?.code });
      }
      return true;
    }

    if (pathOnly.startsWith("/api/schulungen/uploads/") && method === "GET") {
      const fileName = pathOnly.replace("/api/schulungen/uploads/", "");
      if (!fileName || fileName.includes("..") || fileName.includes("/")) {
        jsonResponse(res, 400, { message: "invalid_file" });
        return true;
      }
      const filePath = path.join(schulungenUploadRoot, fileName);
      try {
        const data = await fs.readFile(filePath);
        res.statusCode = 200;
        res.setHeader("Content-Type", contentTypeForUpload(filePath));
        res.end(data);
      } catch {
        jsonResponse(res, 404, { message: "not_found" });
      }
      return true;
    }

    if (pathOnly === "/api/schulungen" && method === "GET") {
      try {
        const entries = await storage.schulungen.list({ requestId });
        jsonResponse(res, 200, entries);
      } catch (error) {
        jsonResponse(res, 500, { message: "schulungen_list_failed", code: error?.code });
      }
      return true;
    }

    if (pathOnly === "/api/schulungen" && method === "POST") {
      if (!(await isRichardActor(actorId))) {
        jsonResponse(res, 403, { message: "forbidden" });
        return true;
      }
      try {
        const created = await storage.schulungen.create(body, { requestId });
        jsonResponse(res, 201, created);
      } catch (error) {
        jsonResponse(res, 400, { message: "schulungen_create_failed", code: error?.code });
      }
      return true;
    }

    const entryMatch = pathOnly.match(/^\/api\/schulungen\/([^/]+)$/);
    if (entryMatch && method === "GET") {
      try {
        const entry = await storage.schulungen.get(entryMatch[1], { requestId });
        jsonResponse(res, 200, entry);
      } catch (error) {
        jsonResponse(res, 404, { message: "not_found", code: error?.code });
      }
      return true;
    }
    if (entryMatch && method === "DELETE") {
      if (!(await isRichardActor(actorId))) {
        jsonResponse(res, 403, { message: "forbidden" });
        return true;
      }
      try {
        const result = await storage.schulungen.delete(entryMatch[1], { requestId });
        jsonResponse(res, 200, result);
      } catch (error) {
        jsonResponse(res, 400, { message: "schulungen_delete_failed", code: error?.code });
      }
      return true;
    }

    jsonResponse(res, 404, { message: "not_found" });
    return true;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function todayKeyLocal() {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  }

  function todayDdMmYyyyLocal() {
    const now = new Date();
    return `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  function extractDayMonth(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const ddmmyyyy = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ddmmyyyy) return { day: ddmmyyyy[1], month: ddmmyyyy[2] };
    const ddmm = raw.match(/^(\d{2})\.(\d{2})$/);
    if (ddmm) return { day: ddmm[1], month: ddmm[2] };
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return { day: iso[3], month: iso[2] };
    const slash = raw.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);
    if (slash) return { day: slash[1], month: slash[2] };
    return null;
  }

  function dayMonthKey(value) {
    const parsed = extractDayMonth(value);
    if (!parsed) return "";
    return `${parsed.day}.${parsed.month}`;
  }

  async function handleDashboardRoutes(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/dashboard/")) return false;

    const query = extractQuery(reqUrl);
    const body = await readJsonBody(req);
    const path = reqUrl.split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    const requestId = resolveRequestId(req);

    if (path === "/api/dashboard/birthdays" && method === "GET") {
      try {
        const day = todayKeyLocal();
        const today = dayMonthKey(todayDdMmYyyyLocal());
        const handled = await storage.dashboardBirthdays.listHandled(day, { requestId });
        const handledKeys = new Set(
          (handled || []).map((entry) => `${entry.entityType}:${entry.entityId}`)
        );

        const [kunden, hunde] = await Promise.all([
          storage.kunden.list({ query, requestId }),
          storage.hunde.list({ query, requestId }),
        ]);

        const kundenById = new Map((kunden || []).map((kunde) => [kunde.id, kunde]));

        const kundenToday = (kunden || [])
          .filter((kunde) => dayMonthKey(kunde.geburtsdatum) === today)
          .filter((kunde) => !handledKeys.has(`kunden:${kunde.id}`))
          .map((kunde) => ({
            id: kunde.id,
            vorname: kunde.vorname,
            nachname: kunde.nachname,
            email: kunde.email,
            geburtsdatum: kunde.geburtsdatum,
            status: kunde.status,
          }));

        const hundeToday = (hunde || [])
          .filter((hund) => dayMonthKey(hund.geburtsdatum) === today)
          .filter((hund) => !handledKeys.has(`hunde:${hund.id}`))
          .map((hund) => {
            const kunde = hund.kundenId ? kundenById.get(hund.kundenId) : null;
            return {
              id: hund.id,
              name: hund.name,
              rufname: hund.rufname,
              geburtsdatum: hund.geburtsdatum,
              status: hund.status,
              kundenId: hund.kundenId,
              kunde: kunde
                ? {
                    id: kunde.id,
                    vorname: kunde.vorname,
                    nachname: kunde.nachname,
                    email: kunde.email,
                    status: kunde.status,
                  }
                : null,
            };
          })
          .filter((entry) => Boolean(entry.kundenId));

        jsonResponse(res, 200, { day, kunden: kundenToday, hunde: hundeToday });
      } catch (error) {
        jsonResponse(res, 500, { message: "dashboard_birthdays_failed", code: error?.code });
      }
      return true;
    }

    if (path === "/api/dashboard/birthdays/handle" && method === "POST") {
      await withKeyLock(
        `dashboard:birthdays:${todayKeyLocal()}:${body?.entityType}:${body?.entityId}`,
        async () => {
          try {
            const entityType = String(body.entityType || "").trim();
            const entityId = String(body.entityId || "").trim();
            const action = String(body.action || "").trim();
            if (!entityType || !entityId || !action) {
              jsonResponse(res, 400, { message: "invalid_payload" });
              return;
            }
            if (!["kunden", "hunde"].includes(entityType)) {
              jsonResponse(res, 400, { message: "invalid_entity" });
              return;
            }
            if (!["dismissed", "mailto_prepared"].includes(action)) {
              jsonResponse(res, 400, { message: "invalid_action" });
              return;
            }

            const day = todayKeyLocal();
            const handled = await storage.dashboardBirthdays.listHandled(day, { requestId });
            const alreadyHandled = (handled || []).some(
              (entry) => entry.entityType === entityType && entry.entityId === entityId
            );
            if (alreadyHandled) {
              jsonResponse(res, 200, { ok: true, already: true });
              return;
            }

            const actorId = req.headers["x-dogule-actor-id"] || "";
            const actorRole = req.headers["x-dogule-actor-role"] || "";

            const todayLabel = todayDdMmYyyyLocal();
            const actionLabel = action === "dismissed" ? "Verworfen" : "E-Mail vorbereitet";

            let kundeId = null;
            let subjectName = "";
            if (entityType === "kunden") {
              const kunde = await storage.kunden.get(entityId, { requestId });
              if (action === "mailto_prepared" && !String(kunde.email || "").trim()) {
                jsonResponse(res, 400, { message: "missing_email" });
                return;
              }
              kundeId = kunde.id;
              subjectName = [kunde.vorname, kunde.nachname].filter(Boolean).join(" ").trim();
            } else {
              const hund = await storage.hunde.get(entityId, { requestId });
              if (!hund?.kundenId) {
                jsonResponse(res, 400, { message: "kunde_required" });
                return;
              }
              kundeId = hund.kundenId;
              subjectName = hund.name || hund.rufname || hund.id;
              if (action === "mailto_prepared") {
                const kunde = await storage.kunden.get(kundeId, { requestId });
                if (!String(kunde?.email || "").trim()) {
                  jsonResponse(res, 400, { message: "missing_email" });
                  return;
                }
              }
            }

            const labelPrefix = entityType === "kunden" ? "Geburtstag Kunde" : "Wurftag Hund";
            const text = `${labelPrefix} ${subjectName} – ${actionLabel} – ${todayLabel}`;
            await storage.historie.create(
              {
                entityType: "kunden",
                entityId: kundeId,
                occurredAt: new Date().toISOString(),
                authorId: actorId,
                authorRole: actorRole,
                text,
              },
              { requestId }
            );

            await storage.dashboardBirthdays.upsertHandled(
              { day, entityType, entityId, action, authorId: actorId, authorRole: actorRole },
              { requestId }
            );

            jsonResponse(res, 200, { ok: true });
          } catch (error) {
            jsonResponse(res, 400, {
              message: "dashboard_birthdays_handle_failed",
              code: error?.code,
            });
          }
        }
      );
      return true;
    }

    jsonResponse(res, 404, { message: "not_found" });
    return true;
  }

  async function handleAnmeldungRoutes(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/anmeldung/")) return false;

    const query = extractQuery(reqUrl);
    const body = await readJsonBody(req);
    const path = reqUrl.split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    const requestId = resolveRequestId(req);

    if (path === "/api/anmeldung/drafts") {
      if (method === "GET") {
        try {
          const drafts = await storage.anmeldung.list({ query, requestId });
          jsonResponse(res, 200, drafts);
        } catch (error) {
          jsonResponse(res, 500, { message: "anmeldung_list_failed", code: error?.code });
        }
        return true;
      }
      if (method === "POST") {
        try {
          const created = await storage.anmeldung.create(body, { requestId });
          jsonResponse(res, 201, created);
        } catch (error) {
          jsonResponse(res, 400, { message: "anmeldung_create_failed", code: error?.code });
        }
        return true;
      }
    }

    const draftMatch = path.match(/^\/api\/anmeldung\/drafts\/([^/]+)$/);
    if (draftMatch) {
      const id = draftMatch[1];
      if (method === "GET") {
        try {
          const record = await storage.anmeldung.get(id, { requestId });
          jsonResponse(res, 200, record);
        } catch (error) {
          jsonResponse(res, error?.code === "NOT_FOUND" ? 404 : 500, { message: "not_found" });
        }
        return true;
      }
      if (method === "PUT" || method === "PATCH") {
        try {
          const updated = await storage.anmeldung.update({ id, data: body }, { requestId });
          if (!updated) {
            jsonResponse(res, 404, { message: "not_found" });
            return true;
          }
          jsonResponse(res, 200, updated);
        } catch (error) {
          jsonResponse(res, 400, { message: "anmeldung_update_failed", code: error?.code });
        }
        return true;
      }
      if (method === "DELETE") {
        try {
          const result = await storage.anmeldung.delete(id, { requestId });
          jsonResponse(res, 200, result);
        } catch {
          jsonResponse(res, 500, { message: "anmeldung_delete_failed" });
        }
        return true;
      }
    }

    const kundeMatch = path.match(/^\/api\/anmeldung\/drafts\/([^/]+)\/kunde$/);
    if (kundeMatch && method === "POST") {
      const draftId = kundeMatch[1];
      await withKeyLock(`anmeldung:kunde:${draftId}`, async () => {
        try {
          const draft = await storage.anmeldung.get(draftId, { requestId });
          if (draft?.kundeId) {
            const kunde = await storage.kunden.get(draft.kundeId, { requestId });
            jsonResponse(res, 200, { draft, kunde });
            return;
          }
          if (!draft?.hundPayload) {
            jsonResponse(res, 400, { message: "hund_required" });
            return;
          }
          if (!draft?.kursId) {
            jsonResponse(res, 400, { message: "kurs_required" });
            return;
          }
          const kundePayload = draft.kundePayload || {};
          const kunde = await storage.kunden.create(kundePayload, { requestId });
          const updatedDraft = await storage.anmeldung.update(
            {
              id: draftId,
              data: {
                status: "kunde_created",
                kundeId: kunde.id,
                kursTitle: draft.kursTitle || "",
              },
            },
            { requestId }
          );
          jsonResponse(res, 200, { draft: updatedDraft, kunde });
        } catch (error) {
          jsonResponse(res, 400, { message: "kunde_create_failed", code: error?.code });
        }
      });
      return true;
    }

    const hundMatch = path.match(/^\/api\/anmeldung\/drafts\/([^/]+)\/hund$/);
    if (hundMatch && method === "POST") {
      const draftId = hundMatch[1];
      await withKeyLock(`anmeldung:hund:${draftId}`, async () => {
        try {
          const draft = await storage.anmeldung.get(draftId, { requestId });
          if (!draft?.kundeId) {
            jsonResponse(res, 400, { message: "kunde_required" });
            return;
          }
          if (!draft?.kursId) {
            jsonResponse(res, 400, { message: "kurs_required" });
            return;
          }
          if (draft?.hundId) {
            jsonResponse(res, 200, { ok: true, kundeId: draft.kundeId, hundId: draft.hundId });
            try {
              await storage.anmeldung.delete(draftId, { requestId });
            } catch {
              // non-blocking
            }
            return;
          }

          const hundPayload = { ...(draft.hundPayload || {}), kundenId: draft.kundeId };
          const hund = await storage.hunde.create(hundPayload, { requestId });

          await storage.anmeldung.update(
            { id: draftId, data: { status: "completed", hundId: hund.id } },
            { requestId }
          );

          const actorId = req.headers["x-dogule-actor-id"] || "";
          const actorRole = req.headers["x-dogule-actor-role"] || "";
          const kursTitle = draft.kursTitle || "";
          const now = new Date();
          const today = `${String(now.getDate()).padStart(2, "0")}.${String(
            now.getMonth() + 1
          ).padStart(2, "0")}.${now.getFullYear()}`;
          const titlePart = kursTitle ? ` "${kursTitle}"` : "";
          const text = `Neue Anmeldung für den Kurs${titlePart} – ${today}`;

          try {
            await storage.historie.create(
              {
                entityType: "kunden",
                entityId: draft.kundeId,
                occurredAt: new Date().toISOString(),
                authorId: actorId,
                authorRole: actorRole,
                text,
              },
              { requestId }
            );
          } catch {
            // non-blocking
          }
          try {
            await storage.historie.create(
              {
                entityType: "hunde",
                entityId: hund.id,
                occurredAt: new Date().toISOString(),
                authorId: actorId,
                authorRole: actorRole,
                text,
              },
              { requestId }
            );
          } catch {
            // non-blocking
          }

          try {
            await storage.anmeldung.delete(draftId, { requestId });
          } catch {
            // non-blocking
          }

          jsonResponse(res, 200, { ok: true, kundeId: draft.kundeId, hundId: hund.id });
        } catch (error) {
          jsonResponse(res, 400, { message: "hund_create_failed", code: error?.code });
        }
      });
      return true;
    }

    jsonResponse(res, 404, { message: "not_found" });
    return true;
  }

  function extractFirstName(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw.split(/\s+/)[0] || "";
  }

  function resolveTrainerIdFromActorId(actorId) {
    const raw = String(actorId || "").trim();
    if (!raw) return "";
    return raw.startsWith("user-") ? raw.slice(5) : raw;
  }

  async function handleRapporteRoutes(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/rapporte/")) return false;

    const query = extractQuery(reqUrl);
    const body = await readJsonBody(req);
    const path = reqUrl.split("?")[0];
    const method = (req.method || "GET").toUpperCase();
    const requestId = resolveRequestId(req);
    const actorId = req.headers["x-dogule-actor-id"] || "";
    const actorRole = normalizeRole(req.headers["x-dogule-actor-role"] || "");
    const isRapportTrainer = actorRole === "trainer" || actorRole === "trainer_rapport";

    if (path === "/api/rapporte/drafts") {
      if (method === "GET") {
        try {
          const listQuery = isRapportTrainer ? { ...query, authorId: actorId } : { ...query };
          const drafts = await storage.rapporteDrafts.list({ query: listQuery, requestId });
          jsonResponse(res, 200, drafts);
        } catch (error) {
          jsonResponse(res, 500, { message: "rapporte_list_failed", code: error?.code });
        }
        return true;
      }
      if (method === "POST") {
        try {
          const targetType = String(body?.targetType || body?.target_type || "").trim();
          const targetId = String(body?.targetId || body?.target_id || "").trim();
          if (!targetType || !targetId) {
            jsonResponse(res, 400, { message: "target_required" });
            return true;
          }
          let kundeId = String(body?.kundeId || body?.kunde_id || "").trim();
          if (targetType === "kunden") {
            kundeId = targetId;
          } else if (targetType === "hunde") {
            const hund = await storage.hunde.get(targetId, { requestId });
            kundeId = hund?.kundenId || "";
          }
          if (!kundeId) {
            jsonResponse(res, 400, { message: "kunde_required" });
            return true;
          }
          const created = await storage.rapporteDrafts.create(
            {
              status: "submitted",
              targetType,
              targetId,
              kundeId,
              text: body?.text,
              occurredAt: body?.occurredAt || new Date().toISOString(),
              authorId: actorId,
              authorRole: actorRole || "",
            },
            { requestId }
          );
          jsonResponse(res, 201, created);
        } catch (error) {
          jsonResponse(res, 400, { message: "rapporte_create_failed", code: error?.code });
        }
        return true;
      }
    }

    const draftMatch = path.match(/^\/api\/rapporte\/drafts\/([^/]+)$/);
    if (draftMatch) {
      const id = draftMatch[1];
      if (method === "GET") {
        try {
          const record = await storage.rapporteDrafts.get(id, { requestId });
          if (isRapportTrainer && record?.authorId !== actorId) {
            jsonResponse(res, 403, { message: "forbidden" });
            return true;
          }
          jsonResponse(res, 200, record);
        } catch (error) {
          jsonResponse(res, error?.code === "NOT_FOUND" ? 404 : 500, { message: "not_found" });
        }
        return true;
      }
      if (method === "DELETE") {
        if (!(actorRole === "admin" || actorRole === "developer")) {
          jsonResponse(res, 403, { message: "forbidden" });
          return true;
        }
        try {
          const result = await storage.rapporteDrafts.delete(id, { requestId });
          jsonResponse(res, 200, result);
        } catch (error) {
          jsonResponse(res, 500, { message: "rapporte_delete_failed", code: error?.code });
        }
        return true;
      }
    }

    const approveMatch = path.match(/^\/api\/rapporte\/drafts\/([^/]+)\/approve$/);
    if (approveMatch && method === "POST") {
      if (!(actorRole === "admin" || actorRole === "developer")) {
        jsonResponse(res, 403, { message: "forbidden" });
        return true;
      }
      const id = approveMatch[1];
      await withKeyLock(`rapporte:approve:${id}`, async () => {
        try {
          const draft = await storage.rapporteDrafts.get(id, { requestId });
          const occurredAt = draft?.occurredAt || new Date().toISOString();
          let authorName = "";
          if (draft?.authorId) {
            const trainerId = resolveTrainerIdFromActorId(draft.authorId);
            if (trainerId) {
              try {
                const trainer = await storage.trainer.get(trainerId, { requestId });
                authorName = extractFirstName(trainer?.name || "");
              } catch {
                authorName = "";
              }
            }
          }
          const suffix = authorName ? ` (Trainer: ${authorName})` : "";
          const text = `Rapport - ${(draft?.text || "").trim()}${suffix}`.trim();
          if (draft?.kundeId) {
            await storage.historie.create(
              {
                entityType: "kunden",
                entityId: draft.kundeId,
                occurredAt,
                authorId: draft.authorId || "",
                authorRole: draft.authorRole || "",
                text,
              },
              { requestId }
            );
          }
          if (draft?.targetType === "hunde" && draft?.targetId) {
            await storage.historie.create(
              {
                entityType: "hunde",
                entityId: draft.targetId,
                occurredAt,
                authorId: draft.authorId || "",
                authorRole: draft.authorRole || "",
                text,
              },
              { requestId }
            );
          }
          await storage.rapporteDrafts.delete(id, { requestId });
          jsonResponse(res, 200, { ok: true });
        } catch (error) {
          jsonResponse(res, 400, { message: "rapporte_approve_failed", code: error?.code });
        }
      });
      return true;
    }

    const rejectMatch = path.match(/^\/api\/rapporte\/drafts\/([^/]+)\/reject$/);
    if (rejectMatch && method === "POST") {
      if (!(actorRole === "admin" || actorRole === "developer")) {
        jsonResponse(res, 403, { message: "forbidden" });
        return true;
      }
      const id = rejectMatch[1];
      try {
        const result = await storage.rapporteDrafts.delete(id, { requestId });
        jsonResponse(res, 200, result);
      } catch (error) {
        jsonResponse(res, 500, { message: "rapporte_reject_failed", code: error?.code });
      }
      return true;
    }

    jsonResponse(res, 404, { message: "not_found" });
    return true;
  }

  async function handle(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/")) return false;
    if (
      reqUrl.startsWith("/api/schulungen/uploads/") &&
      (req.method || "GET").toUpperCase() === "GET"
    ) {
      return handleSchulungenRoutes(req, res);
    }
    if (
      await handleAuthRoutes(req, res, authService, {
        listAuthOptions,
        ensureTrainerUsers,
        ensurePasswords: ensurePasswordsSeeded,
      })
    )
      return true;

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
      /^\/api\/(dashboard|kunden|hunde|kurse|trainer|kalender|finanzen|waren|zertifikate|schulungen|anmeldung|rapporte|historie)(?:\/|$)/
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

    if (await handleDashboardRoutes(req, res)) return true;
    if (await handleAnmeldungRoutes(req, res)) return true;
    if (await handleRapporteRoutes(req, res)) return true;
    if (await handleHistorieRoutes(req, res)) return true;
    if (await handleKursTeilnehmerRoutes(req, res)) return true;
    if (await handleSchulungenRoutes(req, res)) return true;
    if (await core.handle(req, res)) return true;
    return kommunikation.handle(req, res);
  }

  return { handle, authService, userStore };
}

export { createCoreApiRouter };
