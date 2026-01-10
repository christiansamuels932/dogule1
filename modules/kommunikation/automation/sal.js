import crypto from "node:crypto";
import fs from "node:fs/promises";
import nodemailer from "nodemailer";
import { logEvent } from "../../shared/logging/logger.js";
import { alertEvent } from "../../shared/logging/alerts.js";
import { StorageError, STORAGE_ERROR_CODES } from "../../shared/storage/errors.js";
import { getStorageMode } from "../../shared/storage/config.js";
import { resolvePaths } from "../../shared/storage/real/paths.js";
import { writeEntityFile } from "../../shared/storage/real/dataFile.js";
import { loadEntity } from "../../shared/storage/real/read.js";
import { loadAuditChainState, appendAuditRecord } from "../../shared/storage/real/audit.js";
import {
  validateAutomationSettings,
  validateAutomationEvent,
} from "../../shared/storage/real/validators.js";
import { resolveAutomationConfig } from "./config.js";

const SETTINGS_ENTITY = "kommunikation_automation_settings";
const EVENTS_ENTITY = "kommunikation_automation_event";
const SETTINGS_ID = "default";

class AutomationError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "AutomationError";
    this.code = code;
    if (details) this.details = details;
  }
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

function ensureActor(context) {
  if (!context?.actorId || !context?.actorRole) {
    throw new AutomationError("INVALID_CONTEXT", "actorId and actorRole are required");
  }
  return { actorId: context.actorId, actorRole: context.actorRole };
}

function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `evt-${Math.random().toString(36).slice(2)}`;
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

function normalizeSettings(input = {}, existing, defaults, now) {
  const createdAt = existing?.createdAt || now;
  const updatedAt = now;
  return {
    id: SETTINGS_ID,
    provider: input.provider ?? existing?.provider ?? defaults.provider,
    senderEmail: input.senderEmail ?? existing?.senderEmail ?? defaults.senderEmail,
    senderName: input.senderName ?? existing?.senderName ?? defaults.senderName,
    replyTo: input.replyTo ?? existing?.replyTo ?? defaults.replyTo,
    smtpHost: input.smtpHost ?? existing?.smtpHost ?? defaults.smtpHost,
    smtpPort: input.smtpPort ?? existing?.smtpPort ?? defaults.smtpPort,
    smtpSecure: input.smtpSecure ?? existing?.smtpSecure ?? defaults.smtpSecure,
    smtpUser: input.smtpUser ?? existing?.smtpUser ?? defaults.smtpUser,
    smtpPassword: input.smtpPassword ?? existing?.smtpPassword ?? defaults.smtpPassword,
    sendingEnabled: input.sendingEnabled ?? existing?.sendingEnabled ?? defaults.sendingEnabled,
    birthdayEnabled: input.birthdayEnabled ?? existing?.birthdayEnabled ?? defaults.birthdayEnabled,
    certificateEnabled:
      input.certificateEnabled ?? existing?.certificateEnabled ?? defaults.certificateEnabled,
    createdAt,
    updatedAt,
    schemaVersion: 1,
  };
}

function resolveEventStatus(eventType, settings) {
  const enabled = eventType === "birthday" ? settings.birthdayEnabled : settings.certificateEnabled;
  if (!enabled) {
    return { status: "skipped", reason: "automation-disabled" };
  }
  if (!settings.sendingEnabled) {
    return { status: "prepared", reason: "sending-disabled" };
  }
  const smtpReady = Boolean(settings.smtpHost && settings.smtpUser && settings.senderEmail);
  if (!smtpReady) {
    return { status: "prepared", reason: "smtp-missing" };
  }
  return { status: "prepared", reason: "awaiting-approval" };
}

function ensureSmtpReady(settings) {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
    throw new AutomationError("SMTP_NOT_READY", "SMTP settings incomplete");
  }
  if (!settings.senderEmail) {
    throw new AutomationError("SMTP_NOT_READY", "senderEmail missing");
  }
}

function buildTransport(settings) {
  const port = settings.smtpPort ? Number(settings.smtpPort) : undefined;
  return nodemailer.createTransport({
    host: settings.smtpHost,
    port: port || (settings.smtpSecure ? 465 : 587),
    secure: Boolean(settings.smtpSecure),
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
  });
}

function buildMailForEvent(event, settings) {
  const sender = settings.senderName
    ? `${settings.senderName} <${settings.senderEmail}>`
    : settings.senderEmail;
  const replyTo = settings.replyTo || undefined;
  if (!event.recipientEmail) {
    throw new AutomationError("INVALID_INPUT", "recipientEmail required for sending");
  }
  if (event.eventType === "birthday") {
    return {
      from: sender,
      to: event.recipientEmail,
      replyTo,
      subject: "Happy Birthday",
      text: "Alles Gute zum Geburtstag von uns bei Fontanas Dogworld!",
    };
  }
  return {
    from: sender,
    to: event.recipientEmail,
    replyTo,
    subject: "Zertifikat",
    text: "Ihr Zertifikat ist bereit. Bitte melden Sie sich bei uns, falls Sie es nochmals benötigen.",
  };
}

export function createAutomationSal(options = {}) {
  const mode = options.mode || getStorageMode();
  if (mode !== "real") {
    throw new AutomationError("INVALID_MODE", `automation requires real storage; got ${mode}`);
  }
  const paths = resolvePaths(options.paths);
  const logger = options.logger || logEvent;
  const alerter = options.alerter || alertEvent;
  const audit = options.audit || (() => {});
  const now = options.now || (() => new Date().toISOString());
  const defaults = resolveAutomationConfig(options.config || {});

  function authorize(context, actionId) {
    if (!isAllowedAction(context?.authz, actionId)) {
      audit({
        actionId: "kommunikation.automation.denied",
        actorId: context?.actorId,
        actorRole: context?.actorRole,
        action: actionId,
        result: "denied",
      });
      throw new AutomationError("DENIED", `${actionId} not allowed`);
    }
  }

  async function loadSettingsRecord() {
    try {
      const loaded = await loadEntity(paths, SETTINGS_ENTITY, SETTINGS_ID, { logger, alerter });
      return loaded.data;
    } catch (error) {
      if (error instanceof StorageError && error.code === STORAGE_ERROR_CODES.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  async function getSettings(context = {}) {
    authorize(context, "kommunikation.system.view");
    const existing = await loadSettingsRecord();
    if (existing) return existing;
    const record = normalizeSettings({}, null, defaults, now());
    validateAutomationSettings(record);
    return record;
  }

  async function updateSettings(patch = {}, context = {}) {
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.system.manage");
    const existing = await loadSettingsRecord();
    const record = normalizeSettings(patch, existing, defaults, now());
    validateAutomationSettings(record);

    const chainState = await loadAuditChainState(paths, SETTINGS_ENTITY);
    const { checksum } = await writeEntityFile(paths, SETTINGS_ENTITY, SETTINGS_ID, record);
    await appendAuditRecord(
      paths,
      SETTINGS_ENTITY,
      {
        actionId: "kommunikation.system.manage",
        actor: { type: actorRole === "system" ? "system" : "user", id: actorId, role: actorRole },
        target: { type: SETTINGS_ENTITY, id: SETTINGS_ID },
        requestId: context.requestId || "automation-settings",
        result: "success",
        before: existing || null,
        after: record,
        afterChecksum: checksum,
      },
      chainState
    );
    return record;
  }

  async function listEvents({ limit } = {}, context = {}) {
    authorize(context, "kommunikation.system.view");
    const events = await listAllEntities(paths, EVENTS_ENTITY, logger, alerter);
    const sorted = events.sort((a, b) => {
      if (a.createdAt > b.createdAt) return -1;
      if (a.createdAt < b.createdAt) return 1;
      return (a.id || "").localeCompare(b.id || "");
    });
    const max = limit && Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 25;
    return { events: sorted.slice(0, max) };
  }

  async function testConnection(context = {}) {
    ensureActor(context);
    authorize(context, "kommunikation.system.manage");
    const settings = await getSettings(context);
    ensureSmtpReady(settings);
    const transport = buildTransport(settings);
    try {
      await transport.verify();
      return { ok: true };
    } catch (error) {
      throw new AutomationError("SMTP_FAILED", error?.message || "smtp failed");
    }
  }

  async function updateEvent(id, patch = {}, context = {}) {
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.system.manage");
    if (!id) throw new AutomationError("INVALID_INPUT", "event id required");

    let existing = null;
    try {
      const loaded = await loadEntity(paths, EVENTS_ENTITY, id, { logger, alerter });
      existing = loaded.data;
    } catch (error) {
      if (error instanceof StorageError && error.code === STORAGE_ERROR_CODES.NOT_FOUND) {
        throw new AutomationError("NOT_FOUND", "event not found");
      }
      throw error;
    }

    const nextDecision = patch.decision || existing.decision || "";
    const decisionNow = nextDecision && !existing.decidedAt ? now() : existing.decidedAt || "";
    const decisionBy = nextDecision && !existing.decidedBy ? actorId : existing.decidedBy || "";

    let nextStatus = patch.status || existing.status || "prepared";
    let nextReason = patch.reason || existing.reason || "";
    let sentAt = existing.sentAt || "";
    let sendError = existing.sendError || "";

    if (nextDecision === "approved" && existing.status !== "sent") {
      const settings = await getSettings(context);
      if (!settings.sendingEnabled) {
        nextStatus = "approved";
        nextReason = "sending-disabled";
      } else {
        try {
          ensureSmtpReady(settings);
          const transport = buildTransport(settings);
          const mail = buildMailForEvent(existing, settings);
          await transport.sendMail(mail);
          nextStatus = "sent";
          nextReason = "smtp-sent";
          sentAt = now();
          sendError = "";
        } catch (error) {
          if (error?.code === "SMTP_NOT_READY") {
            nextStatus = "approved";
            nextReason = "smtp-missing";
            sentAt = "";
            sendError = error?.message || "smtp not ready";
          } else {
            nextStatus = "failed";
            nextReason = "smtp-error";
            sentAt = "";
            sendError = error?.message || "smtp error";
          }
        }
      }
    }

    const record = {
      ...existing,
      status: nextStatus,
      reason: nextReason,
      decision: nextDecision,
      decidedAt: decisionNow,
      decidedBy: decisionBy,
      sentAt,
      sendError,
    };
    validateAutomationEvent(record);

    const chainState = await loadAuditChainState(paths, EVENTS_ENTITY);
    const { checksum } = await writeEntityFile(paths, EVENTS_ENTITY, record.id, record);
    await appendAuditRecord(
      paths,
      EVENTS_ENTITY,
      {
        actionId: "kommunikation.system.manage",
        actor: { type: actorRole === "system" ? "system" : "user", id: actorId, role: actorRole },
        target: { type: EVENTS_ENTITY, id: record.id },
        requestId: context.requestId || "automation-event",
        result: "success",
        before: existing,
        after: record,
        afterChecksum: checksum,
      },
      chainState
    );
    return record;
  }

  async function recordEvent(payload = {}, context = {}) {
    const { actorId, actorRole } = ensureActor(context);
    authorize(context, "kommunikation.system.manage");
    const settings = await getSettings(context);
    const eventType = String(payload.eventType || "").trim();
    if (!["birthday", "certificate_delivery"].includes(eventType)) {
      throw new AutomationError(
        "INVALID_INPUT",
        "eventType must be birthday or certificate_delivery"
      );
    }
    const statusMeta = resolveEventStatus(eventType, settings);
    const record = {
      id: uuid(),
      eventType,
      status: statusMeta.status,
      reason: statusMeta.reason,
      senderEmail: settings.senderEmail || "",
      recipientEmail: payload.recipientEmail || "",
      kundeId: payload.kundeId || "",
      hundId: payload.hundId || "",
      zertifikatId: payload.zertifikatId || "",
      actorId,
      actorRole,
      createdAt: now(),
      schemaVersion: 1,
    };
    validateAutomationEvent(record);
    const chainState = await loadAuditChainState(paths, EVENTS_ENTITY);
    const { checksum } = await writeEntityFile(paths, EVENTS_ENTITY, record.id, record);
    await appendAuditRecord(
      paths,
      EVENTS_ENTITY,
      {
        actionId: "kommunikation.system.manage",
        actor: { type: actorRole === "system" ? "system" : "user", id: actorId, role: actorRole },
        target: { type: EVENTS_ENTITY, id: record.id },
        requestId: context.requestId || "automation-event",
        result: "success",
        before: null,
        after: record,
        afterChecksum: checksum,
      },
      chainState
    );
    return record;
  }

  return {
    getSettings,
    updateSettings,
    listEvents,
    testConnection,
    updateEvent,
    recordEvent,
  };
}
