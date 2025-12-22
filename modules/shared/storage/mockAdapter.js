import { logEvent } from "../logging/logger.js";
import { alertEvent } from "../logging/alerts.js";
import {
  listKunden,
  getKunde,
  createKunde,
  updateKunde,
  deleteKunde,
} from "../api/kunden.js";
import { listHunde, getHund, createHund, updateHund, deleteHund } from "../api/hunde.js";
import {
  listKurse,
  getKurs,
  createKurs,
  updateKurs,
  deleteKurs,
} from "../api/kurse.js";
import {
  listTrainer,
  getTrainer,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "../api/trainer.js";
import { StorageError, STORAGE_ERROR_CODES } from "./errors.js";
import { executeWriteContract } from "./writeContract.js";

function buildActor(actorId, actorRole) {
  if (!actorId || !actorRole) {
    return { type: "system", id: "storage", role: "system" };
  }
  const type = actorRole === "system" ? "system" : "user";
  return { type, id: actorId, role: actorRole };
}

function buildTarget(entity, id) {
  return { type: entity, id: id || "unknown" };
}

function logReadError({ logger, entity, operation, error, context }) {
  const actionId = context?.actionId || `${entity}.${operation}`;
  const actor = buildActor(context?.actorId, context?.actorRole);
  const target = buildTarget(entity, context?.targetId);
  const requestId = context?.requestId || "storage-read";
  const payload = {
    actionId,
    actor,
    target,
    result: "error",
    requestId,
    message: "STORAGE-READ-ERROR",
    level: "warning",
    severity: "WARNING",
    meta: { code: "STORAGE_READ_ERROR", error: error?.message || "unknown_error" },
  };
  logger(payload);
}

function resolveWriteContext(entity, operation, defaults, context = {}) {
  return {
    mode: defaults.mode,
    entity,
    operation,
    actionId: context.actionId || `${entity}.${operation}`,
    actorId: context.actorId,
    actorRole: context.actorRole,
    targetId: context.targetId,
    requestId: context.requestId,
    authz: context.authz ?? defaults.authz,
    audit: context.audit ?? defaults.audit,
    auditContext: context.auditContext ?? {},
    logger: defaults.logger,
    alerter: defaults.alerter,
  };
}

function wrapRead(entity, operation, handler, defaults) {
  return async (arg, context) => {
    try {
      return await handler(arg, context);
    } catch (error) {
      logReadError({ logger: defaults.logger, entity, operation, error, context });
      throw new StorageError(
        STORAGE_ERROR_CODES.STORAGE_ERROR,
        `Mock read failed for ${entity}.${operation}`,
        { cause: error }
      );
    }
  };
}

function wrapWrite(entity, operation, handler, defaults) {
  return async (arg, context) => {
    const writeContext = resolveWriteContext(entity, operation, defaults, context);
    return executeWriteContract({
      ...writeContext,
      perform: () => handler(arg, context),
    });
  };
}

function normalizeUpdateInput(arg) {
  if (arg && typeof arg === "object" && "id" in arg && "data" in arg) {
    return { id: arg.id, data: arg.data };
  }
  if (Array.isArray(arg)) {
    const [id, data] = arg;
    return { id, data };
  }
  return { id: arg?.id || arg, data: arg?.data || arg?.payload || {} };
}

function buildEntityAdapter(entity, methods, defaults) {
  return {
    list: wrapRead(entity, "list", methods.list, defaults),
    get: wrapRead(entity, "get", methods.get, defaults),
    create: wrapWrite(entity, "create", methods.create, defaults),
    update: wrapWrite(entity, "update", (arg, ctx) => {
      const { id, data } = normalizeUpdateInput(arg);
      return methods.update(id, data, ctx);
    }, defaults),
    delete: wrapWrite(entity, "delete", methods.delete, defaults),
  };
}

export function createMockAdapter(options = {}) {
  const defaults = {
    mode: options.mode || "mock",
    logger: options.logger || logEvent,
    alerter: options.alerter || alertEvent,
    authz: options.authz,
    audit: options.audit,
  };

  return {
    kunden: buildEntityAdapter(
      "kunden",
      {
        list: (ctx) => listKunden(ctx),
        get: (id, ctx) => getKunde(id, ctx),
        create: (data, ctx) => createKunde(data, ctx),
        update: (id, data, ctx) => updateKunde(id, data, ctx),
        delete: (id, ctx) => deleteKunde(id, ctx),
      },
      defaults
    ),
    hunde: buildEntityAdapter(
      "hunde",
      {
        list: (ctx) => listHunde(ctx),
        get: (id, ctx) => getHund(id, ctx),
        create: (data, ctx) => createHund(data, ctx),
        update: (id, data, ctx) => updateHund(id, data, ctx),
        delete: (id, ctx) => deleteHund(id, ctx),
      },
      defaults
    ),
    kurse: buildEntityAdapter(
      "kurse",
      {
        list: (ctx) => listKurse(ctx),
        get: (id, ctx) => getKurs(id, ctx),
        create: (data, ctx) => createKurs(data, ctx),
        update: (id, data, ctx) => updateKurs(id, data, ctx),
        delete: (id, ctx) => deleteKurs(id, ctx),
      },
      defaults
    ),
    trainer: buildEntityAdapter(
      "trainer",
      {
        list: (ctx) => listTrainer(ctx),
        get: (id, ctx) => getTrainer(id, ctx),
        create: (data, ctx) => createTrainer(data, ctx),
        update: (id, data, ctx) => updateTrainer(id, data, ctx),
        delete: (id, ctx) => deleteTrainer(id, ctx),
      },
      defaults
    ),
  };
}
