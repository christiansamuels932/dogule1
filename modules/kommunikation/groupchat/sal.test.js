/* global process */
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
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

async function countMessageFiles(rootDir) {
  const dir = path.join(rootDir, "kommunikation_groupchat_message");
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((name) => name.endsWith(".json")).length;
  } catch (error) {
    if (error.code === "ENOENT") return 0;
    throw error;
  }
}

function encodeCursor(createdAt, id, cutoffTs) {
  const payload = { createdAt, id };
  if (cutoffTs) payload.cutoffTs = cutoffTs;
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
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

  it("keeps Station 65 behavior when retention is disabled", async () => {
    let nowValue = "2025-05-01T00:00:00.000Z";
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => nowValue,
    });
    const ctx = {
      actorId: "user-5",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] },
    };

    await sal.sendMessage("global", { body: "Alt", clientNonce: "r0" }, ctx);
    nowValue = "2025-05-01T00:00:01.000Z";
    await sal.sendMessage("global", { body: "Neu", clientNonce: "r1" }, ctx);

    const list = await sal.listMessages("global", { limit: 10 }, ctx);
    expect(list.messages).toHaveLength(2);
    expect(list.retention?.enabled).toBe(false);
    expect(list.truncated?.dueToRetention).toBe(false);
  });

  it("pins cutoff across paginated reads", async () => {
    let nowValue = "2025-05-01T10:00:00.000Z";
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => nowValue,
      retentionConfig: { defaultRetentionDays: 10 },
    });
    const ctx = {
      actorId: "user-6",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] },
    };

    await sal.sendMessage("global", { body: "A", clientNonce: "p1" }, ctx);
    nowValue = "2025-05-01T11:00:00.000Z";
    await sal.sendMessage("global", { body: "B", clientNonce: "p2" }, ctx);
    nowValue = "2025-05-02T09:00:00.000Z";
    const third = await sal.sendMessage("global", { body: "C", clientNonce: "p3" }, ctx);

    nowValue = "2025-05-02T12:00:00.000Z";
    const pageOne = await sal.listMessages("global", { limit: 2 }, ctx);
    const cutoffOne = pageOne.retention.cutoffTs;
    expect(pageOne.messages).toHaveLength(2);
    expect(cutoffOne).toBeTruthy();

    nowValue = "2025-05-05T12:00:00.000Z";
    const pageTwo = await sal.listMessages("global", { limit: 2, cursor: pageOne.nextCursor }, ctx);
    expect(pageTwo.retention.cutoffTs).toBe(cutoffOne);
    expect(pageTwo.messages.map((m) => m.id)).toEqual([third.id]);
  });

  it("advances when cursor references an expired message", async () => {
    let nowValue = "2025-06-01T00:00:00.000Z";
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => nowValue,
      retentionConfig: { defaultRetentionDays: 1 },
    });
    const ctx = {
      actorId: "user-7",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] },
    };

    nowValue = "2025-05-01T00:00:00.000Z";
    const expired = await sal.sendMessage("global", { body: "Alt", clientNonce: "e1" }, ctx);
    nowValue = "2025-06-01T01:00:00.000Z";
    const fresh = await sal.sendMessage("global", { body: "Neu", clientNonce: "e2" }, ctx);
    nowValue = "2025-06-02T00:00:00.000Z";

    const cursor = encodeCursor(expired.createdAt, expired.id);
    const list = await sal.listMessages("global", { limit: 10, cursor }, ctx);
    expect(list.messages.map((m) => m.id)).toEqual([fresh.id]);
    expect(list.truncated?.dueToRetention).toBe(true);
  });

  it("clamps unread counts to the retention cutoff", async () => {
    let nowValue = "2025-07-01T00:00:00.000Z";
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => nowValue,
      retentionConfig: { defaultRetentionDays: 1 },
    });
    const ctx = {
      actorId: "user-8",
      actorRole: "admin",
      authz: {
        allowedActions: [
          "kommunikation.chat.send",
          "kommunikation.chat.read",
          "kommunikation.chat.readMarker.set",
        ],
      },
    };

    nowValue = "2025-06-25T00:00:00.000Z";
    const oldMsg = await sal.sendMessage("global", { body: "Alt", clientNonce: "u1" }, ctx);
    nowValue = "2025-07-01T01:00:00.000Z";
    await sal.sendMessage("global", { body: "Neu", clientNonce: "u2" }, ctx);
    nowValue = "2025-07-02T00:00:00.000Z";

    await sal.setReadMarker("global", { lastReadMessageId: oldMsg.id }, ctx);
    const list = await sal.listMessages("global", { limit: 10 }, ctx);
    expect(list.unreadCount).toBe(1);
  });

  it("enforces prune caps on retention deletes", async () => {
    let nowValue = "2025-01-01T00:00:00.000Z";
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => nowValue,
      retentionConfig: {
        defaultRetentionDays: 1,
        pruneEnabled: true,
        prune: { maxDeletes: 1, intervalMs: 0, timeBudgetMs: 1000 },
      },
      pruneMode: "sync",
    });
    const ctx = {
      actorId: "user-9",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] },
    };

    await sal.sendMessage("global", { body: "A", clientNonce: "c1" }, ctx);
    nowValue = "2025-01-01T00:00:01.000Z";
    await sal.sendMessage("global", { body: "B", clientNonce: "c2" }, ctx);
    nowValue = "2025-01-01T00:00:02.000Z";
    await sal.sendMessage("global", { body: "C", clientNonce: "c3" }, ctx);
    expect(await countMessageFiles(root)).toBe(3);

    nowValue = "2025-02-01T00:00:00.000Z";
    await sal.listMessages("global", { limit: 5 }, ctx);
    expect(await countMessageFiles(root)).toBe(2);
  });

  it("aborts pruning when the time budget is exceeded", async () => {
    let nowValue = "2025-03-01T00:00:00.000Z";
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => nowValue,
      retentionConfig: {
        defaultRetentionDays: 1,
        pruneEnabled: true,
        prune: { maxDeletes: 5, intervalMs: 0, timeBudgetMs: 0 },
      },
      pruneMode: "sync",
    });
    const ctx = {
      actorId: "user-10",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] },
    };

    await sal.sendMessage("global", { body: "Alt", clientNonce: "t1" }, ctx);
    nowValue = "2025-03-03T00:00:00.000Z";
    await sal.listMessages("global", { limit: 5 }, ctx);
    expect(await countMessageFiles(root)).toBe(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: "kommunikation.groupchat.retention.prune" })
    );
    expect(
      audit.mock.calls.some(([payload]) => payload.stopReason === "time_budget_exceeded")
    ).toBe(true);
  });

  it("emits a noop audit when pruning is disabled", async () => {
    let nowValue = "2025-04-01T00:00:00.000Z";
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => nowValue,
      retentionConfig: { defaultRetentionDays: 1, pruneEnabled: false },
      pruneMode: "sync",
    });
    const ctx = {
      actorId: "user-11",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.chat.send", "kommunikation.chat.read"] },
    };

    await sal.sendMessage("global", { body: "Alt", clientNonce: "d1" }, ctx);
    nowValue = "2025-04-03T00:00:00.000Z";
    await sal.listMessages("global", { limit: 5 }, ctx);
    expect(
      audit.mock.calls.some(
        ([payload]) =>
          payload.actionId === "kommunikation.groupchat.retention.prune.noop" &&
          payload.stopReason === "disabled"
      )
    ).toBe(true);
  });
});
