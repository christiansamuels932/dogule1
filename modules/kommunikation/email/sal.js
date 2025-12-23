import fs from "node:fs/promises";
import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import { logEvent } from "../../shared/logging/logger.js";
import { alertEvent } from "../../shared/logging/alerts.js";
import { rateLimit, logRateLimitHit } from "../../shared/ratelimit/limiter.js";
import { executeWriteContract } from "../../shared/storage/writeContract.js";
import { getStorageMode } from "../../shared/storage/config.js";
import { StorageError, STORAGE_ERROR_CODES } from "../../shared/storage/errors.js";
import { resolvePaths } from "../../shared/storage/real/paths.js";
import { writeEntityFile } from "../../shared/storage/real/dataFile.js";
import { loadEntity } from "../../shared/storage/real/read.js";
import { loadAuditChainState, appendAuditRecord } from "../../shared/storage/real/audit.js";
import { validateEmailSend } from "../../shared/storage/real/validators.js";
import { resolveEmailConfig } from "./config.js";
import { createOutlookConnector } from "./outlookConnector.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

class EmailError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "EmailError";
    this.code = code;
    if (details) this.details = details;
  }
}

function uuidv7() {
  const bytes = crypto.randomBytes(16);
  const now = BigInt(Date.now());
  bytes[0] = Number((now >> 40n) & 0xffn);
  bytes[1] = Number((now >> 32n) & 0xffn);
  bytes[2] = Number((now >> 24n) & 0xffn);
  bytes[3] = Number((now >> 16n) & 0xffn);
  bytes[4] = Number((now >> 8n) & 0xffn);
  bytes[5] = Number(now & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

function encodeCursor(createdAt, id) {
  const payload = { createdAt, id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function compareEmailOrder(a, b) {
  if (a.createdAt > b.createdAt) return -1;
  if (a.createdAt < b.createdAt) return 1;
  return (a.id || "").localeCompare(b.id || "");
}

function isAllowedAction(authz, actionId) {
  if (!authz) return false;
  if (authz === true) return true;
  if (Array.isArray(authz.allowedActions)) {
    return authz.allowedActions.includes(actionId);
  }
  if (Array.isArray(authz)) return authz.includes(actionId);
  if (authz.allowed === true) return true;
  if (authz.decision === "allow") return true;
  return false;
}

function buildActor(actorId, actorRole) {
  return {
    type: actorRole === "system" ? "system" : "user",
    id: actorId,
    role: actorRole,
  };
}

function buildRateLimitError(actionId, retryAfterSeconds) {
  return new EmailError("RATE_LIMITED", `${actionId} is rate limited`, {
    retryAfterSeconds,
  });
}

function validateLimit(limit) {
  if (limit === undefined || limit === null) return DEFAULT_LIMIT;
  const parsed = Number(limit);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function ensureActor(context) {
  if (!context?.actorId || !context?.actorRole) {
    throw new EmailError("INVALID_CONTEXT", "actorId and actorRole are required");
  }
  return { actorId: context.actorId, actorRole: context.actorRole };
}

function emitAudit(auditFn, actionId, payload) {
  if (typeof auditFn !== "function") return;
  auditFn({ actionId, ...payload });
}

function recordRateLimitHit({ actionId, actorId, actorRole, key, requestId, logger }) {
  logRateLimitHit({
    actionId,
    actor: buildActor(actorId, actorRole),
    requestId: requestId || "email",
    key,
  });
  if (logger) {
    logger({
      actionId,
      actor: buildActor(actorId, actorRole),
      target: { type: "ratelimit", id: key },
      result: "rate_limited",
      requestId: requestId || "email",
      message: "RATE-LIMIT-HIT",
      level: "warning",
      severity: "WARNING",
      meta: { code: "RATE-LIMIT-HIT" },
    });
  }
}

function enforceRateLimit(
  limiter,
  { actionId, actorId, actorRole, windowMs, limit, requestId, logger }
) {
  const key = `${actionId}:${actorId}:${windowMs}`;
  const result = limiter({ actionId, key, limit, windowMs });
  if (!result.allowed) {
    recordRateLimitHit({ actionId, actorId, actorRole, key, requestId, logger });
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    throw buildRateLimitError(actionId, retryAfterSeconds);
  }
  return result;
}

async function listAllEntities(paths, entity, logger, alerter) {
  const dir = paths.entityDir(entity);
  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const results = [];
  for (const file of entries.filter((name) => name.endsWith(".json"))) {
    const id = file.replace(/\.json$/, "");
    const loaded = await loadEntity(paths, entity, id, { logger, alerter });
    results.push(loaded.data);
  }
  return results;
}

async function loadEmail(paths, id, logger, alerter) {
  try {
    const loaded = await loadEntity(paths, "kommunikation_email_send", id, {
      logger,
      alerter,
    });
    return loaded.data;
  } catch (error) {
    if (error instanceof StorageError && error.code === STORAGE_ERROR_CODES.NOT_FOUND) {
      return null;
    }
    throw error;
  }
}

function parseRecipientList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeRecipients(value) {
  const list = parseRecipientList(value);
  const unique = Array.from(new Set(list.map((entry) => entry.toLowerCase())));
  return unique;
}

function isValidEmail(address) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address);
}

export function createEmailSal(options = {}) {
  const mode = options.mode || getStorageMode();
  const paths = resolvePaths(options.paths);
  const logger = options.logger || logEvent;
  const alerter = options.alerter || alertEvent;
  const audit = options.audit || (() => {});
  const auditEvent = options.auditEvent || audit;
  const limiter = options.rateLimiter || rateLimit;
  const now = options.now || (() => new Date().toISOString());
  const config = resolveEmailConfig(options.config || {});
  const connector =
    options.connector || createOutlookConnector({ config: { dryRun: config.dryRun } });

  function authorize(context, actionId) {
    if (!isAllowedAction(context?.authz, actionId)) {
      emitAudit(auditEvent, "kommunikation.email.denied", {
        actorId: context?.actorId,
        actorRole: context?.actorRole,
        action: actionId,
        result: "denied",
      });
      throw new EmailError("DENIED", `${actionId} not allowed`);
    }
  }

  async function listEmails(options = {}, context = {}) {
    authorize(context, "kommunikation.email.view");
    const limit = validateLimit(options.limit);
    const cursor = decodeCursor(options.cursor);
    const all = (await listAllEntities(paths, "kommunikation_email_send", logger, alerter))
      .slice()
      .sort(compareEmailOrder);
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = all.findIndex(
        (record) => record.createdAt === cursor.createdAt && record.id === cursor.id
      );
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }
    const sliced = all.slice(startIndex, startIndex + limit);
    const emails = sliced.map((record) => ({
      id: record.id,
      to: record.to,
      subject: record.subject,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      provider: record.provider,
      errorMessage: record.errorMessage || null,
    }));
    const nextCursor =
      startIndex + limit < all.length && sliced.length
        ? encodeCursor(sliced[sliced.length - 1].createdAt, sliced[sliced.length - 1].id)
        : null;
    return { emails, nextCursor };
  }

  async function getEmail(id, context = {}) {
    authorize(context, "kommunikation.email.view");
    const record = await loadEmail(paths, id, logger, alerter);
    if (!record) {
      throw new EmailError("NOT_FOUND", "email not found");
    }
    return record;
  }

  async function sendEmail(payload = {}, context = {}) {
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.email.send_customer");
    if (!config.sendEnabled) {
      throw new EmailError("SEND_DISABLED", "Email sending is disabled");
    }
    if (actorRole !== "admin" && actorRole !== "system") {
      throw new EmailError("DENIED", "Only admins can send emails");
    }

    const to = normalizeRecipients(payload.to);
    const cc = normalizeRecipients(payload.cc);
    const bcc = normalizeRecipients(payload.bcc);

    if (!to.length) {
      throw new EmailError("INVALID_INPUT", "to is required");
    }
    if ((cc.length || bcc.length) && actorRole !== "admin") {
      throw new EmailError("DENIED", "CC/BCC are admin only");
    }
    if (cc.length > config.maxCcBcc || bcc.length > config.maxCcBcc) {
      throw new EmailError("INVALID_INPUT", "Too many CC/BCC recipients", {
        maxCcBcc: config.maxCcBcc,
      });
    }

    const totalRecipients = to.length + cc.length + bcc.length;
    if (totalRecipients > config.maxRecipients) {
      throw new EmailError("INVALID_INPUT", "Too many recipients", {
        maxRecipients: config.maxRecipients,
      });
    }
    const allRecipients = [...to, ...cc, ...bcc];
    allRecipients.forEach((address) => {
      if (!isValidEmail(address)) {
        throw new EmailError("INVALID_INPUT", `Invalid email address: ${address}`);
      }
    });

    const subject = (payload.subject || "").trim();
    const body = (payload.body || "").trim();
    if (!subject) {
      throw new EmailError("INVALID_INPUT", "subject is required");
    }
    if (!body) {
      throw new EmailError("INVALID_INPUT", "body is required");
    }
    if (subject.length > config.maxSubjectLength) {
      throw new EmailError("INVALID_INPUT", "subject too long", {
        maxSubjectLength: config.maxSubjectLength,
      });
    }
    if (body.length > config.maxBodyLength) {
      throw new EmailError("INVALID_INPUT", "body too long", {
        maxBodyLength: config.maxBodyLength,
      });
    }

    enforceRateLimit(limiter, {
      actionId: "kommunikation.email.send_customer",
      actorId,
      actorRole,
      windowMs: 60 * 1000,
      limit: config.rateLimitMinute,
      requestId: context.requestId,
      logger,
    });
    enforceRateLimit(limiter, {
      actionId: "kommunikation.email.send_customer",
      actorId,
      actorRole,
      windowMs: 60 * 60 * 1000,
      limit: config.rateLimitHour,
      requestId: context.requestId,
      logger,
    });
    enforceRateLimit(limiter, {
      actionId: "kommunikation.email.send_customer",
      actorId,
      actorRole,
      windowMs: 24 * 60 * 60 * 1000,
      limit: config.rateLimitDay,
      requestId: context.requestId,
      logger,
    });

    const queuedAt = now();
    const record = {
      id: uuidv7(),
      to,
      cc,
      bcc,
      subject,
      body,
      status: "queued",
      provider: "outlook",
      providerMessageId: null,
      errorMessage: null,
      queuedAt,
      sentAt: null,
      failedAt: null,
      createdAt: queuedAt,
      updatedAt: queuedAt,
      createdByActorId: actorId,
      createdByRole: actorRole,
      schemaVersion: 1,
    };
    const auditContext = { hashPrev: 0, hashIndex: 0, after: record };

    await executeWriteContract({
      mode,
      entity: "kommunikation_email_send",
      operation: "create",
      actionId: "kommunikation.email.send_customer",
      actorId,
      actorRole,
      targetId: record.id,
      requestId: context.requestId,
      authz: true,
      audit,
      auditContext,
      logger,
      alerter,
      perform: async () => {
        const chain = await loadAuditChainState(paths, "kommunikation_email_send");
        auditContext.hashPrev = chain.hashPrev;
        auditContext.hashIndex = chain.hashIndex;
        validateEmailSend(record);
        const { checksum } = await writeEntityFile(
          paths,
          "kommunikation_email_send",
          record.id,
          record
        );
        await appendAuditRecord(
          paths,
          "kommunikation_email_send",
          {
            actionId: "kommunikation.email.send_customer",
            actor: buildActor(actorId, actorRole),
            target: { type: "kommunikation_email_send", id: record.id },
            requestId: context.requestId || "email-send",
            result: "success",
            before: null,
            after: record,
            afterChecksum: checksum,
          },
          chain
        );
        return record;
      },
    });

    let sendResult;
    try {
      sendResult = await connector.sendEmail({
        to,
        cc,
        bcc,
        subject,
        body,
        requestId: context.requestId,
      });
    } catch (error) {
      sendResult = { status: "failed", error: error?.message || "send_failed" };
    }

    const updatedAt = now();
    const status =
      sendResult?.status === "sent"
        ? "sent"
        : sendResult?.status === "queued"
          ? "queued"
          : "failed";
    const updated = {
      ...record,
      status,
      provider: sendResult?.provider || record.provider,
      providerMessageId: sendResult?.providerMessageId || null,
      errorMessage: status === "failed" ? sendResult?.error || "send_failed" : null,
      sentAt: status === "sent" ? updatedAt : null,
      failedAt: status === "failed" ? updatedAt : null,
      updatedAt,
    };
    const updateAuditContext = { hashPrev: 0, hashIndex: 0, before: record, after: updated };

    await executeWriteContract({
      mode,
      entity: "kommunikation_email_send",
      operation: "update",
      actionId: "kommunikation.email.send_customer",
      actorId,
      actorRole,
      targetId: record.id,
      requestId: context.requestId,
      authz: true,
      audit,
      auditContext: updateAuditContext,
      logger,
      alerter,
      perform: async () => {
        const chain = await loadAuditChainState(paths, "kommunikation_email_send");
        updateAuditContext.hashPrev = chain.hashPrev;
        updateAuditContext.hashIndex = chain.hashIndex;
        validateEmailSend(updated);
        const { checksum } = await writeEntityFile(
          paths,
          "kommunikation_email_send",
          record.id,
          updated
        );
        await appendAuditRecord(
          paths,
          "kommunikation_email_send",
          {
            actionId: "kommunikation.email.send_customer",
            actor: buildActor(actorId, actorRole),
            target: { type: "kommunikation_email_send", id: record.id },
            requestId: context.requestId || "email-send",
            result: status === "failed" ? "error" : "success",
            before: record,
            after: updated,
            afterChecksum: checksum,
          },
          chain
        );
        return updated;
      },
    });

    emitAudit(auditEvent, "kommunikation.email.send_customer", {
      actorId,
      actorRole,
      emailId: record.id,
      status,
      toCount: to.length,
      ccCount: cc.length,
      bccCount: bcc.length,
    });

    return updated;
  }

  return {
    listEmails,
    getEmail,
    sendEmail,
  };
}
