/* global process */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createGroupchatSal } from "./sal.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-groupchat-sal");

function allowAllLimiter() {
  return { allowed: true, remaining: 1, resetAt: Date.now() + 1000 };
}

async function makeTempRoot() {
  const dir = path.join(TMP_ROOT, crypto.randomUUID());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanup(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

describe("groupchat SAL", () => {
  let root;
  let audit;

  beforeEach(async () => {
    root = await makeTempRoot();
    audit = vi.fn();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("is idempotent on send with same clientNonce", async () => {
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-01-01T00:00:00.000Z",
    });
    const context = {
      actorId: "user-1",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send"] },
    };

    const first = await sal.sendMessage("global", { body: "Hallo", clientNonce: "abc" }, context);
    const second = await sal.sendMessage(
      "global",
      { body: "Hallo erneut", clientNonce: "abc" },
      context
    );

    expect(second.id).toBe(first.id);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: "kommunikation.groupchat.send.accepted" })
    );
  });

  it("orders messages deterministically with cursor pagination", async () => {
    let idx = 0;
    const times = [
      "2025-02-01T10:00:00.000Z",
      "2025-02-01T10:00:01.000Z",
      "2025-02-01T10:00:02.000Z",
    ];
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => times[idx++] || new Date().toISOString(),
    });
    const sendCtx = {
      actorId: "user-2",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] },
    };
    const listCtx = {
      actorId: "user-2",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.read"] },
    };

    const first = await sal.sendMessage("global", { body: "A", clientNonce: "n1" }, sendCtx);
    const second = await sal.sendMessage("global", { body: "B", clientNonce: "n2" }, sendCtx);
    const third = await sal.sendMessage("global", { body: "C", clientNonce: "n3" }, sendCtx);

    const pageOne = await sal.listMessages("global", { limit: 2 }, listCtx);
    expect(pageOne.messages.map((m) => m.id)).toEqual([first.id, second.id]);
    expect(pageOne.nextCursor).toBeDefined();

    const pageTwo = await sal.listMessages(
      "global",
      { limit: 2, cursor: pageOne.nextCursor },
      listCtx
    );
    expect(pageTwo.messages.map((m) => m.id)).toEqual([third.id]);
  });

  it("keeps read markers monotonic", async () => {
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-03-01T12:00:00.000Z",
    });
    const ctx = {
      actorId: "user-3",
      actorRole: "admin",
      authz: {
        allowedActions: [
          "kommunikation.chat.send",
          "kommunikation.chat.read",
          "kommunikation.chat.readMarker.set",
        ],
      },
    };

    const m1 = await sal.sendMessage("global", { body: "Eins", clientNonce: "rm1" }, ctx);
    const m2 = await sal.sendMessage("global", { body: "Zwei", clientNonce: "rm2" }, ctx);

    const forward = await sal.setReadMarker("global", { lastReadMessageId: m2.id }, ctx);
    expect(forward.lastReadMessageId).toBe(m2.id);

    const regression = await sal.setReadMarker("global", { lastReadMessageId: m1.id }, ctx);
    expect(regression.lastReadMessageId).toBe(m2.id);
  });

  it("denies send when authz is missing and emits audit", async () => {
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-04-01T12:00:00.000Z",
    });
    const ctx = { actorId: "user-4", actorRole: "staff", authz: { allowedActions: [] } };

    await expect(
      sal.sendMessage("global", { body: "Kein Zugriff", clientNonce: "na" }, ctx)
    ).rejects.toHaveProperty("code", "DENIED");

    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: "kommunikation.groupchat.send.denied" })
    );
  });
});
