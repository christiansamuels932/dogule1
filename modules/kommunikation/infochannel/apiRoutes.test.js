/* global process */
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createInfochannelApiHandlers } from "./apiRoutes.js";
import { createInfochannelSal } from "./sal.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-infochannel-api");
const TRAINER_ID = "33333333-3333-3333-3333-333333333333";

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

describe("infochannel API routes", () => {
  let root;

  beforeEach(async () => {
    root = await makeTempRoot();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("supports publish, list, and confirm", async () => {
    const sal = createInfochannelSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1000 }),
      listTrainers: async () => [{ id: TRAINER_ID, name: "Trainer A" }],
      now: () => "2025-04-01T10:00:00.000Z",
    });
    const api = createInfochannelApiHandlers({ sal });

    const publishReq = mockReq({
      body: { title: "Hinweis", body: "Bitte lesen." },
      actor: { id: "admin-1", role: "admin" },
      authz: { allowedActions: ["kommunikation.infochannel.publish"] },
    });
    const publishRes = mockRes();
    await api.handleCreateNotice(publishReq, publishRes);
    expect(publishRes.statusCode).toBe(200);
    const publishBody = JSON.parse(publishRes.body);
    expect(publishBody.notice.title).toBe("Hinweis");

    const listReq = mockReq({
      query: { limit: 10 },
      actor: { id: TRAINER_ID, role: "trainer" },
      authz: { allowedActions: ["kommunikation.infochannel.view"] },
    });
    const listRes = mockRes();
    await api.handleListNotices(listReq, listRes);
    expect(listRes.statusCode).toBe(200);
    const listBody = JSON.parse(listRes.body);
    expect(listBody.notices).toHaveLength(1);

    const confirmReq = mockReq({
      actor: { id: TRAINER_ID, role: "trainer" },
      authz: { allowedActions: ["kommunikation.infochannel.confirm"] },
      params: { id: publishBody.notice.id },
    });
    const confirmRes = mockRes();
    await api.handleConfirmNotice(confirmReq, confirmRes);
    expect(confirmRes.statusCode).toBe(200);
  });
});
