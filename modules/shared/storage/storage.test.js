/* global process */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getStorageMode } from "./config.js";
import { createStorage } from "./storage.js";
import { STORAGE_ERROR_CODES, StorageError } from "./errors.js";
import * as writeContract from "./writeContract.js";

describe("storage mode resolution", () => {
  const originalEnv = process.env.DOGULE1_STORAGE_MODE;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DOGULE1_STORAGE_MODE;
    } else {
      process.env.DOGULE1_STORAGE_MODE = originalEnv;
    }
  });

  it("defaults to mock when env is missing", () => {
    delete process.env.DOGULE1_STORAGE_MODE;
    expect(getStorageMode()).toBe("mock");
  });

  it("throws with explicit code on invalid mode", () => {
    process.env.DOGULE1_STORAGE_MODE = "invalid";
    expect(() => getStorageMode()).toThrowError(StorageError);
    try {
      getStorageMode();
    } catch (error) {
      expect(error.code).toBe(STORAGE_ERROR_CODES.INVALID_MODE);
    }
  });
});

describe("storage adapters", () => {
  let contractSpy;
  let tempRoot;

  beforeEach(() => {
    contractSpy = vi.spyOn(writeContract, "executeWriteContract");
    tempRoot = path.join(process.cwd(), ".tmp-test-storage", crypto.randomUUID());
  });

  afterEach(async () => {
    contractSpy.mockRestore();
    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("routes mock writes through executeWriteContract", async () => {
    const audit = vi.fn();
    const storage = createStorage({ mode: "mock", authz: { allowed: true }, audit });

    await storage.kunden.create(
      { code: "K-10", vorname: "Test", nachname: "User" },
      { actorId: "u1", actorRole: "staff", auditContext: { hashPrev: null, hashIndex: 0 } }
    );

    expect(contractSpy).toHaveBeenCalled();
    const call = contractSpy.mock.calls[0][0];
    expect(call).toMatchObject({
      entity: "kunden",
      operation: "create",
      mode: "mock",
    });
  });

  it("real writes go through the contract", async () => {
    const audit = vi.fn();
    await fs.mkdir(tempRoot, { recursive: true });
    const storage = createStorage({
      mode: "real",
      paths: { root: tempRoot },
      authz: { allowed: true },
      audit,
    });

    const created = await storage.kunden.create(
      { code: "K-11", vorname: "Real", nachname: "User" },
      { actorId: "u2", actorRole: "admin" }
    );

    expect(contractSpy).toHaveBeenCalled();
    const call = contractSpy.mock.calls[0][0];
    expect(call).toMatchObject({
      entity: "kunden",
      operation: "create",
      mode: "real",
    });
    expect(created.id).toBeTruthy();
  });
});
