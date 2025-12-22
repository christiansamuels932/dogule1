/* global process */
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createGroupchatApiHandlers } from "./apiRoutes.js";
import { createGroupchatSal } from "./sal.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-groupchat-api");

async function makeTempRoot() {
  const dir = path.join(TMP_ROOT, crypto.randomUUID());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanup(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

function mockReq({ query, body, actor, authz, resolveAuthz, id }) {
  return { query, body, actor, authz, resolveAuthz, id };
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(payload) {
      this.body = payload;
    },
  };
}

describe("groupchat API routes", () => {
  let root;

  beforeEach(async () => {
    root = await makeTempRoot();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("supports send + list messages happy path", async () => {
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1000 }),
    });
    const api = createGroupchatApiHandlers({ sal });
    const actor = { id: "u1", role: "admin" };
    const authz = { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] };

    const sendReq = mockReq({
      body: { body: "Hallo", clientNonce: "abc" },
      actor,
      authz,
    });
    const sendRes = mockRes();
    await api.handleSendMessage(sendReq, sendRes);
    expect(sendRes.statusCode).toBe(200);
    const sendBody = JSON.parse(sendRes.body);
    expect(sendBody.message.body).toBe("Hallo");

    const listReq = mockReq({ query: { limit: 10 }, actor, authz });
    const listRes = mockRes();
    await api.handleListMessages(listReq, listRes);
    expect(listRes.statusCode).toBe(200);
    const listBody = JSON.parse(listRes.body);
    expect(listBody.messages).toHaveLength(1);
    expect(listBody.messages[0].body).toBe("Hallo");
  });

  it("maps rate limit to 429 with retry-after header", async () => {
    let first = true;
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => {
        if (first) {
          first = false;
          return { allowed: false, remaining: 0, resetAt: Date.now() + 2000 };
        }
        return { allowed: true, remaining: 1, resetAt: Date.now() + 1000 };
      },
    });
    const api = createGroupchatApiHandlers({ sal });
    const req = mockReq({
      body: { body: "Spam", clientNonce: "spam" },
      actor: { id: "u2", role: "admin" },
      authz: { allowedActions: ["kommunikation.chat.send"] },
    });
    const res = mockRes();
    await api.handleSendMessage(req, res);
    expect(res.statusCode).toBe(429);
    expect(res.headers["retry-after"]).toBeDefined();
    const body = JSON.parse(res.body);
    expect(body.error).toBe("rate_limited");
  });

  it("denies send without authz", async () => {
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1000 }),
    });
    const api = createGroupchatApiHandlers({ sal });
    const req = mockReq({
      body: { body: "Forbidden", clientNonce: "deny" },
      actor: { id: "u3", role: "staff" },
      authz: { allowedActions: [] },
    });
    const res = mockRes();
    await api.handleSendMessage(req, res);
    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error).toBe("denied");
  });
});
