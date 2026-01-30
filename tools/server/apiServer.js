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

process.env.DOGULE1_REQUIRE_MARIADB = process.env.DOGULE1_REQUIRE_MARIADB || "1";

const storage = createStorage({ mode: "mariadb" });
const router = createApiRouter({ storage });
const backupHandlers = createBackupHandlers();
const healthHandlers = createHealthHandlers({
  storageUsage: async () => {
    const pool = storage?.pool;
    if (!pool?.query) return null;
    const dbName = process.env.DOGULE1_MARIADB_DATABASE || "dogule1";
    const rows = await pool.query(
      "SELECT SUM(data_length + index_length) AS bytes FROM information_schema.tables WHERE table_schema = ?",
      [dbName]
    );
    const bytesRaw = rows?.[0]?.bytes ?? 0;
    const bytes = Number(bytesRaw);
    if (!Number.isFinite(bytes)) return null;
    return Math.round((bytes / 1024 / 1024) * 10) / 10;
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
        "Content-Type, Authorization, x-dogule-actor-id, x-dogule-actor-role, x-dogule-authz, x-dogule-access-token, x-dogule-backup-token"
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
