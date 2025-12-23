/* global process */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createEmailSal } from "./sal.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-email-sal");

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

describe("email SAL", () => {
  let root;
  let audit;

  beforeEach(async () => {
    root = await makeTempRoot();
    audit = vi.fn();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("sends an email and stores status", async () => {
    const connector = {
      sendEmail: vi.fn().mockResolvedValue({
        status: "sent",
        provider: "outlook",
        providerMessageId: "msg-1",
      }),
    };
    const sal = createEmailSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      connector,
      now: () => "2025-05-01T09:00:00.000Z",
      config: { sendEnabled: true },
    });
    const context = {
      actorId: "admin-1",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.email.send_customer", "kommunikation.email.view"] },
    };

    const email = await sal.sendEmail(
      { to: "kunde@example.com", subject: "Hallo", body: "Test" },
      context
    );

    expect(email.status).toBe("sent");
    expect(email.providerMessageId).toBe("msg-1");
    expect(await countJsonFiles(root, "kommunikation_email_send")).toBe(1);

    const list = await sal.listEmails({}, context);
    expect(list.emails).toHaveLength(1);
  });

  it("blocks send when kill switch is enabled", async () => {
    const sal = createEmailSal({
      mode: "real",
      paths: { root },
      audit,
      auditEvent: audit,
      rateLimiter: allowAllLimiter,
      connector: { sendEmail: vi.fn() },
      config: { sendEnabled: false },
    });
    const context = {
      actorId: "admin-1",
      actorRole: "admin",
      authz: { allowedActions: ["kommunikation.email.send_customer"] },
    };

    await expect(
      sal.sendEmail({ to: "kunde@example.com", subject: "Hi", body: "Test" }, context)
    ).rejects.toThrow("Email sending is disabled");
  });
});
