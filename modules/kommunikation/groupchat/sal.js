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
import { resolveGroupchatRetentionConfig } from "./config.js";
import {
  validateGroupchatRoom,
  validateGroupchatMessage,
  validateGroupchatReadMarker,
  validateGroupchatSendDedupe,
} from "../../shared/storage/real/validators.js";
import { sha256Hex } from "../../shared/storage/real/utils.js";

const ROOM_ID = "global";
const ROOM_TITLE = "Gruppenchat";
const MAX_MESSAGE_LENGTH = 2000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RETENTION_ACTOR_ID = "system:retention";
const RETENTION_ACTOR_ROLE = "system";
const lastPruneAt = new Map();

class GroupchatError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "GroupchatError";
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

function encodeCursor(createdAt, id, cutoffTs) {
  const payload = { createdAt, id };
  if (cutoffTs) payload.cutoffTs = cutoffTs;
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    if (parsed.cutoffTs && typeof parsed.cutoffTs !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function compareMessageOrder(a, b) {
  if (a.createdAt < b.createdAt) return -1;
  if (a.createdAt > b.createdAt) return 1;
  return a.id.localeCompare(b.id);
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
  return new GroupchatError("RATE_LIMITED", `${actionId} is rate limited`, {
    retryAfterSeconds,
  });
}

function clientNonceHash(value) {
  return sha256Hex(value).slice(0, 24);
}

function dedupeIdFor(key) {
  return sha256Hex(key).slice(0, 24);
}

function markerIdFor(roomId, actorId) {
  return sha256Hex(`${roomId}:${actorId}`).slice(0, 24);
}

async function loadMessageById(paths, id, logger, alerter) {
  try {
    const loaded = await loadEntity(paths, "kommunikation_groupchat_message", id, {
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

async function listAllMessages(paths, roomId, logger, alerter) {
  const dir = paths.entityDir("kommunikation_groupchat_message");
  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const messages = [];
  for (const file of entries.filter((name) => name.endsWith(".json"))) {
    const id = file.replace(/\.json$/, "");
    const loaded = await loadEntity(paths, "kommunikation_groupchat_message", id, {
      logger,
      alerter,
    });
    if (loaded.data.roomId === roomId) {
      messages.push(loaded.data);
    }
  }
  return messages.sort(compareMessageOrder);
}

async function loadReadMarker(paths, roomId, actorId, logger, alerter) {
  const markerId = markerIdFor(roomId, actorId);
  try {
    const loaded = await loadEntity(paths, "kommunikation_groupchat_read_marker", markerId, {
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

async function loadDedupe(paths, key, logger, alerter) {
  const id = dedupeIdFor(key);
  try {
    const loaded = await loadEntity(paths, "kommunikation_groupchat_send_dedupe", id, {
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

function buildRoom(nowIso) {
  return {
    id: ROOM_ID,
    title: ROOM_TITLE,
    retentionDays: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    schemaVersion: 1,
  };
}

function compareByCursor(messages, cursor) {
  if (!cursor) return 0;
  const foundIndex = messages.findIndex((msg) => {
    if (msg.createdAt > cursor.createdAt) return true;
    if (msg.createdAt === cursor.createdAt && msg.id > cursor.id) return true;
    return false;
  });
  if (foundIndex === -1) return messages.length;
  return foundIndex;
}

function validateLimit(limit) {
  if (limit === undefined || limit === null) return DEFAULT_LIMIT;
  const parsed = Number(limit);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

function parseRetentionDaysValue(value, label) {
  if (value === undefined || value === null) return null;
  if (!Number.isInteger(value) || value < 1) {
    throw new GroupchatError("INVALID_CONFIG", `${label} must be an integer >= 1`);
  }
  return value;
}

function resolveRetentionDays(roomRetention, defaultRetention) {
  if (roomRetention !== null && roomRetention !== undefined) {
    return {
      retentionDays: parseRetentionDaysValue(roomRetention, "room.retentionDays"),
      source: "room",
    };
  }
  if (defaultRetention !== null && defaultRetention !== undefined) {
    return {
      retentionDays: parseRetentionDaysValue(defaultRetention, "defaultRetentionDays"),
      source: "default",
    };
  }
  return { retentionDays: null, source: null };
}

function computeCutoffTs(nowIso, retentionDays) {
  if (!retentionDays) return null;
  const nowMs = Date.parse(nowIso);
  const baseMs = Number.isNaN(nowMs) ? Date.now() : nowMs;
  return new Date(baseMs - retentionDays * 86400_000).toISOString();
}

function clampReadMarkerTs(markerTs, cutoffTs) {
  if (!markerTs && !cutoffTs) return null;
  if (!markerTs) return cutoffTs;
  if (!cutoffTs) return markerTs;
  return Date.parse(markerTs) >= Date.parse(cutoffTs) ? markerTs : cutoffTs;
}

function shouldPruneNow(roomId, nowMs, intervalMs) {
  const last = lastPruneAt.get(roomId) || 0;
  if (nowMs - last < intervalMs) return false;
  lastPruneAt.set(roomId, nowMs);
  return true;
}

function ensureActor(context) {
  if (!context?.actorId || !context?.actorRole) {
    throw new GroupchatError("INVALID_CONTEXT", "actorId and actorRole are required");
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
    requestId: requestId || "groupchat",
    key,
  });
  if (logger) {
    logger({
      actionId,
      actor: buildActor(actorId, actorRole),
      target: { type: "ratelimit", id: key },
      result: "rate_limited",
      requestId: requestId || "groupchat",
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

export function createGroupchatSal(options = {}) {
  const mode = options.mode || getStorageMode();
  const paths = resolvePaths(options.paths);
  const logger = options.logger || logEvent;
  const alerter = options.alerter || alertEvent;
  const audit = options.audit || (() => {});
  const auditEvent = options.auditEvent || audit;
  const limiter = options.rateLimiter || rateLimit;
  const now = options.now || (() => new Date().toISOString());
  const nowMs = options.nowMs || (() => Date.now());
  const retentionConfig = resolveGroupchatRetentionConfig(
    options.retentionConfig || options.retention || {}
  );
  const pruneMode = options.pruneMode || "async";

  async function ensureRoomExists(context) {
    try {
      const loaded = await loadEntity(paths, "kommunikation_groupchat_room", ROOM_ID, {
        logger,
        alerter,
      });
      return loaded.data;
    } catch (error) {
      if (error instanceof StorageError && error.code === STORAGE_ERROR_CODES.NOT_FOUND) {
        const nowIso = now();
        const roomRecord = buildRoom(nowIso);
        validateGroupchatRoom(roomRecord);
        const auditContext = { hashPrev: 0, hashIndex: 0, after: roomRecord };
        await executeWriteContract({
          mode,
          entity: "kommunikation_groupchat_room",
          operation: "create",
          actionId: "kommunikation.chat.room.ensure",
          actorId: context?.actorId || "system",
          actorRole: context?.actorRole || "system",
          authz: true,
          audit,
          auditContext,
          logger,
          alerter,
          perform: async () => {
            const chain = await loadAuditChainState(paths, "kommunikation_groupchat_room");
            auditContext.hashPrev = chain.hashPrev;
            auditContext.hashIndex = chain.hashIndex;
            const { checksum } = await writeEntityFile(
              paths,
              "kommunikation_groupchat_room",
              ROOM_ID,
              roomRecord
            );
            await appendAuditRecord(
              paths,
              "kommunikation_groupchat_room",
              {
                actionId: "kommunikation.chat.room.ensure",
                actor: buildActor(context?.actorId || "system", context?.actorRole || "system"),
                target: { type: "kommunikation_groupchat_room", id: ROOM_ID },
                requestId: context?.requestId || "groupchat-room",
                result: "success",
                before: null,
                after: roomRecord,
                afterChecksum: checksum,
              },
              chain
            );
            return roomRecord;
          },
        });
        return roomRecord;
      }
      throw error;
    }
  }

  function authorize(context, actionId) {
    if (!isAllowedAction(context?.authz, actionId)) {
      const deniedAudit =
        actionId === "kommunikation.chat.readMarker.set"
          ? "kommunikation.groupchat.read_marker.denied"
          : actionId === "kommunikation.chat.send"
            ? "kommunikation.groupchat.send.denied"
            : null;
      if (deniedAudit) {
        emitAudit(auditEvent, deniedAudit, {
          actorId: context?.actorId,
          actorRole: context?.actorRole,
          roomId: ROOM_ID,
          action: actionId,
          result: "denied",
        });
      }
      throw new GroupchatError("DENIED", `${actionId} not allowed`);
    }
  }

  async function deleteMessageRecord(messageRecord, requestId) {
    const messagePath = paths.dataFile("kommunikation_groupchat_message", messageRecord.id);
    try {
      await fs.stat(messagePath);
    } catch (error) {
      if (error.code === "ENOENT") return false;
      throw error;
    }
    const auditContext = { hashPrev: 0, hashIndex: 0, before: messageRecord, after: null };
    await executeWriteContract({
      mode,
      entity: "kommunikation_groupchat_message",
      operation: "delete",
      actionId: "kommunikation.groupchat.retention.prune",
      actorId: RETENTION_ACTOR_ID,
      actorRole: RETENTION_ACTOR_ROLE,
      targetId: messageRecord.id,
      requestId,
      authz: true,
      audit,
      auditContext,
      logger,
      alerter,
      perform: async () => {
        const chain = await loadAuditChainState(paths, "kommunikation_groupchat_message");
        auditContext.hashPrev = chain.hashPrev;
        auditContext.hashIndex = chain.hashIndex;
        await fs.rm(messagePath, { force: true });
        await appendAuditRecord(
          paths,
          "kommunikation_groupchat_message",
          {
            actionId: "kommunikation.groupchat.retention.prune",
            actor: buildActor(RETENTION_ACTOR_ID, RETENTION_ACTOR_ROLE),
            target: { type: "kommunikation_groupchat_message", id: messageRecord.id },
            requestId: requestId || "groupchat-retention",
            result: "success",
            before: messageRecord,
            after: null,
          },
          chain
        );
        return { id: messageRecord.id };
      },
    });
    return true;
  }

  async function runRetentionPrune({ roomId, retentionDays, cutoffTs, requestId }) {
    const pruneConfig = retentionConfig.prune;
    const jobId = crypto.randomUUID ? crypto.randomUUID() : uuidv7();
    emitAudit(auditEvent, "kommunikation.groupchat.retention.prune", {
      actorId: RETENTION_ACTOR_ID,
      actorRole: RETENTION_ACTOR_ROLE,
      roomId,
      retentionDays,
      cutoffTs,
      deletedCount: 0,
      stopReason: "complete",
      jobId,
      phase: "start",
      requestId: requestId || "groupchat-retention",
    });

    let deletedCount = 0;
    let stopReason = "complete";
    try {
      const allMessages = await listAllMessages(paths, roomId, logger, alerter);
      const expired = allMessages.filter((msg) => msg.createdAt < cutoffTs);
      if (!expired.length) {
        emitAudit(auditEvent, "kommunikation.groupchat.retention.prune.noop", {
          actorId: RETENTION_ACTOR_ID,
          actorRole: RETENTION_ACTOR_ROLE,
          roomId,
          retentionDays,
          cutoffTs,
          deletedCount: 0,
          stopReason: "noop",
          jobId,
          requestId: requestId || "groupchat-retention",
        });
        return { deletedCount: 0, stopReason: "noop" };
      }

      const startedAt = nowMs();
      for (const message of expired) {
        if (deletedCount >= pruneConfig.maxDeletes) {
          stopReason = "limit_reached";
          break;
        }
        if (nowMs() - startedAt >= pruneConfig.timeBudgetMs) {
          stopReason = "time_budget_exceeded";
          break;
        }
        const deleted = await deleteMessageRecord(message, requestId);
        if (deleted) deletedCount += 1;
      }
      if (deletedCount === 0 && stopReason === "complete") {
        stopReason = "noop";
      }
      emitAudit(auditEvent, "kommunikation.groupchat.retention.prune", {
        actorId: RETENTION_ACTOR_ID,
        actorRole: RETENTION_ACTOR_ROLE,
        roomId,
        retentionDays,
        cutoffTs,
        deletedCount,
        stopReason,
        jobId,
        requestId: requestId || "groupchat-retention",
      });
      return { deletedCount, stopReason };
    } catch (error) {
      emitAudit(auditEvent, "kommunikation.groupchat.retention.prune", {
        actorId: RETENTION_ACTOR_ID,
        actorRole: RETENTION_ACTOR_ROLE,
        roomId,
        retentionDays,
        cutoffTs,
        deletedCount,
        stopReason: "error",
        jobId,
        requestId: requestId || "groupchat-retention",
        errorCode: error?.code || error?.message,
      });
      throw error;
    }
  }

  function maybePrune(roomId, retentionDays, cutoffTs, context) {
    if (!retentionDays || !cutoffTs) return null;
    const pruneConfig = retentionConfig.prune;
    if (!pruneConfig?.enabled) {
      emitAudit(auditEvent, "kommunikation.groupchat.retention.prune.noop", {
        actorId: RETENTION_ACTOR_ID,
        actorRole: RETENTION_ACTOR_ROLE,
        roomId,
        retentionDays,
        cutoffTs,
        deletedCount: 0,
        stopReason: "disabled",
        requestId: context?.requestId || "groupchat-retention",
      });
      return null;
    }
    if (!shouldPruneNow(roomId, nowMs(), pruneConfig.intervalMs)) {
      return null;
    }
    const runner = () =>
      runRetentionPrune({
        roomId,
        retentionDays,
        cutoffTs,
        requestId: context?.requestId,
      });

    if (pruneMode === "sync") {
      return runner();
    }
    if (typeof globalThis.queueMicrotask === "function") {
      globalThis.queueMicrotask(() => runner().catch(() => {}));
    } else if (typeof globalThis.setTimeout === "function") {
      globalThis.setTimeout(() => runner().catch(() => {}), 0);
    } else {
      runner().catch(() => {});
    }
    return null;
  }

  async function sendMessage(roomId = ROOM_ID, payload = {}, context = {}) {
    if (roomId !== ROOM_ID) {
      throw new GroupchatError("INVALID_INPUT", "Only the global room is supported");
    }
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.chat.send");

    enforceRateLimit(limiter, {
      actionId: "kommunikation.chat.send",
      actorId,
      actorRole,
      windowMs: 60_000,
      limit: 10,
      requestId: context.requestId,
      logger,
    });
    enforceRateLimit(limiter, {
      actionId: "kommunikation.chat.send",
      actorId,
      actorRole,
      windowMs: 60 * 60 * 1000,
      limit: 120,
      requestId: context.requestId,
      logger,
    });

    const trimmedBody = (payload.body || "").trim();
    if (!trimmedBody) {
      throw new GroupchatError("INVALID_INPUT", "Message body is required");
    }
    if (trimmedBody.length > MAX_MESSAGE_LENGTH) {
      throw new GroupchatError("INVALID_INPUT", "Message body too long", {
        maxLength: MAX_MESSAGE_LENGTH,
      });
    }
    const clientNonce = (payload.clientNonce || "").trim();
    if (!clientNonce) {
      throw new GroupchatError("INVALID_INPUT", "clientNonce is required");
    }
    const nowIso = now();
    const room = await ensureRoomExists(context);
    const { retentionDays } = resolveRetentionDays(
      room?.retentionDays ?? null,
      retentionConfig.defaultRetentionDays ?? null
    );

    const dedupeKey = `${roomId}:${actorId}:${clientNonce}`;
    const dedupeExisting = await loadDedupe(paths, dedupeKey, logger, alerter);
    if (dedupeExisting && Date.parse(dedupeExisting.expiresAt) > Date.now()) {
      const existing = await loadMessageById(paths, dedupeExisting.messageId, logger, alerter);
      if (existing) {
        return existing;
      }
    }

    const messageRecord = {
      id: uuidv7(),
      roomId,
      createdAt: nowIso,
      authorActorId: actorId,
      authorRole: actorRole,
      body: trimmedBody,
      clientNonce,
      status: "committed",
      schemaVersion: 1,
    };
    const auditContext = { hashPrev: 0, hashIndex: 0, after: messageRecord };

    try {
      const result = await executeWriteContract({
        mode,
        entity: "kommunikation_groupchat_message",
        operation: "create",
        actionId: "kommunikation.chat.send",
        actorId,
        actorRole,
        targetId: messageRecord.id,
        requestId: context.requestId,
        authz: true,
        audit,
        auditContext,
        logger,
        alerter,
        perform: async () => {
          const messageFilePath = paths.dataFile(
            "kommunikation_groupchat_message",
            messageRecord.id
          );
          const dedupeFilePath = paths.dataFile(
            "kommunikation_groupchat_send_dedupe",
            dedupeIdFor(dedupeKey)
          );
          let messageWritten = false;
          let dedupeWritten = false;
          try {
            const chain = await loadAuditChainState(paths, "kommunikation_groupchat_message");
            auditContext.hashPrev = chain.hashPrev;
            auditContext.hashIndex = chain.hashIndex;
            validateGroupchatMessage(messageRecord);
            const { checksum } = await writeEntityFile(
              paths,
              "kommunikation_groupchat_message",
              messageRecord.id,
              messageRecord
            );
            messageWritten = true;
            await appendAuditRecord(
              paths,
              "kommunikation_groupchat_message",
              {
                actionId: "kommunikation.chat.send",
                actor: buildActor(actorId, actorRole),
                target: { type: "kommunikation_groupchat_message", id: messageRecord.id },
                requestId: context.requestId || "groupchat-send",
                result: "success",
                before: null,
                after: messageRecord,
                afterChecksum: checksum,
              },
              chain
            );

            const dedupeRecord = {
              id: dedupeIdFor(dedupeKey),
              key: dedupeKey,
              roomId,
              actorId,
              clientNonceHash: clientNonceHash(clientNonce),
              messageId: messageRecord.id,
              createdAt: nowIso,
              expiresAt: new Date(Date.now() + DEDUPE_WINDOW_MS).toISOString(),
              schemaVersion: 1,
            };
            validateGroupchatSendDedupe(dedupeRecord);
            const dedupeChain = await loadAuditChainState(
              paths,
              "kommunikation_groupchat_send_dedupe"
            );
            const { checksum: dedupeChecksum } = await writeEntityFile(
              paths,
              "kommunikation_groupchat_send_dedupe",
              dedupeRecord.id,
              dedupeRecord
            );
            dedupeWritten = true;
            await appendAuditRecord(
              paths,
              "kommunikation_groupchat_send_dedupe",
              {
                actionId: "kommunikation.chat.send",
                actor: buildActor(actorId, actorRole),
                target: { type: "kommunikation_groupchat_send_dedupe", id: dedupeRecord.id },
                requestId: context.requestId || "groupchat-send",
                result: "success",
                before: null,
                after: dedupeRecord,
                afterChecksum: dedupeChecksum,
              },
              dedupeChain
            );
            return messageRecord;
          } catch (error) {
            if (dedupeWritten) {
              await fs.rm(dedupeFilePath, { force: true }).catch(() => {});
            }
            if (messageWritten) {
              await fs.rm(messageFilePath, { force: true }).catch(() => {});
            }
            throw error;
          }
        },
      });

      emitAudit(auditEvent, "kommunikation.groupchat.send.accepted", {
        actorId,
        actorRole,
        roomId,
        messageId: result.id,
        bodyLength: trimmedBody.length,
        clientNonceHash: clientNonceHash(clientNonce),
      });
      if (retentionDays !== null) {
        const cutoffTs = computeCutoffTs(nowIso, retentionDays);
        const pruneTask = maybePrune(roomId, retentionDays, cutoffTs, context);
        if (pruneTask) {
          await pruneTask;
        }
      }
      return result;
    } catch (error) {
      const isRateLimited = error instanceof GroupchatError && error.code === "RATE_LIMITED";
      emitAudit(
        auditEvent,
        isRateLimited
          ? "kommunikation.groupchat.send.rate_limited"
          : "kommunikation.groupchat.send.failed",
        {
          actorId,
          actorRole,
          roomId,
          messageId: messageRecord.id,
          bodyLength: trimmedBody.length,
          clientNonceHash: clientNonceHash(clientNonce),
          retryAfter: error.details?.retryAfterSeconds,
          errorCode: error.code || error?.message,
        }
      );
      throw error;
    }
  }

  async function listMessages(roomId = ROOM_ID, params = {}, context = {}) {
    if (roomId !== ROOM_ID) {
      throw new GroupchatError("INVALID_INPUT", "Only the global room is supported");
    }
    ensureActor(context);
    authorize(context, "kommunikation.chat.read");
    enforceRateLimit(limiter, {
      actionId: "kommunikation.chat.read",
      actorId: context.actorId,
      actorRole: context.actorRole,
      windowMs: 60_000,
      limit: 120,
      requestId: context.requestId,
      logger,
    });

    const room = await ensureRoomExists(context);
    const cursorData = decodeCursor(params.cursor);
    const limit = validateLimit(params.limit);
    const allMessages = await listAllMessages(paths, roomId, logger, alerter);
    const { retentionDays, source } = resolveRetentionDays(
      room?.retentionDays ?? null,
      retentionConfig.defaultRetentionDays ?? null
    );
    const retentionEnabled = retentionDays !== null;
    const cutoffTs = retentionEnabled
      ? cursorData?.cutoffTs || computeCutoffTs(now(), retentionDays)
      : null;
    const visibleMessages = retentionEnabled
      ? allMessages.filter((msg) => msg.createdAt >= cutoffTs)
      : allMessages;
    const truncatedDueToRetention = retentionEnabled && visibleMessages.length < allMessages.length;
    const startIndex = compareByCursor(visibleMessages, cursorData);
    const messages = visibleMessages.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < visibleMessages.length
        ? encodeCursor(
            visibleMessages[startIndex + limit - 1].createdAt,
            visibleMessages[startIndex + limit - 1].id,
            retentionEnabled ? cutoffTs : null
          )
        : undefined;

    let readMarker = null;
    let unreadCount = undefined;
    if (context.actorId) {
      readMarker = await loadReadMarker(paths, roomId, context.actorId, logger, alerter);
      if (readMarker) {
        if (retentionEnabled) {
          const markerMessage = await loadMessageById(
            paths,
            readMarker.lastReadMessageId,
            logger,
            alerter
          );
          const markerTs = markerMessage?.createdAt || null;
          const effectiveMarkerTs = clampReadMarkerTs(markerTs, cutoffTs);
          unreadCount = visibleMessages.filter((msg) => msg.createdAt > effectiveMarkerTs).length;
        } else {
          const markerIndex = allMessages.findIndex(
            (msg) => msg.id === readMarker.lastReadMessageId
          );
          unreadCount =
            markerIndex === -1 ? allMessages.length : allMessages.length - (markerIndex + 1);
        }
      } else {
        unreadCount = visibleMessages.length;
      }
    }

    const retention = {
      enabled: retentionEnabled,
      retentionDays: retentionEnabled ? retentionDays : null,
      cutoffTs: retentionEnabled ? cutoffTs : null,
      source: retentionEnabled ? source : null,
    };
    const truncated = { dueToRetention: Boolean(truncatedDueToRetention) };

    const pruneTask = retentionEnabled
      ? maybePrune(roomId, retentionDays, cutoffTs, context)
      : null;
    if (pruneTask) {
      await pruneTask;
    }

    return {
      messages,
      nextCursor,
      readMarker: readMarker
        ? { lastReadMessageId: readMarker.lastReadMessageId, lastReadAt: readMarker.lastReadAt }
        : undefined,
      unreadCount,
      retention,
      truncated,
    };
  }

  async function getReadMarker(roomId = ROOM_ID, context = {}) {
    if (roomId !== ROOM_ID) {
      throw new GroupchatError("INVALID_INPUT", "Only the global room is supported");
    }
    const { actorId } = ensureActor(context);
    authorize(context, "kommunikation.chat.read");
    const marker = await loadReadMarker(paths, roomId, actorId, logger, alerter);
    if (!marker) {
      return { lastReadMessageId: null, lastReadAt: null };
    }
    return { lastReadMessageId: marker.lastReadMessageId, lastReadAt: marker.lastReadAt };
  }

  async function setReadMarker(roomId = ROOM_ID, payload = {}, context = {}) {
    if (roomId !== ROOM_ID) {
      throw new GroupchatError("INVALID_INPUT", "Only the global room is supported");
    }
    const { actorId, actorRole } = ensureActor(context);
    if (context.actorId !== actorId) {
      throw new GroupchatError("DENIED", "Cannot set marker for another actor");
    }
    authorize(context, "kommunikation.chat.readMarker.set");
    enforceRateLimit(limiter, {
      actionId: "kommunikation.chat.readMarker.set",
      actorId,
      actorRole,
      windowMs: 60_000,
      limit: 60,
      requestId: context.requestId,
      logger,
    });
    await ensureRoomExists(context);
    const targetMessageId = payload.lastReadMessageId;
    if (!targetMessageId) {
      throw new GroupchatError("INVALID_INPUT", "lastReadMessageId is required");
    }
    const targetMessage = await loadMessageById(paths, targetMessageId, logger, alerter);
    if (!targetMessage || targetMessage.roomId !== roomId) {
      emitAudit(auditEvent, "kommunikation.groupchat.read_marker.denied", {
        actorId,
        actorRole,
        roomId,
        messageId: targetMessageId,
      });
      throw new GroupchatError("INVALID_INPUT", "Message not found for marker");
    }

    const existingMarker = await loadReadMarker(paths, roomId, actorId, logger, alerter);
    if (existingMarker) {
      const existingMessage = await loadMessageById(
        paths,
        existingMarker.lastReadMessageId,
        logger,
        alerter
      );
      if (existingMessage && compareMessageOrder(existingMessage, targetMessage) >= 0) {
        return {
          lastReadMessageId: existingMarker.lastReadMessageId,
          lastReadAt: existingMarker.lastReadAt,
        };
      }
    }

    const nowIso = now();
    const markerRecord = {
      id: markerIdFor(roomId, actorId),
      roomId,
      actorId,
      lastReadMessageId: targetMessageId,
      lastReadAt: nowIso,
      schemaVersion: 1,
    };
    validateGroupchatReadMarker(markerRecord);
    const auditContext = { hashPrev: 0, hashIndex: 0, after: markerRecord };

    const result = await executeWriteContract({
      mode,
      entity: "kommunikation_groupchat_read_marker",
      operation: "set",
      actionId: "kommunikation.chat.readMarker.set",
      actorId,
      actorRole,
      targetId: markerRecord.id,
      requestId: context.requestId,
      authz: true,
      audit,
      auditContext,
      logger,
      alerter,
      perform: async () => {
        const chain = await loadAuditChainState(paths, "kommunikation_groupchat_read_marker");
        auditContext.hashPrev = chain.hashPrev;
        auditContext.hashIndex = chain.hashIndex;
        const { checksum } = await writeEntityFile(
          paths,
          "kommunikation_groupchat_read_marker",
          markerRecord.id,
          markerRecord
        );
        await appendAuditRecord(
          paths,
          "kommunikation_groupchat_read_marker",
          {
            actionId: "kommunikation.chat.readMarker.set",
            actor: buildActor(actorId, actorRole),
            target: { type: "kommunikation_groupchat_read_marker", id: markerRecord.id },
            requestId: context.requestId || "groupchat-marker",
            result: "success",
            before: null,
            after: markerRecord,
            afterChecksum: checksum,
          },
          chain
        );
        return markerRecord;
      },
    });

    emitAudit(auditEvent, "kommunikation.groupchat.read_marker.set", {
      actorId,
      actorRole,
      roomId,
      messageId: result.lastReadMessageId,
    });
    return { lastReadMessageId: result.lastReadMessageId, lastReadAt: result.lastReadAt };
  }

  return {
    listMessages,
    sendMessage,
    getReadMarker,
    setReadMarker,
  };
}
