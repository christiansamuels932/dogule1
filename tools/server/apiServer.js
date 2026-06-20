/* eslint-env node */
/* global process, console */
import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createApiRouter } from "../../modules/shared/server/apiRouter.js";
import { createBackupHandlers } from "../../modules/shared/server/backupRoutes.js";
import { createHealthHandlers } from "../../modules/shared/server/health.js";
import { createStorage } from "../../modules/shared/storage/storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.env.DOGULE1_WEB_ROOT
  ? path.resolve(process.env.DOGULE1_WEB_ROOT)
  : path.resolve(__dirname, "..", "..", "dist");
const PORT = Number(process.env.DOGULE1_API_PORT || 5177);
const ALLOWED_ORIGINS = (process.env.DOGULE1_CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const STORAGE_STATUS_PATH = process.env.DOGULE1_STORAGE_STATUS_PATH
  ? path.resolve(process.env.DOGULE1_STORAGE_STATUS_PATH)
  : path.resolve(ROOT, "..");
const STORAGE_PERCENT_BUFFER = Number(process.env.DOGULE1_STORAGE_PERCENT_BUFFER || 5);
const STORAGE_WARN_PERCENT = Number(process.env.DOGULE1_STORAGE_WARN_PERCENT || 75);
const STORAGE_CRITICAL_PERCENT = Number(process.env.DOGULE1_STORAGE_CRITICAL_PERCENT || 91);

process.env.DOGULE1_REQUIRE_MARIADB = process.env.DOGULE1_REQUIRE_MARIADB || "1";

const storage = createStorage({ mode: "mariadb" });
const router = createApiRouter({ storage });
const backupHandlers = createBackupHandlers();
const healthHandlers = createHealthHandlers({
  storageUsage: async () => {
    const stat = await fs.statfs(STORAGE_STATUS_PATH);
    const totalBytes = Number(stat.blocks) * Number(stat.bsize);
    const freeBytes = Number(stat.bfree) * Number(stat.bsize);
    const availableBytes = Number(stat.bavail) * Number(stat.bsize);
    if (![totalBytes, freeBytes, availableBytes].every(Number.isFinite) || totalBytes <= 0) {
      return null;
    }
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const rawUsedPercent = Math.round((usedBytes / totalBytes) * 1000) / 10;
    const usedPercent = Math.min(
      100,
      Math.round((rawUsedPercent + STORAGE_PERCENT_BUFFER) * 10) / 10
    );
    const state =
      usedPercent >= STORAGE_CRITICAL_PERCENT
        ? "critical"
        : usedPercent >= STORAGE_WARN_PERCENT
          ? "warn"
          : "ok";
    return {
      path: STORAGE_STATUS_PATH,
      usedMb: Math.round((usedBytes / 1024 / 1024) * 10) / 10,
      totalMb: Math.round((totalBytes / 1024 / 1024) * 10) / 10,
      freeMb: Math.round((availableBytes / 1024 / 1024) * 10) / 10,
      usedPercent,
      rawUsedPercent,
      state,
    };
  },
});

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".js") return "application/javascript";
  if (ext === ".css") return "text/css";
  if (ext === ".html") return "text/html";
  if (ext === ".json") return "application/json";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

async function serveFile(res, filePath) {
  const data = await fs.readFile(filePath);
  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypeFor(filePath));
  res.end(data);
}

async function handleStatic(req, res) {
  const url = req.url || "/";
  const requestPath = url.split("?")[0];
  const relative = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(ROOT, relative);
  try {
    await serveFile(res, filePath);
  } catch {
    try {
      await serveFile(res, path.join(ROOT, "index.html"));
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const origin = req.headers.origin;
    if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-dogule-actor-id, x-dogule-actor-role, x-dogule-authz, x-dogule-access-token, x-dogule-backup-token, x-dogule-material-name, x-dogule-material-type, x-dogule-material-filename"
      );
    }
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    const reqUrl = req.url || "";
    if (reqUrl.startsWith("/healthz")) {
      await healthHandlers.handleHealthz(req, res);
      return;
    }
    if (reqUrl.startsWith("/readyz")) {
      healthHandlers.handleReadyz(req, res);
      return;
    }
    if (reqUrl.startsWith("/backup/")) {
      const handledBackup = await backupHandlers.handle(req, res);
      if (handledBackup) return;
    }
    const handled = await router.handle(req, res);
    if (handled) return;
    await handleStatic(req, res);
  } catch {
    res.statusCode = 500;
    res.end("Server error");
  }
});

server.listen(PORT, () => {
  console.log(`Dogule1 API server listening on http://localhost:${PORT}`);
  console.log(`Serving UI from ${ROOT}`);
});
