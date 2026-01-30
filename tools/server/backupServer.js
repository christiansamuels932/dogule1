/* eslint-env node */
/* global process, console */
import http from "node:http";
import { createBackupHandlers } from "../../modules/shared/server/backupRoutes.js";

const PORT = Number(process.env.DOGULE1_BACKUP_PORT || 5178);
const ALLOWED_ORIGINS = (process.env.DOGULE1_CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const backupHandlers = createBackupHandlers();

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

const server = http.createServer(async (req, res) => {
  try {
    const origin = req.headers.origin;
    if (origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-dogule-backup-token");
    }
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    const reqUrl = req.url || "";
    if (reqUrl.startsWith("/healthz")) {
      jsonResponse(res, 200, { status: "ok" });
      return;
    }
    if (reqUrl.startsWith("/readyz")) {
      jsonResponse(res, 200, { status: "ok" });
      return;
    }
    const handled = await backupHandlers.handle(req, res);
    if (handled) return;
    jsonResponse(res, 404, { message: "not_found" });
  } catch {
    jsonResponse(res, 500, { message: "server_error" });
  }
});

server.listen(PORT, () => {
  console.log(`Dogule1 Backup server listening on http://localhost:${PORT}`);
});
