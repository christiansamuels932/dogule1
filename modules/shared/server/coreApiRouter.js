/* eslint-env node */
import { URL } from "node:url";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { createStorage } from "../storage/storage.js";
import { StorageError, STORAGE_ERROR_CODES } from "../storage/errors.js";

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

function resolveRequestId(req) {
  const header =
    req.headers["x-request-id"] || req.headers["x-dogule-request-id"] || req.headers["x-trace-id"];
  if (header) return header;
  return crypto.randomUUID ? crypto.randomUUID() : `req-${Math.random().toString(36).slice(2)}`;
}

function extractQuery(reqUrl) {
  const parsed = new URL(reqUrl, "http://localhost");
  return Object.fromEntries(parsed.searchParams.entries());
}

function parsePath(reqUrl) {
  const path = reqUrl.split("?")[0];
  const match = path.match(
    /^\/api\/(kunden|hunde|kurse|trainer|kalender|finanzen|waren)(?:\/(.+))?$/
  );
  if (!match) return null;
  return { entity: match[1], id: match[2] || null };
}

function mapEntityName(entity) {
  if (entity === "finanzen") return "finanzen";
  return entity;
}

function mapStorageEntity(entity) {
  if (entity === "finanzen") return "finanzen";
  return entity;
}

function toHttpError(error) {
  if (!(error instanceof StorageError)) {
    return { status: 500, body: { message: error?.message || "server_error" } };
  }
  if (error.code === STORAGE_ERROR_CODES.NOT_FOUND) {
    return { status: 404, body: { message: "not_found", code: error.code } };
  }
  if (
    error.code === STORAGE_ERROR_CODES.INVALID_DATA ||
    error.code === STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED ||
    error.code === STORAGE_ERROR_CODES.INVARIANT_FAILED
  ) {
    return { status: 400, body: { message: "invalid_input", code: error.code } };
  }
  if (error.code === STORAGE_ERROR_CODES.FK_NOT_FOUND) {
    return { status: 409, body: { message: "fk_not_found", code: error.code } };
  }
  return { status: 500, body: { message: "storage_error", code: error.code } };
}

export function createCoreApiRouter(options = {}) {
  const storage =
    options.storage ||
    createStorage({
      mode: options.mode || "mariadb",
      ...options.storageOptions,
    });

  async function handle(req, res) {
    const reqUrl = req?.url || "";
    if (!reqUrl.startsWith("/api/")) return false;

    const parsed = parsePath(reqUrl);
    if (!parsed) return false;

    const { entity, id } = parsed;
    const method = (req.method || "GET").toUpperCase();
    const query = extractQuery(reqUrl);
    const body = await readJsonBody(req);
    const requestId = resolveRequestId(req);
    const storageEntity = mapStorageEntity(entity);
    const adapter = storage[storageEntity];

    if (!adapter) {
      jsonResponse(res, 404, { message: "not_found" });
      return true;
    }

    try {
      if (method === "GET" && !id) {
        const data = await adapter.list({ query, requestId });
        jsonResponse(res, 200, data);
        return true;
      }
      if (method === "POST" && !id) {
        const created = await adapter.create(body, { requestId });
        jsonResponse(res, 201, created);
        return true;
      }
      if (method === "GET" && id) {
        const record = await adapter.get(id, { requestId });
        jsonResponse(res, 200, record);
        return true;
      }
      if ((method === "PUT" || method === "PATCH") && id) {
        const updated = await adapter.update({ id, data: body }, { requestId });
        if (!updated) {
          jsonResponse(res, 404, { message: "not_found" });
          return true;
        }
        jsonResponse(res, 200, updated);
        return true;
      }
      if (method === "DELETE" && id) {
        const result = await adapter.delete(id, { requestId });
        jsonResponse(res, 200, result);
        return true;
      }
    } catch (error) {
      const { status, body: payload } = toHttpError(error);
      jsonResponse(res, status, payload);
      return true;
    }

    jsonResponse(res, 405, { message: "method_not_allowed" });
    return true;
  }

  return { handle, entity: mapEntityName };
}
