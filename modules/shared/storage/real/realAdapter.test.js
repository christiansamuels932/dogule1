/* global process */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createStorage } from "../storage.js";
import { STORAGE_ERROR_CODES } from "../errors.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-test-storage");

async function makeTempRoot() {
  const dir = path.join(TMP_ROOT, crypto.randomUUID());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanup(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function readAuditLines(root, entity) {
  const auditPath = path.join(root, "_audit", `${entity}.jsonl`);
  const raw = await fs.readFile(auditPath, "utf8");
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe("real adapter core CRUD", () => {
  let root;
  let logger;
  let alert;
  let audit;

  beforeEach(async () => {
    root = await makeTempRoot();
    logger = vi.fn();
    alert = vi.fn();
    audit = vi.fn();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("creates kunden then hunde with FK enforcement and writes audit chain", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    const kunde = await storage.kunden.create(
      { code: "K-001", vorname: "Test", nachname: "User" },
      { actorId: "u1", actorRole: "admin" }
    );

    const hund = await storage.hunde.create(
      { code: "H-001", name: "Rex", kundenId: kunde.id },
      { actorId: "u2", actorRole: "staff" }
    );

    expect(kunde.id).toMatch(/[a-f0-9-]{36}/);
    expect(hund.kundenId).toBe(kunde.id);

    const auditKunden = await readAuditLines(root, "kunden");
    const auditHunde = await readAuditLines(root, "hunde");
    expect(auditKunden).toHaveLength(1);
    expect(auditHunde).toHaveLength(1);
  });

  it("rejects hunde.create when FK is missing and writes nothing", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    await expect(
      storage.hunde.create(
        { code: "H-404", name: "Ghost", kundenId: "00000000-0000-0000-0000-000000000000" },
        { actorId: "u3", actorRole: "staff" }
      )
    ).rejects.toMatchObject({ code: STORAGE_ERROR_CODES.FK_NOT_FOUND });

    const auditPath = path.join(root, "_audit", "hunde.jsonl");
    await expect(fs.access(auditPath)).rejects.toBeTruthy();
  });

  it("detects checksum mismatch on read and alerts", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    const kunde = await storage.kunden.create(
      { code: "K-CHK", vorname: "Check", nachname: "Sum" },
      { actorId: "u1", actorRole: "admin" }
    );
    const dataPath = path.join(root, "kunden", `${kunde.id}.json`);
    const wrapper = JSON.parse(await fs.readFile(dataPath, "utf8"));
    wrapper.data.code = "TAMPERED";
    await fs.writeFile(dataPath, JSON.stringify(wrapper));

    await expect(storage.kunden.get(kunde.id)).rejects.toMatchObject({
      code: STORAGE_ERROR_CODES.CHECKSUM_MISMATCH,
    });
    expect(logger).toHaveBeenCalled();
    expect(alert).toHaveBeenCalled();
  });

  it("updates kunden and chains audit with before/after checksums", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    const kunde = await storage.kunden.create(
      { code: "K-002", vorname: "Before", nachname: "After" },
      { actorId: "u1", actorRole: "admin" }
    );
    const updated = await storage.kunden.update(
      kunde.id,
      { code: "K-002-UPDATED" },
      { actorId: "u1", actorRole: "admin" }
    );
    expect(updated.code).toBe("K-002-UPDATED");

    const auditLines = await readAuditLines(root, "kunden");
    expect(auditLines).toHaveLength(2);
    expect(auditLines[1].hashPrev).toBe(auditLines[0].recordHash);
    expect(auditLines[1].beforeChecksum).toBeDefined();
    expect(auditLines[1].afterChecksum).toBeDefined();
  });
  it("creates trainer then kurs with FK enforcement and writes audit chain", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    const trainer = await storage.trainer.create(
      { code: "T-001", name: "Coach", email: "c@example.com" },
      { actorId: "u5", actorRole: "admin" }
    );
    const kurs = await storage.kurse.create(
      { code: "KURS-1", title: "Basics", trainerId: trainer.id },
      { actorId: "u6", actorRole: "staff" }
    );

    expect(kurs.trainerId).toBe(trainer.id);
    const auditTrainer = await readAuditLines(root, "trainer");
    const auditKurse = await readAuditLines(root, "kurse");
    expect(auditTrainer).toHaveLength(1);
    expect(auditKurse).toHaveLength(1);
  });

  it("rejects kurse.create when trainer FK is missing and writes nothing", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    await expect(
      storage.kurse.create(
        { code: "K-404", title: "Ghost", trainerId: "00000000-0000-0000-0000-000000000000" },
        { actorId: "u7", actorRole: "admin" }
      )
    ).rejects.toMatchObject({ code: STORAGE_ERROR_CODES.FK_NOT_FOUND });
    await expect(fs.access(path.join(root, "_audit", "kurse.jsonl"))).rejects.toBeTruthy();
  });

  it("detects checksum mismatch on trainer read", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    const trainer = await storage.trainer.create(
      { code: "T-CHK", name: "Tamper", email: "" },
      { actorId: "u8", actorRole: "staff" }
    );
    const trainerPath = path.join(root, "trainer", `${trainer.id}.json`);
    const wrapper = JSON.parse(await fs.readFile(trainerPath, "utf8"));
    wrapper.data.code = "BROKEN";
    await fs.writeFile(trainerPath, JSON.stringify(wrapper));

    await expect(storage.trainer.get(trainer.id)).rejects.toMatchObject({
      code: STORAGE_ERROR_CODES.CHECKSUM_MISMATCH,
    });
    expect(logger).toHaveBeenCalled();
    expect(alert).toHaveBeenCalled();
  });

  it("updates kurse and chains audit with hashPrev and checksums", async () => {
    const storage = createStorage({
      mode: "real",
      paths: { root },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });
    const trainer = await storage.trainer.create(
      { code: "T-002", name: "Chain", email: "" },
      { actorId: "u9", actorRole: "admin" }
    );
    const kurs = await storage.kurse.create(
      { code: "K-CHAIN", title: "Chain", trainerId: trainer.id },
      { actorId: "u9", actorRole: "admin" }
    );
    await storage.kurse.update(
      kurs.id,
      { title: "Chain-Updated" },
      { actorId: "u9", actorRole: "admin" }
    );

    const auditLines = await readAuditLines(root, "kurse");
    expect(auditLines).toHaveLength(2);
    expect(auditLines[1].hashPrev).toBe(auditLines[0].recordHash);
    expect(auditLines[1].beforeChecksum).toBeDefined();
    expect(auditLines[1].afterChecksum).toBeDefined();
  });
});

describe("parity check (mock vs real) minimal create/get for core entities", () => {
  it("returns usable records in both modes", async () => {
    const logger = vi.fn();
    const alert = vi.fn();
    const audit = vi.fn();
    const mockStorage = createStorage({
      mode: "mock",
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });
    const realRoot = path.join(TMP_ROOT, crypto.randomUUID());
    await fs.mkdir(realRoot, { recursive: true });
    const realStorage = createStorage({
      mode: "real",
      paths: { root: realRoot },
      authz: { allowed: true },
      audit,
      logger,
      alert,
    });

    const mockKunde = await mockStorage.kunden.create(
      { code: "MK-1", vorname: "Mock", nachname: "User" },
      { actorId: "u1", actorRole: "staff", auditContext: { hashPrev: null, hashIndex: 0 } }
    );
    const realKunde = await realStorage.kunden.create(
      { code: "RK-1", vorname: "Real", nachname: "User" },
      { actorId: "u2", actorRole: "staff" }
    );

    const mockHund = await mockStorage.hunde.create(
      { code: "MH-1", name: "Doggo", kundenId: mockKunde.id },
      { actorId: "u1", actorRole: "staff", auditContext: { hashPrev: null, hashIndex: 1 } }
    );
    const realHund = await realStorage.hunde.create(
      { code: "RH-1", name: "Doggo", kundenId: realKunde.id },
      { actorId: "u2", actorRole: "staff" }
    );

    const mockTrainer = await mockStorage.trainer.create(
      { code: "MT-1", name: "Mock Trainer" },
      { actorId: "u1", actorRole: "staff", auditContext: { hashPrev: null, hashIndex: 2 } }
    );
    const realTrainer = await realStorage.trainer.create(
      { code: "RT-1", name: "Real Trainer" },
      { actorId: "u2", actorRole: "staff" }
    );

    const mockKurs = await mockStorage.kurse.create(
      { code: "MK-COURSE", title: "Mock Kurs", trainerId: mockTrainer.id },
      { actorId: "u1", actorRole: "staff", auditContext: { hashPrev: null, hashIndex: 3 } }
    );
    const realKurs = await realStorage.kurse.create(
      { code: "RK-COURSE", title: "Real Kurs", trainerId: realTrainer.id },
      { actorId: "u2", actorRole: "staff" }
    );

    expect((await mockStorage.kunden.list()).some((k) => k.id === mockKunde.id)).toBe(true);
    expect((await realStorage.kunden.list()).some((k) => k.id === realKunde.id)).toBe(true);
    expect((await mockStorage.hunde.list()).some((h) => h.id === mockHund.id)).toBe(true);
    expect((await realStorage.hunde.list()).some((h) => h.id === realHund.id)).toBe(true);
    expect((await mockStorage.trainer.list()).some((t) => t.id === mockTrainer.id)).toBe(true);
    expect((await realStorage.trainer.list()).some((t) => t.id === realTrainer.id)).toBe(true);
    expect((await mockStorage.kurse.list()).some((k) => k.id === mockKurs.id)).toBe(true);
    expect((await realStorage.kurse.list()).some((k) => k.id === realKurs.id)).toBe(true);

    await cleanup(realRoot);
  });
});
