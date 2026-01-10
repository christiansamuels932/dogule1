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
import {
  validateInfochannelNotice,
  validateInfochannelConfirmation,
  validateInfochannelEvent,
} from "../../shared/storage/real/validators.js";
import { sha256Hex } from "../../shared/storage/real/utils.js";
import { resolveInfochannelConfig } from "./config.js";

const MAX_TITLE_LENGTH = 140;
const MAX_BODY_LENGTH = 5000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

class InfochannelError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "InfochannelError";
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

function compareNoticeOrder(a, b) {
  if (a.createdAt > b.createdAt) return -1;
  if (a.createdAt < b.createdAt) return 1;
  return (a.id || "").localeCompare(b.id || "");
}

function isAllowedAction(authz, actionId) {
  if (!authz) return false;
  if (authz === true) return true;
  if (Array.isArray(authz.allowedActions)) {
    return authz.allowedActions.includes(actionId) || authz.allowedActions.includes("*");
  }
  if (Array.isArray(authz)) return authz.includes(actionId) || authz.includes("*");
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
  return new InfochannelError("RATE_LIMITED", `${actionId} is rate limited`, {
    retryAfterSeconds,
  });
}

function noticeConfirmId(noticeId, trainerId) {
  return sha256Hex(`${noticeId}:${trainerId}`).slice(0, 24);
}

function noticeEventId(noticeId, trainerId, eventType) {
  return sha256Hex(`${noticeId}:${trainerId}:${eventType}`).slice(0, 24);
}

function validateLimit(limit) {
  if (limit === undefined || limit === null) return DEFAULT_LIMIT;
  const parsed = Number(limit);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function parseSlaHours(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new InfochannelError("INVALID_INPUT", "slaHours must be a number >= 1");
  }
  return Math.floor(parsed);
}

function computeDueAt(startIso, hours) {
  const baseMs = Date.parse(startIso);
  const startMs = Number.isNaN(baseMs) ? Date.now() : baseMs;
  return new Date(startMs + hours * 3600_000).toISOString();
}

function ensureActor(context) {
  if (!context?.actorId || !context?.actorRole) {
    throw new InfochannelError("INVALID_CONTEXT", "actorId and actorRole are required");
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
    requestId: requestId || "infochannel",
    key,
  });
  if (logger) {
    logger({
      actionId,
      actor: buildActor(actorId, actorRole),
      target: { type: "ratelimit", id: key },
      result: "rate_limited",
      requestId: requestId || "infochannel",
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

async function loadNotice(paths, id, logger, alerter) {
  try {
    const loaded = await loadEntity(paths, "kommunikation_infochannel_notice", id, {
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

async function loadConfirmation(paths, noticeId, trainerId, logger, alerter) {
  const confirmId = noticeConfirmId(noticeId, trainerId);
  try {
    const loaded = await loadEntity(paths, "kommunikation_infochannel_confirmation", confirmId, {
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

function normalizeTrainer(trainer) {
  return {
    id: trainer?.id || null,
    name: trainer?.name || trainer?.code || trainer?.id || "Trainer",
    code: trainer?.code || "",
  };
}

function deriveTargetIds({ noticeTargetIds, confirmations, trainers, actorId, actorRole }) {
  const targetSet = new Set();
  (noticeTargetIds || []).forEach((id) => {
    if (id) targetSet.add(id);
  });
  (trainers || []).forEach((trainer) => {
    if (trainer?.id) targetSet.add(trainer.id);
  });
  (confirmations || []).forEach((entry) => {
    if (entry?.trainerId) targetSet.add(entry.trainerId);
  });
  if (actorRole === "trainer" && actorId) {
    targetSet.add(actorId);
  }
  return Array.from(targetSet);
}

export function createInfochannelSal(options = {}) {
  const mode = options.mode || getStorageMode();
  const paths = resolvePaths(options.paths);
  const logger = options.logger || logEvent;
  const alerter = options.alerter || alertEvent;
  const audit = options.audit || (() => {});
  const auditEvent = options.auditEvent || audit;
  const limiter = options.rateLimiter || rateLimit;
  const now = options.now || (() => new Date().toISOString());
  const nowMs = options.nowMs || (() => Date.now());
  const config = resolveInfochannelConfig(options.config || {});
  const listTrainers =
    typeof options.listTrainers === "function"
      ? options.listTrainers
      : async () => listAllEntities(paths, "trainer", logger, alerter);

  function authorize(context, actionId) {
    if (!isAllowedAction(context?.authz, actionId)) {
      emitAudit(auditEvent, "kommunikation.infochannel.denied", {
        actorId: context?.actorId,
        actorRole: context?.actorRole,
        action: actionId,
        result: "denied",
      });
      throw new InfochannelError("DENIED", `${actionId} not allowed`);
    }
  }

  async function publishNotice(payload = {}, context = {}) {
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.infochannel.publish");
    if (actorRole !== "admin") {
      throw new InfochannelError("DENIED", "Only admins can publish notices");
    }

    enforceRateLimit(limiter, {
      actionId: "kommunikation.infochannel.publish",
      actorId,
      actorRole,
      windowMs: 60 * 60 * 1000,
      limit: 3,
      requestId: context.requestId,
      logger,
    });
    enforceRateLimit(limiter, {
      actionId: "kommunikation.infochannel.publish",
      actorId,
      actorRole,
      windowMs: 24 * 60 * 60 * 1000,
      limit: 12,
      requestId: context.requestId,
      logger,
    });

    const title = (payload.title || "").trim();
    const body = (payload.body || "").trim();
    if (!title) {
      throw new InfochannelError("INVALID_INPUT", "title is required");
    }
    if (!body) {
      throw new InfochannelError("INVALID_INPUT", "body is required");
    }
    if (title.length > MAX_TITLE_LENGTH) {
      throw new InfochannelError("INVALID_INPUT", "title too long", {
        maxLength: MAX_TITLE_LENGTH,
      });
    }
    if (body.length > MAX_BODY_LENGTH) {
      throw new InfochannelError("INVALID_INPUT", "body too long", {
        maxLength: MAX_BODY_LENGTH,
      });
    }

    const trainersRaw = await listTrainers();
    const trainers = trainersRaw.map(normalizeTrainer).filter((entry) => entry.id);
    const targetIds = trainers.map((entry) => entry.id);

    const issuedAt = now();
    const slaHours = parseSlaHours(payload.slaHours, config.slaHours);
    const slaDueAt = computeDueAt(issuedAt, slaHours);
    const notice = {
      id: uuidv7(),
      title,
      body,
      status: "published",
      createdAt: issuedAt,
      createdByActorId: actorId,
      createdByRole: actorRole,
      targetRole: "trainer",
      targetIds,
      slaHours,
      slaDueAt,
      schemaVersion: 1,
    };
    const auditContext = { hashPrev: 0, hashIndex: 0, after: notice };

    const result = await executeWriteContract({
      mode,
      entity: "kommunikation_infochannel_notice",
      operation: "create",
      actionId: "kommunikation.infochannel.publish",
      actorId,
      actorRole,
      targetId: notice.id,
      requestId: context.requestId,
      authz: true,
      audit,
      auditContext,
      logger,
      alerter,
      perform: async () => {
        const chain = await loadAuditChainState(paths, "kommunikation_infochannel_notice");
        auditContext.hashPrev = chain.hashPrev;
        auditContext.hashIndex = chain.hashIndex;
        validateInfochannelNotice(notice);
        const { checksum } = await writeEntityFile(
          paths,
          "kommunikation_infochannel_notice",
          notice.id,
          notice
        );
        await appendAuditRecord(
          paths,
          "kommunikation_infochannel_notice",
          {
            actionId: "kommunikation.infochannel.publish",
            actor: buildActor(actorId, actorRole),
            target: { type: "kommunikation_infochannel_notice", id: notice.id },
            requestId: context.requestId || "infochannel-publish",
            result: "success",
            before: null,
            after: notice,
            afterChecksum: checksum,
          },
          chain
        );
        return notice;
      },
    });

    emitAudit(auditEvent, "kommunikation.infochannel.publish", {
      actorId,
      actorRole,
      noticeId: result.id,
      targetCount: targetIds.length,
      slaHours,
    });

    return result;
  }

  async function listNotices(options = {}, context = {}) {
    authorize(context, "kommunikation.infochannel.view");
    const limit = validateLimit(options.limit);
    const cursor = decodeCursor(options.cursor);
    const all = (await listAllEntities(paths, "kommunikation_infochannel_notice", logger, alerter))
      .slice()
      .sort(compareNoticeOrder);
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = all.findIndex(
        (notice) => notice.createdAt === cursor.createdAt && notice.id === cursor.id
      );
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }
    const sliced = all.slice(startIndex, startIndex + limit);

    const confirmations = await listAllEntities(
      paths,
      "kommunikation_infochannel_confirmation",
      logger,
      alerter
    );
    const trainersRaw = await listTrainers();
    const trainers = trainersRaw.map(normalizeTrainer);
    const confirmationMap = new Map();
    confirmations.forEach((entry) => {
      if (!entry.noticeId) return;
      if (!confirmationMap.has(entry.noticeId)) {
        confirmationMap.set(entry.noticeId, []);
      }
      confirmationMap.get(entry.noticeId).push(entry);
    });

    const nowIso = now();
    const nowTs = Date.parse(nowIso);

    const notices = sliced.map((notice) => {
      const noticeConfirmations = confirmationMap.get(notice.id) || [];
      const targetIds = deriveTargetIds({
        noticeTargetIds: Array.isArray(notice.targetIds) ? notice.targetIds : [],
        confirmations: noticeConfirmations,
        trainers,
        actorId: context?.actorId,
        actorRole: context?.actorRole,
      });
      const confirmedCount = noticeConfirmations.length;
      const targetCount = targetIds.length;
      const pendingCount = Math.max(0, targetCount - confirmedCount);
      const dueTs = Date.parse(notice.slaDueAt || "");
      const isOverdue = !Number.isNaN(dueTs) && nowTs > dueTs && pendingCount > 0;
      const lateCount = noticeConfirmations.filter((entry) => {
        const confirmedTs = Date.parse(entry.confirmedAt || "");
        return !Number.isNaN(dueTs) && !Number.isNaN(confirmedTs) && confirmedTs > dueTs;
      }).length;

      const summary = {
        id: notice.id,
        title: notice.title,
        body: notice.body,
        createdAt: notice.createdAt,
        slaDueAt: notice.slaDueAt,
        targetCount,
        confirmedCount,
        pendingCount,
        lateCount,
        overdueCount: isOverdue ? pendingCount : 0,
      };

      if (context?.actorRole === "trainer" && context?.actorId) {
        const match = noticeConfirmations.find((entry) => entry.trainerId === context.actorId);
        const confirmedTs = match ? Date.parse(match.confirmedAt || "") : NaN;
        const late =
          match && !Number.isNaN(dueTs) && !Number.isNaN(confirmedTs) && confirmedTs > dueTs;
        summary.viewerConfirmation = match
          ? { confirmedAt: match.confirmedAt, late: Boolean(late) }
          : null;
        summary.viewerOverdue = !match && isOverdue;
      }

      return summary;
    });

    const nextCursor =
      startIndex + limit < all.length && sliced.length
        ? encodeCursor(sliced[sliced.length - 1].createdAt, sliced[sliced.length - 1].id)
        : null;

    return { notices, nextCursor, now: nowIso };
  }

  async function getNotice(noticeId, context = {}) {
    authorize(context, "kommunikation.infochannel.view");
    const notice = await loadNotice(paths, noticeId, logger, alerter);
    if (!notice) {
      throw new InfochannelError("NOT_FOUND", "notice not found");
    }
    const confirmations = await listAllEntities(
      paths,
      "kommunikation_infochannel_confirmation",
      logger,
      alerter
    );
    const noticeConfirmations = confirmations.filter((entry) => entry.noticeId === notice.id);
    const trainersRaw = await listTrainers();
    const trainers = trainersRaw.map(normalizeTrainer);
    const targetIds = deriveTargetIds({
      noticeTargetIds: Array.isArray(notice.targetIds) ? notice.targetIds : [],
      confirmations: noticeConfirmations,
      trainers,
      actorId: context?.actorId,
      actorRole: context?.actorRole,
    });
    const targetCount = targetIds.length;
    const confirmedCount = noticeConfirmations.length;
    const pendingCount = Math.max(0, targetCount - confirmedCount);
    const dueTs = Date.parse(notice.slaDueAt || "");
    const nowTs = nowMs();
    const isOverdue = !Number.isNaN(dueTs) && nowTs > dueTs && pendingCount > 0;
    const lateCount = noticeConfirmations.filter((entry) => {
      const confirmedTs = Date.parse(entry.confirmedAt || "");
      return !Number.isNaN(dueTs) && !Number.isNaN(confirmedTs) && confirmedTs > dueTs;
    }).length;

    const response = {
      notice: {
        id: notice.id,
        title: notice.title,
        body: notice.body,
        createdAt: notice.createdAt,
        slaDueAt: notice.slaDueAt,
        targetCount,
        confirmedCount,
        pendingCount,
        lateCount,
        overdueCount: isOverdue ? pendingCount : 0,
      },
    };

    if (context?.actorRole === "trainer" && context?.actorId) {
      const match = noticeConfirmations.find((entry) => entry.trainerId === context.actorId);
      const confirmedTs = match ? Date.parse(match.confirmedAt || "") : NaN;
      const late =
        match && !Number.isNaN(dueTs) && !Number.isNaN(confirmedTs) && confirmedTs > dueTs;
      response.confirmation = match
        ? { confirmedAt: match.confirmedAt, late: Boolean(late) }
        : null;
      response.overdue = !match && isOverdue;
    }

    if (context?.actorRole === "admin" || context?.actorRole === "staff") {
      const trainerMap = new Map(trainers.map((entry) => [entry.id, entry]));
      response.targets = targetIds.map((trainerId) => {
        const match = noticeConfirmations.find((entry) => entry.trainerId === trainerId);
        const confirmedTs = match ? Date.parse(match.confirmedAt || "") : NaN;
        const late =
          match && !Number.isNaN(dueTs) && !Number.isNaN(confirmedTs) && confirmedTs > dueTs;
        const overdue = !match && isOverdue;
        return {
          trainerId,
          trainerName: trainerMap.get(trainerId)?.name || trainerId,
          status: match ? "confirmed" : overdue ? "overdue" : "pending",
          confirmedAt: match?.confirmedAt || null,
          late: Boolean(late),
        };
      });
    }

    return response;
  }

  async function confirmNotice(noticeId, context = {}) {
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.infochannel.confirm");
    if (actorRole !== "trainer") {
      throw new InfochannelError("DENIED", "Only trainers can confirm notices");
    }
    const notice = await loadNotice(paths, noticeId, logger, alerter);
    if (!notice) {
      throw new InfochannelError("NOT_FOUND", "notice not found");
    }

    enforceRateLimit(limiter, {
      actionId: "kommunikation.infochannel.confirm",
      actorId,
      actorRole,
      windowMs: 60 * 1000,
      limit: 5,
      requestId: context.requestId,
      logger,
    });

    const existing = await loadConfirmation(paths, noticeId, actorId, logger, alerter);
    if (existing) {
      return existing;
    }

    const confirmedAt = now();
    const confirmation = {
      id: noticeConfirmId(noticeId, actorId),
      noticeId,
      trainerId: actorId,
      confirmedAt,
      actorId,
      actorRole,
      schemaVersion: 1,
    };
    const auditContext = { hashPrev: 0, hashIndex: 0, after: confirmation };
    const result = await executeWriteContract({
      mode,
      entity: "kommunikation_infochannel_confirmation",
      operation: "create",
      actionId: "kommunikation.infochannel.confirm",
      actorId,
      actorRole,
      targetId: confirmation.id,
      requestId: context.requestId,
      authz: true,
      audit,
      auditContext,
      logger,
      alerter,
      perform: async () => {
        const chain = await loadAuditChainState(paths, "kommunikation_infochannel_confirmation");
        auditContext.hashPrev = chain.hashPrev;
        auditContext.hashIndex = chain.hashIndex;
        validateInfochannelConfirmation(confirmation);
        const { checksum } = await writeEntityFile(
          paths,
          "kommunikation_infochannel_confirmation",
          confirmation.id,
          confirmation
        );
        await appendAuditRecord(
          paths,
          "kommunikation_infochannel_confirmation",
          {
            actionId: "kommunikation.infochannel.confirm",
            actor: buildActor(actorId, actorRole),
            target: { type: "kommunikation_infochannel_confirmation", id: confirmation.id },
            requestId: context.requestId || "infochannel-confirm",
            result: "success",
            before: null,
            after: confirmation,
            afterChecksum: checksum,
          },
          chain
        );
        return confirmation;
      },
    });

    emitAudit(auditEvent, "kommunikation.infochannel.confirm", {
      actorId,
      actorRole,
      noticeId,
      confirmedAt,
    });

    return result;
  }

  async function runSlaJob(context = {}) {
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.infochannel.sla.run");

    const notices = await listAllEntities(
      paths,
      "kommunikation_infochannel_notice",
      logger,
      alerter
    );
    const confirmations = await listAllEntities(
      paths,
      "kommunikation_infochannel_confirmation",
      logger,
      alerter
    );
    const events = await listAllEntities(
      paths,
      "kommunikation_infochannel_notice_event",
      logger,
      alerter
    );
    const eventIds = new Set(events.map((event) => event.id));
    const nowIso = now();
    const nowTs = nowMs();
    const reminderLeadMs = config.reminderLeadHours * 3600_000;
    const escalationGraceMs = config.escalationGraceHours * 3600_000;
    let reminderCount = 0;
    let escalationCount = 0;
    const jobId = crypto.randomUUID ? crypto.randomUUID() : uuidv7();

    const confirmationMap = new Map();
    confirmations.forEach((entry) => {
      if (!confirmationMap.has(entry.noticeId)) {
        confirmationMap.set(entry.noticeId, new Set());
      }
      confirmationMap.get(entry.noticeId).add(entry.trainerId);
    });

    for (const notice of notices) {
      const targetIds = Array.isArray(notice.targetIds) ? notice.targetIds : [];
      const dueTs = Date.parse(notice.slaDueAt || "");
      if (Number.isNaN(dueTs)) continue;
      const noticeConfirmations = confirmationMap.get(notice.id) || new Set();
      for (const trainerId of targetIds) {
        if (noticeConfirmations.has(trainerId)) continue;
        const overdue = nowTs > dueTs + escalationGraceMs;
        const reminderWindow = nowTs >= dueTs - reminderLeadMs && nowTs <= dueTs;
        const eventType = overdue ? "escalation" : reminderWindow ? "reminder" : null;
        if (!eventType) continue;
        const eventId = noticeEventId(notice.id, trainerId, eventType);
        if (eventIds.has(eventId)) continue;

        const eventRecord = {
          id: eventId,
          noticeId: notice.id,
          trainerId,
          eventType,
          createdAt: nowIso,
          actorId,
          actorRole,
          slaDueAt: notice.slaDueAt,
          jobId,
          schemaVersion: 1,
        };
        const auditContext = { hashPrev: 0, hashIndex: 0, after: eventRecord };
        await executeWriteContract({
          mode,
          entity: "kommunikation_infochannel_notice_event",
          operation: "create",
          actionId:
            eventType === "reminder"
              ? "kommunikation.infochannel.reminder"
              : "kommunikation.infochannel.escalation",
          actorId,
          actorRole,
          targetId: eventRecord.id,
          requestId: context.requestId,
          authz: true,
          audit,
          auditContext,
          logger,
          alerter,
          perform: async () => {
            const chain = await loadAuditChainState(
              paths,
              "kommunikation_infochannel_notice_event"
            );
            auditContext.hashPrev = chain.hashPrev;
            auditContext.hashIndex = chain.hashIndex;
            validateInfochannelEvent(eventRecord);
            const { checksum } = await writeEntityFile(
              paths,
              "kommunikation_infochannel_notice_event",
              eventRecord.id,
              eventRecord
            );
            await appendAuditRecord(
              paths,
              "kommunikation_infochannel_notice_event",
              {
                actionId:
                  eventType === "reminder"
                    ? "kommunikation.infochannel.reminder"
                    : "kommunikation.infochannel.escalation",
                actor: buildActor(actorId, actorRole),
                target: {
                  type: "kommunikation_infochannel_notice_event",
                  id: eventRecord.id,
                },
                requestId: context.requestId || "infochannel-sla",
                result: "success",
                before: null,
                after: eventRecord,
                afterChecksum: checksum,
              },
              chain
            );
            return eventRecord;
          },
        });

        emitAudit(auditEvent, `kommunikation.infochannel.${eventType}`, {
          actorId,
          actorRole,
          noticeId: notice.id,
          trainerId,
          slaDueAt: notice.slaDueAt,
          jobId,
        });
        eventIds.add(eventId);
        if (eventType === "reminder") {
          reminderCount += 1;
        } else {
          escalationCount += 1;
        }
      }
    }

    return {
      reminders: reminderCount,
      escalations: escalationCount,
      jobId,
    };
  }

  return {
    publishNotice,
    listNotices,
    getNotice,
    confirmNotice,
    runSlaJob,
  };
}
