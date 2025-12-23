/* global process */
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createEmailApiHandlers } from "./apiRoutes.js";
import { createEmailSal } from "./sal.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-email-api");

async function makeTempRoot() {
  const dir = path.join(TMP_ROOT, crypto.randomUUID());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanup(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

function mockReq({ query, body, actor, authz, resolveAuthz, id, params }) {
  return { query, body, actor, authz, resolveAuthz, id, params };
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

describe("email API routes", () => {
  let root;

  beforeEach(async () => {
    root = await makeTempRoot();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("supports send + list emails", async () => {
    const sal = createEmailSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1000 }),
      connector: {
        sendEmail: async () => ({ status: "sent", provider: "outlook", providerMessageId: "x1" }),
      },
      config: { sendEnabled: true },
    });
    const api = createEmailApiHandlers({ sal });

    const sendReq = mockReq({
      body: { to: "kunde@example.com", subject: "Test", body: "Hallo" },
      actor: { id: "admin-1", role: "admin" },
      authz: { allowedActions: ["kommunikation.email.send_customer"] },
    });
    const sendRes = mockRes();
    await api.handleSendEmail(sendReq, sendRes);
    expect(sendRes.statusCode).toBe(200);

    const listReq = mockReq({
      query: { limit: 10 },
      actor: { id: "admin-1", role: "admin" },
      authz: { allowedActions: ["kommunikation.email.view"] },
    });
    const listRes = mockRes();
    await api.handleListEmails(listReq, listRes);
    expect(listRes.statusCode).toBe(200);
    const listBody = JSON.parse(listRes.body);
    expect(listBody.emails).toHaveLength(1);
  });
});
