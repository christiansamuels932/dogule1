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

async function readEventRecords(rootDir) {
  const dir = path.join(rootDir, "kommunikation_infochannel_notice_event");
  try {
    const entries = await fs.readdir(dir);
    const records = [];
    for (const file of entries.filter((name) => name.endsWith(".json"))) {
      const payload = JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
      records.push(payload.data);
    }
    return records;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function trainerList() {
  return TRAINER_IDS.map((id, idx) => ({ id, name: `Trainer ${idx + 1}` }));
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
      actorId: "admin-1",
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
      actorId: "admin-1",
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

  it("runs SLA job with escalation events and skips duplicates", async () => {
    const publishSal = createInfochannelSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-03-01T08:00:00.000Z",
      listTrainers: async () => trainerList(),
    });
    const publishCtx = {
      actorId: "admin-1",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.infochannel.publish"] },
    };
    const notice = await publishSal.publishNotice(
      { title: "SLA", body: "Bitte bestätigen", slaHours: 24 },
      publishCtx
    );
    expect(notice.slaDueAt).toBe("2025-03-02T08:00:00.000Z");

    const jobSal = createInfochannelSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      now: () => "2025-03-04T08:00:00.000Z",
      nowMs: () => Date.parse("2025-03-04T08:00:00.000Z"),
      listTrainers: async () => trainerList(),
    });
    const jobCtx = {
      actorId: "system:infochannel",
      actorRole: "system",
      authz: { allowedActions: ["kommunikation.infochannel.sla.run"] },
    };

    const firstRun = await jobSal.runSlaJob(jobCtx);
    expect(firstRun.escalations).toBe(TRAINER_IDS.length);
    expect(await countJsonFiles(root, "kommunikation_infochannel_notice_event")).toBe(
      TRAINER_IDS.length
    );
    const secondRun = await jobSal.runSlaJob(jobCtx);
    expect(secondRun.escalations).toBe(0);

    const events = await readEventRecords(root);
    expect(events.every((event) => event.eventType === "escalation")).toBe(true);
  });
});
