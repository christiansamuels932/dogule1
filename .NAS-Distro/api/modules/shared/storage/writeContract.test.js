import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeWriteContract } from "./writeContract.js";
import { STORAGE_ERROR_CODES } from "./errors.js";

describe("executeWriteContract", () => {
  const baseContext = {
    mode: "real",
    entity: "kunden",
    operation: "create",
    actionId: "kunden.create",
    actorId: "user-1",
    actorRole: "staff",
    targetId: "k-1",
    requestId: "req-1",
  };

  let logs;
  let alerts;

  const logger = (event) => logs.push(event);
  const alerter = (event) => alerts.push(event);

  beforeEach(() => {
    logs = [];
    alerts = [];
  });

  it("denies when authz is missing and emits log + alert", async () => {
    const perform = vi.fn();
    const audit = vi.fn();
    const auditContext = { hashPrev: null, hashIndex: 0 };

    await expect(
      executeWriteContract({
        ...baseContext,
        authz: null,
        audit,
        auditContext,
        perform,
        logger,
        alerter,
      })
    ).rejects.toMatchObject({ code: STORAGE_ERROR_CODES.DENIED });

    expect(perform).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
    expect(logs[0]).toMatchObject({
      result: "denied",
      actionId: baseContext.actionId,
      target: { type: baseContext.entity, id: baseContext.targetId },
      message: "STORAGE-WRITE-DENIED",
    });
    expect(alerts[0]).toMatchObject({
      alertCode: "storage.write.denied",
      result: "denied",
    });
  });

  it("requires an audit hook and context before executing the handler", async () => {
    const perform = vi.fn();

    await expect(
      executeWriteContract({
        ...baseContext,
        authz: true,
        audit: null,
        auditContext: { hashPrev: null, hashIndex: 0 },
        perform,
        logger,
        alerter,
      })
    ).rejects.toMatchObject({ code: STORAGE_ERROR_CODES.STORAGE_ERROR });

    expect(perform).not.toHaveBeenCalled();
    expect(logs).toHaveLength(0);
    expect(alerts).toHaveLength(0);
  });

  it("runs the handler and audit hook when authorized", async () => {
    const perform = vi.fn(async () => ({ id: "k-1", name: "Klaus" }));
    const audit = vi.fn();
    const auditContext = {
      hashPrev: "prev-hash",
      hashIndex: 1,
      before: { id: "k-1" },
      after: { id: "k-1", name: "Klaus" },
      requestId: "audit-req-1",
    };

    const result = await executeWriteContract({
      ...baseContext,
      authz: { allowed: true },
      audit,
      auditContext,
      perform,
      logger,
      alerter,
    });

    expect(result).toEqual({ id: "k-1", name: "Klaus" });
    expect(perform).toHaveBeenCalledTimes(1);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        actionId: baseContext.actionId,
        actorId: baseContext.actorId,
        actorRole: baseContext.actorRole,
        target: { module: baseContext.entity, id: baseContext.targetId },
        result: "success",
        hashPrev: auditContext.hashPrev,
        hashIndex: auditContext.hashIndex,
        requestId: auditContext.requestId,
      })
    );
    expect(logs).toHaveLength(0);
    expect(alerts).toHaveLength(0);
  });

  it("wraps handler errors and emits log + alert", async () => {
    const perform = vi.fn(async () => {
      throw new Error("disk failure");
    });
    const audit = vi.fn();
    const auditContext = { hashPrev: "prev", hashIndex: 2 };

    await expect(
      executeWriteContract({
        ...baseContext,
        authz: true,
        audit,
        auditContext,
        perform,
        logger,
        alerter,
      })
    ).rejects.toMatchObject({
      code: STORAGE_ERROR_CODES.STORAGE_ERROR,
    });

    expect(perform).toHaveBeenCalledTimes(1);
    expect(audit).not.toHaveBeenCalled();
    expect(logs[0]).toMatchObject({
      result: "error",
      message: "STORAGE-WRITE-ERROR",
      meta: { code: "STORAGE_ERROR" },
    });
    expect(alerts[0]).toMatchObject({
      alertCode: "storage.write.error",
      result: "error",
    });
  });
});
