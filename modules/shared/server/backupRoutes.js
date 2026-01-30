/* eslint-env node */
/* global process */
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { URL } from "node:url";
import { Buffer } from "node:buffer";

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

function safeSegment(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function resolveBackupRoot() {
  return process.env.DOGULE1_BACKUP_ROOT
    ? path.resolve(process.env.DOGULE1_BACKUP_ROOT)
    : path.resolve(process.cwd(), "backups");
}

const BACKUP_TOKEN_FILE = process.env.DOGULE1_BACKUP_TOKEN_FILE
  ? path.resolve(process.env.DOGULE1_BACKUP_TOKEN_FILE)
  : path.join(process.cwd(), "config", "dogule1.backup.tokens");

let backupTokenLoaded = false;
let backupTokenCache = null;

async function loadBackupTokenConfig() {
  if (backupTokenLoaded) return backupTokenCache;
  backupTokenLoaded = true;
  const byClient = new Map();
  try {
    const raw = await fs.readFile(BACKUP_TOKEN_FILE, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = String(line || "").trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separatorIndex = trimmed.indexOf(":");
      if (separatorIndex <= 0) return;
      const clientId = trimmed.slice(0, separatorIndex).trim();
      const token = trimmed.slice(separatorIndex + 1).trim();
      if (!clientId || !token) return;
      byClient.set(clientId, token);
    });
  } catch {
    backupTokenCache = { byClient };
    return backupTokenCache;
  }
  backupTokenCache = { byClient };
  return backupTokenCache;
}

async function isBackupTokenValid(clientId, token) {
  if (!clientId || !token) return false;
  const { byClient } = await loadBackupTokenConfig();
  return byClient.get(clientId) === token;
}

function resolveMasterKey() {
  const raw = process.env.DOGULE1_BACKUP_MASTER_KEY || "";
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) return null;
    return buf;
  } catch {
    return null;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function wrapDataKey(dataKey, { clientId, keyId, masterKey }) {
  const wrapNonce = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, wrapNonce);
  const aad = Buffer.from(`${clientId}:${keyId}`, "utf8");
  cipher.setAAD(aad);
  const wrapped = Buffer.concat([cipher.update(dataKey), cipher.final()]);
  const wrapTag = cipher.getAuthTag();
  return {
    wrappedKey: wrapped.toString("base64"),
    wrapNonce: wrapNonce.toString("base64"),
    wrapTag: wrapTag.toString("base64"),
  };
}

function unwrapDataKey(record, { clientId, keyId, masterKey }) {
  const wrapNonce = Buffer.from(record.wrapNonce || "", "base64");
  const wrapTag = Buffer.from(record.wrapTag || "", "base64");
  const wrappedKey = Buffer.from(record.wrappedKey || "", "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, wrapNonce);
  const aad = Buffer.from(`${clientId}:${keyId}`, "utf8");
  decipher.setAAD(aad);
  decipher.setAuthTag(wrapTag);
  const dataKey = Buffer.concat([decipher.update(wrappedKey), decipher.final()]);
  return dataKey;
}

export function createBackupHandlers() {
  async function handleKeyEscrow(req, res, body) {
    const clientId = safeSegment(body.clientId);
    const keyId = safeSegment(body.keyId);
    const token = req.headers["x-dogule-backup-token"];
    if (!(await isBackupTokenValid(clientId, token))) {
      jsonResponse(res, 401, { message: "invalid_token" });
      return true;
    }
    const masterKey = resolveMasterKey();
    if (!masterKey) {
      jsonResponse(res, 500, { message: "master_key_missing" });
      return true;
    }
    let dataKey = null;
    try {
      dataKey = Buffer.from(body.dataKey || "", "base64");
    } catch {
      dataKey = null;
    }
    if (!clientId || !keyId || !dataKey || dataKey.length !== 32) {
      jsonResponse(res, 400, { message: "invalid_payload" });
      return true;
    }
    const backupRoot = resolveBackupRoot();
    const clientDir = path.join(backupRoot, clientId, "keys");
    await ensureDir(clientDir);
    const wrapped = wrapDataKey(dataKey, { clientId, keyId, masterKey });
    const record = {
      clientId,
      keyId,
      wrappedKey: wrapped.wrappedKey,
      wrapNonce: wrapped.wrapNonce,
      wrapTag: wrapped.wrapTag,
      wrappedAt: new Date().toISOString(),
      createdAt: body.createdAt || null,
    };
    await writeJson(path.join(clientDir, `${keyId}.json`), record);
    jsonResponse(res, 200, { status: "ok", keyId, wrappedAt: record.wrappedAt });
    return true;
  }

  async function handleKeyRetrieve(req, res, body) {
    const clientId = safeSegment(body.clientId);
    const keyId = safeSegment(body.keyId);
    const token = req.headers["x-dogule-backup-token"];
    if (!(await isBackupTokenValid(clientId, token))) {
      jsonResponse(res, 401, { message: "invalid_token" });
      return true;
    }
    const masterKey = resolveMasterKey();
    if (!masterKey) {
      jsonResponse(res, 500, { message: "master_key_missing" });
      return true;
    }
    if (!clientId || !keyId) {
      jsonResponse(res, 400, { message: "invalid_payload" });
      return true;
    }
    try {
      const backupRoot = resolveBackupRoot();
      const record = await readJson(path.join(backupRoot, clientId, "keys", `${keyId}.json`));
      const dataKey = unwrapDataKey(record, { clientId, keyId, masterKey });
      jsonResponse(res, 200, {
        status: "ok",
        keyId,
        dataKey: dataKey.toString("base64"),
      });
      return true;
    } catch {
      jsonResponse(res, 404, { message: "not_found" });
      return true;
    }
  }

  async function handleBackupUpload(req, res, body) {
    const clientId = safeSegment(body.clientId);
    const backupId = safeSegment(body.backupId);
    const token = req.headers["x-dogule-backup-token"];
    if (!(await isBackupTokenValid(clientId, token))) {
      jsonResponse(res, 401, { message: "invalid_token" });
      return true;
    }
    if (!clientId || !backupId || !body.payload || !body.keyId || !body.nonce) {
      jsonResponse(res, 400, { message: "invalid_payload" });
      return true;
    }
    const payloadBuffer = Buffer.from(body.payload, "base64");
    const record = {
      clientId,
      backupId,
      createdAt: body.createdAt || null,
      storedAt: new Date().toISOString(),
      appVersion: body.appVersion || null,
      cipher: body.cipher || "AES-256-GCM",
      keyId: body.keyId,
      nonce: body.nonce,
      payload: body.payload,
      size: payloadBuffer.length,
    };
    const backupRoot = resolveBackupRoot();
    const backupDir = path.join(backupRoot, clientId, "backups");
    await ensureDir(backupDir);
    await writeJson(path.join(backupDir, `${backupId}.json`), record);
    jsonResponse(res, 200, {
      status: "ok",
      backupId,
      storedAt: record.storedAt,
      size: record.size,
    });
    return true;
  }

  async function handleBackupList(req, res, reqUrl) {
    const query = extractQuery(reqUrl);
    const clientId = safeSegment(query.clientId);
    const token = req.headers["x-dogule-backup-token"];
    if (!(await isBackupTokenValid(clientId, token))) {
      jsonResponse(res, 401, { message: "invalid_token" });
      return true;
    }
    if (!clientId) {
      jsonResponse(res, 400, { message: "invalid_payload" });
      return true;
    }
    const backupRoot = resolveBackupRoot();
    const backupDir = path.join(backupRoot, clientId, "backups");
    try {
      const entries = await fs.readdir(backupDir);
      const results = [];
      for (const entry of entries) {
        if (!entry.endsWith(".json")) continue;
        try {
          const record = await readJson(path.join(backupDir, entry));
          results.push({
            backupId: record.backupId,
            storedAt: record.storedAt,
            size: record.size,
            cipher: record.cipher,
            keyId: record.keyId,
            nonce: record.nonce,
            appVersion: record.appVersion || null,
          });
        } catch {
          // ignore malformed files
        }
      }
      jsonResponse(res, 200, results);
      return true;
    } catch {
      jsonResponse(res, 200, []);
      return true;
    }
  }

  async function handleBackupRestore(req, res, body) {
    const clientId = safeSegment(body.clientId);
    const backupId = safeSegment(body.backupId);
    const token = req.headers["x-dogule-backup-token"];
    if (!(await isBackupTokenValid(clientId, token))) {
      jsonResponse(res, 401, { message: "invalid_token" });
      return true;
    }
    if (!clientId || !backupId) {
      jsonResponse(res, 400, { message: "invalid_payload" });
      return true;
    }
    const backupRoot = resolveBackupRoot();
    try {
      const record = await readJson(path.join(backupRoot, clientId, "backups", `${backupId}.json`));
      jsonResponse(res, 200, {
        status: "ok",
        backupId: record.backupId,
        cipher: record.cipher,
        keyId: record.keyId,
        nonce: record.nonce,
        payload: record.payload,
      });
      return true;
    } catch {
      jsonResponse(res, 404, { message: "not_found" });
      return true;
    }
  }

  async function handle(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/backup/")) return false;
    const method = (req.method || "GET").toUpperCase();
    if (reqUrl === "/backup/key/escrow" && method === "POST") {
      const body = await readJsonBody(req);
      return handleKeyEscrow(req, res, body);
    }
    if (reqUrl === "/backup/key/retrieve" && method === "POST") {
      const body = await readJsonBody(req);
      return handleKeyRetrieve(req, res, body);
    }
    if (reqUrl === "/backup/upload" && method === "POST") {
      const body = await readJsonBody(req);
      return handleBackupUpload(req, res, body);
    }
    if (reqUrl.startsWith("/backup/list") && method === "GET") {
      return handleBackupList(req, res, reqUrl);
    }
    if (reqUrl === "/backup/restore" && method === "POST") {
      const body = await readJsonBody(req);
      return handleBackupRestore(req, res, body);
    }
    jsonResponse(res, 404, { message: "not_found" });
    return true;
  }

  return { handle };
}
