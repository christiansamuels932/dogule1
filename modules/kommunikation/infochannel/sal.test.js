/* global process */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createInfochannelSal } from "./sal.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-infochannel-sal");
const TRAINER_IDS = [
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
];
const RICHARD_ID = "99999999-9999-9999-9999-999999999999";

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

async function countJsonFiles(rootDir, entity) {
  const dir = path.join(rootDir, entity);
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((name) => name.endsWith(".json")).length;
  } catch (error) {
    if (error.code === "ENOENT") return 0;
    throw error;
  }
}

function trainerList() {
  return [
    { id: RICHARD_ID, code: "TR-001", name: "Fontana Richard" },
    { id: TRAINER_IDS[0], code: "TR-002", name: "Trainer 1" },
    { id: TRAINER_IDS[1], code: "TR-003", name: "Trainer 2" },
  ];
}

describe("infochannel SAL", () => {
  let root;
  let audit;

  beforeEach(async () => {
    root = await makeTempRoot();
    audit = vi.fn();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("publishes notices with trainer targets and audits", async () => {
    const sal = createInfochannelSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-01-01T00:00:00.000Z",
      listTrainers: async () => trainerList(),
    });
    const context = {
      actorId: `user-${RICHARD_ID}`,
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.infochannel.publish"] },
    };

    const notice = await sal.publishNotice({ title: "Hallo", body: "Bitte lesen." }, context);

    expect(notice.targetIds).toEqual(TRAINER_IDS);
    expect(await countJsonFiles(root, "kommunikation_infochannel_notice")).toBe(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: "kommunikation.infochannel.publish" })
    );
  });

  it("is idempotent on trainer confirmation", async () => {
    const sal = createInfochannelSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-02-01T08:00:00.000Z",
      listTrainers: async () => trainerList(),
    });
    const publishCtx = {
      actorId: `user-${RICHARD_ID}`,
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.infochannel.publish"] },
    };
    const trainerCtx = {
      actorId: TRAINER_IDS[0],
      actorRole: "trainer",
      authz: { allowedActions: ["kommunikation.infochannel.confirm"] },
    };

    const notice = await sal.publishNotice({ title: "A", body: "B" }, publishCtx);
    const first = await sal.confirmNotice(notice.id, trainerCtx);
    const second = await sal.confirmNotice(notice.id, trainerCtx);

    expect(second.id).toBe(first.id);
    expect(await countJsonFiles(root, "kommunikation_infochannel_confirmation")).toBe(1);
  });

  it("allows only Richard to publish and delete notices", async () => {
    const sal = createInfochannelSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-03-01T08:00:00.000Z",
      listTrainers: async () => trainerList(),
    });
    const denyCtx = {
      actorId: "admin-1",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.infochannel.publish"] },
    };
    await expect(sal.publishNotice({ title: "X", body: "Y" }, denyCtx)).rejects.toHaveProperty(
      "code",
      "DENIED"
    );

    const richardCtx = {
      actorId: `user-${RICHARD_ID}`,
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.infochannel.publish"] },
    };
    const notice = await sal.publishNotice({ title: "Erlaubt", body: "Hinweis" }, richardCtx);
    expect(notice.id).toBeTruthy();

    await expect(sal.deleteNotice(notice.id, denyCtx)).rejects.toHaveProperty("code", "DENIED");
    const deleted = await sal.deleteNotice(notice.id, richardCtx);
    expect(deleted).toEqual({ ok: true, id: notice.id });
  });
});
