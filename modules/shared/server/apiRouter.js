/* global process */
import { URL } from "node:url";
import path from "node:path";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { createGroupchatApiHandlers } from "../../kommunikation/groupchat/apiRoutes.js";
import { createInfochannelApiHandlers } from "../../kommunikation/infochannel/apiRoutes.js";

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
