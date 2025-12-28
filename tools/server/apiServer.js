/* eslint-env node */
/* global process, console */
import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createApiRouter } from "../../modules/shared/server/apiRouter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.env.DOGULE1_WEB_ROOT
  ? path.resolve(process.env.DOGULE1_WEB_ROOT)
  : path.resolve(__dirname, "..", "..", "dist");
const PORT = Number(process.env.DOGULE1_API_PORT || 5177);

process.env.DOGULE1_REQUIRE_MARIADB = process.env.DOGULE1_REQUIRE_MARIADB || "1";

const router = createApiRouter();

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
