import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import { logEvent } from "../logging/logger.js";
import { alertEvent } from "../logging/alerts.js";
import { StorageError, STORAGE_ERROR_CODES } from "./errors.js";
import { executeWriteContract } from "./writeContract.js";
import { resolvePaths } from "./real/paths.js";
import { writeEntityFile } from "./real/dataFile.js";
import { appendAuditRecord, loadAuditChainState } from "./real/audit.js";
import { loadEntity } from "./real/read.js";
import { validateKunde, validateHund, validateTrainer, validateKurs } from "./real/validators.js";

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

function assertStorageRoot(paths) {
  try {
    const stat = fsSync.statSync(paths.root);
    if (!stat.isDirectory()) {
      throw new StorageError(
        STORAGE_ERROR_CODES.STORAGE_ROOT_MISSING,
        `Storage root ${paths.root} is not a directory`
      );
    }
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new StorageError(
        STORAGE_ERROR_CODES.STORAGE_ROOT_MISSING,
        `Storage root ${paths.root} is missing`
      );
    }
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      STORAGE_ERROR_CODES.STORAGE_ROOT_MISSING,
      `Storage root check failed for ${paths.root}`,
      { cause: error }
    );
  }
}

function normalizeTimestamps(record, existing) {
  const now = new Date().toISOString();
  return {
    createdAt: existing?.createdAt || record.createdAt || now,
    updatedAt: now,
  };
}

function normalizeKunde(data = {}, existing) {
  const id = (existing?.id || data.id || "").trim() || crypto.randomUUID();
  const timestamps = normalizeTimestamps(data, existing);
  const base = {
    id,
    code: data.code ?? existing?.code ?? "",
    vorname: data.vorname ?? existing?.vorname ?? "",
    nachname: data.nachname ?? existing?.nachname ?? "",
    email: data.email ?? existing?.email ?? "",
    telefon: data.telefon ?? existing?.telefon ?? "",
    adresse: data.adresse ?? existing?.adresse ?? "",
    notizen: data.notizen ?? existing?.notizen ?? "",
    schemaVersion: 1,
    ...timestamps,
  };
  return base;
}

function normalizeHund(data = {}, existing) {
  const id = (existing?.id || data.id || "").trim() || crypto.randomUUID();
  const timestamps = normalizeTimestamps(data, existing);
  const base = {
    id,
    code: data.code ?? existing?.code ?? "",
    name: data.name ?? existing?.name ?? "",
    rufname: data.rufname ?? existing?.rufname ?? "",
    rasse: data.rasse ?? existing?.rasse ?? "",
    geschlecht: data.geschlecht ?? existing?.geschlecht ?? "",
    status: data.status ?? existing?.status ?? "",
    geburtsdatum: data.geburtsdatum ?? existing?.geburtsdatum ?? "",
    gewichtKg: data.gewichtKg ?? existing?.gewichtKg ?? null,
    groesseCm: data.groesseCm ?? existing?.groesseCm ?? null,
    kundenId: data.kundenId ?? existing?.kundenId ?? "",
    trainingsziele: data.trainingsziele ?? existing?.trainingsziele ?? "",
    notizen: data.notizen ?? existing?.notizen ?? "",
    schemaVersion: 1,
    ...timestamps,
  };
  return base;
}

async function ensureKundeExists(paths, kundenId, defaults) {
  try {
    await loadEntity(paths, "kunden", kundenId, { logger: defaults.logger, alerter: defaults.alerter });
  } catch (error) {
    if (error instanceof StorageError && error.code === STORAGE_ERROR_CODES.NOT_FOUND) {
      throw new StorageError(
        STORAGE_ERROR_CODES.FK_NOT_FOUND,
        `kunden ${kundenId} not found for hunde`,
        { cause: error }
      );
    }
    throw error;
  }
}

async function listEntities(paths, entity, defaults) {
  const dir = paths.entityDir(entity);
  let entries = [];
  try {
    entries = await fs.readdir(dir);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw new StorageError(
      STORAGE_ERROR_CODES.STORAGE_ERROR,
      `Failed to list ${entity}`,
      { cause: error }
    );
  }
  const ids = entries.filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, ""));
  const records = [];
  for (const id of ids) {
    const loaded = await loadEntity(paths, entity, id, { logger: defaults.logger, alerter: defaults.alerter });
    records.push(loaded.data);
  }
  return records.sort((a, b) => a.id.localeCompare(b.id));
}

function buildCrudForKunden(defaults, options) {
  const paths = resolvePaths(options.paths);

  const list = async () => {
    return listEntities(paths, "kunden", defaults);
  };

  const get = async (id) => {
    const loaded = await loadEntity(paths, "kunden", id, { logger: defaults.logger, alerter: defaults.alerter });
    return loaded.data;
  };

  const create = async (data = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("kunden", "create", defaults, {
      ...context,
      targetId: data?.id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const chainState = await loadAuditChainState(paths, "kunden");
        const record = normalizeKunde(data);
        validateKunde(record);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.after = record;
        const { checksum } = await writeEntityFile(paths, "kunden", record.id, record);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "kunden",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "kunden", id: record.id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: null,
            after: record,
            beforeChecksum: null,
            afterChecksum: checksum,
          },
          chainState
        );
        return record;
      },
    });
  };

  const update = async (id, patch = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("kunden", "update", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "kunden", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const existing = existingLoaded.data;
        const chainState = await loadAuditChainState(paths, "kunden");
        const nextRecord = normalizeKunde({ ...existing, ...patch, id: existing.id }, existing);
        validateKunde(nextRecord);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existing;
        auditContext.after = nextRecord;
        auditContext.beforeChecksum = existingLoaded.checksum;
        const { checksum } = await writeEntityFile(paths, "kunden", id, nextRecord);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "kunden",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "kunden", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existing,
            after: nextRecord,
            beforeChecksum: auditContext.beforeChecksum,
            afterChecksum: checksum,
          },
          chainState
        );
        return nextRecord;
      },
    });
  };

  const del = async (id, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("kunden", "delete", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "kunden", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const chainState = await loadAuditChainState(paths, "kunden");
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existingLoaded.data;
        auditContext.beforeChecksum = existingLoaded.checksum;
        await fs.rm(paths.dataFile("kunden", id), { force: true });
        await appendAuditRecord(
          paths,
          "kunden",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "kunden", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existingLoaded.data,
            after: null,
            beforeChecksum: existingLoaded.checksum,
            afterChecksum: null,
          },
          chainState
        );
        return { ok: true, id };
      },
    });
  };

  return { list, get, create, update, delete: del };
}

function buildCrudForHunde(defaults, options) {
  const paths = resolvePaths(options.paths);

  const list = async () => listEntities(paths, "hunde", defaults);

  const get = async (id) => {
    const loaded = await loadEntity(paths, "hunde", id, { logger: defaults.logger, alerter: defaults.alerter });
    return loaded.data;
  };

  const create = async (data = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("hunde", "create", defaults, {
      ...context,
      targetId: data?.id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const chainState = await loadAuditChainState(paths, "hunde");
        const record = normalizeHund(data);
        validateHund(record);
        await ensureKundeExists(paths, record.kundenId, defaults);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.after = record;
        const { checksum } = await writeEntityFile(paths, "hunde", record.id, record);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "hunde",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "hunde", id: record.id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: null,
            after: record,
            beforeChecksum: null,
            afterChecksum: checksum,
          },
          chainState
        );
        return record;
      },
    });
  };

  const update = async (id, patch = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("hunde", "update", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "hunde", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const existing = existingLoaded.data;
        const chainState = await loadAuditChainState(paths, "hunde");
        const nextRecord = normalizeHund({ ...existing, ...patch, id: existing.id }, existing);
        validateHund(nextRecord);
        await ensureKundeExists(paths, nextRecord.kundenId, defaults);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existing;
        auditContext.after = nextRecord;
        auditContext.beforeChecksum = existingLoaded.checksum;
        const { checksum } = await writeEntityFile(paths, "hunde", id, nextRecord);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "hunde",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "hunde", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existing,
            after: nextRecord,
            beforeChecksum: existingLoaded.checksum,
            afterChecksum: checksum,
          },
          chainState
        );
        return nextRecord;
      },
    });
  };

  const del = async (id, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("hunde", "delete", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "hunde", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const chainState = await loadAuditChainState(paths, "hunde");
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existingLoaded.data;
        auditContext.beforeChecksum = existingLoaded.checksum;
        await fs.rm(paths.dataFile("hunde", id), { force: true });
        await appendAuditRecord(
          paths,
          "hunde",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "hunde", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existingLoaded.data,
            after: null,
            beforeChecksum: existingLoaded.checksum,
            afterChecksum: null,
          },
          chainState
        );
        return { ok: true, id };
      },
    });
  };

  return { list, get, create, update, delete: del };
}

function normalizeTrainer(data = {}, existing) {
  const id = (existing?.id || data.id || "").trim() || crypto.randomUUID();
  const timestamps = normalizeTimestamps(data, existing);
  const base = {
    id,
    code: data.code ?? existing?.code ?? "",
    name: data.name ?? existing?.name ?? "",
    email: data.email ?? existing?.email ?? "",
    telefon: data.telefon ?? existing?.telefon ?? "",
    notizen: data.notizen ?? existing?.notizen ?? "",
    verfuegbarkeiten: Array.isArray(data.verfuegbarkeiten ?? existing?.verfuegbarkeiten)
      ? (data.verfuegbarkeiten ?? existing?.verfuegbarkeiten)
      : [],
    schemaVersion: 1,
    ...timestamps,
  };
  return base;
}

function normalizeKurs(data = {}, existing) {
  const id = (existing?.id || data.id || "").trim() || crypto.randomUUID();
  const timestamps = normalizeTimestamps(data, existing);
  const toNumber = (value, fallback = 0) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const normalizeIds = (ids) => {
    if (!Array.isArray(ids)) return [];
    return ids.map((entry) => (typeof entry === "string" ? entry.trim() : String(entry || ""))).filter(Boolean);
  };
  const base = {
    id,
    code: data.code ?? existing?.code ?? "",
    title: data.title ?? existing?.title ?? "",
    trainerName: data.trainerName ?? existing?.trainerName ?? "",
    trainerId: data.trainerId ?? existing?.trainerId ?? "",
    date: data.date ?? existing?.date ?? "",
    startTime: data.startTime ?? existing?.startTime ?? "",
    endTime: data.endTime ?? existing?.endTime ?? "",
    location: data.location ?? existing?.location ?? "",
    status: data.status ?? existing?.status ?? "",
    capacity: toNumber(data.capacity ?? existing?.capacity ?? 0, 0),
    bookedCount: toNumber(data.bookedCount ?? existing?.bookedCount ?? 0, 0),
    level: data.level ?? existing?.level ?? "",
    price: toNumber(data.price ?? existing?.price ?? 0, 0),
    notes: data.notes ?? existing?.notes ?? "",
    hundIds: normalizeIds(data.hundIds ?? existing?.hundIds ?? []),
    schemaVersion: 1,
    ...timestamps,
  };
  return base;
}

async function ensureTrainerExists(paths, trainerId, defaults) {
  try {
    await loadEntity(paths, "trainer", trainerId, { logger: defaults.logger, alerter: defaults.alerter });
  } catch (error) {
    if (error instanceof StorageError && error.code === STORAGE_ERROR_CODES.NOT_FOUND) {
      throw new StorageError(
        STORAGE_ERROR_CODES.FK_NOT_FOUND,
        `trainer ${trainerId} not found for kurse`,
        { cause: error }
      );
    }
    throw error;
  }
}

function buildCrudForTrainer(defaults, options) {
  const paths = resolvePaths(options.paths);
  const list = async () => listEntities(paths, "trainer", defaults);
  const get = async (id) => {
    const loaded = await loadEntity(paths, "trainer", id, {
      logger: defaults.logger,
      alerter: defaults.alerter,
    });
    return loaded.data;
  };

  const create = async (data = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("trainer", "create", defaults, {
      ...context,
      targetId: data?.id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const chainState = await loadAuditChainState(paths, "trainer");
        const record = normalizeTrainer(data);
        validateTrainer(record);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.after = record;
        const { checksum } = await writeEntityFile(paths, "trainer", record.id, record);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "trainer",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "trainer", id: record.id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: null,
            after: record,
            beforeChecksum: null,
            afterChecksum: checksum,
          },
          chainState
        );
        return record;
      },
    });
  };

  const update = async (id, patch = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("trainer", "update", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "trainer", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const existing = existingLoaded.data;
        const chainState = await loadAuditChainState(paths, "trainer");
        const nextRecord = normalizeTrainer({ ...existing, ...patch, id: existing.id }, existing);
        validateTrainer(nextRecord);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existing;
        auditContext.after = nextRecord;
        auditContext.beforeChecksum = existingLoaded.checksum;
        const { checksum } = await writeEntityFile(paths, "trainer", id, nextRecord);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "trainer",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "trainer", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existing,
            after: nextRecord,
            beforeChecksum: existingLoaded.checksum,
            afterChecksum: checksum,
          },
          chainState
        );
        return nextRecord;
      },
    });
  };

  const del = async (id, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("trainer", "delete", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "trainer", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const chainState = await loadAuditChainState(paths, "trainer");
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existingLoaded.data;
        auditContext.beforeChecksum = existingLoaded.checksum;
        await fs.rm(paths.dataFile("trainer", id), { force: true });
        await appendAuditRecord(
          paths,
          "trainer",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "trainer", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existingLoaded.data,
            after: null,
            beforeChecksum: existingLoaded.checksum,
            afterChecksum: null,
          },
          chainState
        );
        return { ok: true, id };
      },
    });
  };

  return { list, get, create, update, delete: del };
}

function buildCrudForKurse(defaults, options) {
  const paths = resolvePaths(options.paths);
  const list = async () => listEntities(paths, "kurse", defaults);
  const get = async (id) => {
    const loaded = await loadEntity(paths, "kurse", id, {
      logger: defaults.logger,
      alerter: defaults.alerter,
    });
    return loaded.data;
  };

  const create = async (data = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("kurse", "create", defaults, {
      ...context,
      targetId: data?.id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const chainState = await loadAuditChainState(paths, "kurse");
        const record = normalizeKurs(data);
        validateKurs(record);
        await ensureTrainerExists(paths, record.trainerId, defaults);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.after = record;
        const { checksum } = await writeEntityFile(paths, "kurse", record.id, record);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "kurse",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "kurse", id: record.id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: null,
            after: record,
            beforeChecksum: null,
            afterChecksum: checksum,
          },
          chainState
        );
        return record;
      },
    });
  };

  const update = async (id, patch = {}, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("kurse", "update", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "kurse", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const existing = existingLoaded.data;
        const chainState = await loadAuditChainState(paths, "kurse");
        const nextRecord = normalizeKurs({ ...existing, ...patch, id: existing.id }, existing);
        validateKurs(nextRecord);
        await ensureTrainerExists(paths, nextRecord.trainerId, defaults);
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existing;
        auditContext.after = nextRecord;
        auditContext.beforeChecksum = existingLoaded.checksum;
        const { checksum } = await writeEntityFile(paths, "kurse", id, nextRecord);
        auditContext.afterChecksum = checksum;
        await appendAuditRecord(
          paths,
          "kurse",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "kurse", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existing,
            after: nextRecord,
            beforeChecksum: existingLoaded.checksum,
            afterChecksum: checksum,
          },
          chainState
        );
        return nextRecord;
      },
    });
  };

  const del = async (id, context = {}) => {
    const auditContext = {
      hashPrev: 0,
      hashIndex: 0,
      before: null,
      after: null,
      beforeChecksum: null,
      afterChecksum: null,
    };
    const writeContext = resolveWriteContext("kurse", "delete", defaults, {
      ...context,
      targetId: id,
      auditContext,
    });

    return executeWriteContract({
      ...writeContext,
      perform: async () => {
        const existingLoaded = await loadEntity(paths, "kurse", id, {
          logger: defaults.logger,
          alerter: defaults.alerter,
        });
        const chainState = await loadAuditChainState(paths, "kurse");
        auditContext.hashPrev = chainState.hashPrev;
        auditContext.hashIndex = chainState.hashIndex;
        auditContext.before = existingLoaded.data;
        auditContext.beforeChecksum = existingLoaded.checksum;
        await fs.rm(paths.dataFile("kurse", id), { force: true });
        await appendAuditRecord(
          paths,
          "kurse",
          {
            actionId: writeContext.actionId,
            actor: { type: writeContext.actorRole === "system" ? "system" : "user", id: writeContext.actorId, role: writeContext.actorRole },
            target: { type: "kurse", id },
            requestId: writeContext.requestId || "storage-write",
            result: "success",
            before: existingLoaded.data,
            after: null,
            beforeChecksum: existingLoaded.checksum,
            afterChecksum: null,
          },
          chainState
        );
        return { ok: true, id };
      },
    });
  };

  return { list, get, create, update, delete: del };
}

export function createRealAdapter(options = {}) {
  const defaults = {
    mode: options.mode || "real",
    logger: options.logger || logEvent,
    alerter: options.alerter || alertEvent,
    authz: options.authz,
    audit: options.audit,
  };

  const paths = resolvePaths(options.paths);
  assertStorageRoot(paths);

  const kunden = buildCrudForKunden(defaults, { ...options, paths });
  const hunde = buildCrudForHunde(defaults, { ...options, paths });
  const trainer = buildCrudForTrainer(defaults, { ...options, paths });
  const kurse = buildCrudForKurse(defaults, { ...options, paths });

  return {
    kunden,
    hunde,
    kurse,
    trainer,
  };
}
