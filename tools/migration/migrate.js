/* eslint-env node */
/* global process */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { listModules, readModule } from "./sourceAdapter.js";
import { loadRegistry } from "./registry.js";
import { canonicalJson } from "./canonicalJson.js";

const DEFAULT_OUTPUT = path.join(process.cwd(), "storage_candidate", "v1");
const TMP_PREFIX = "v1-tmp-";

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function computeMerkle(leaves) {
  if (leaves.length === 0) return sha256("");
  let level = leaves.slice();
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i];
      const b = level[i + 1] || level[i];
      next.push(sha256(a + b));
    }
    level = next;
  }
  return level[0];
}

function buildRegistryMaps(registries) {
  const map = new Map();
  for (const [moduleName, entries] of registries.entries()) {
    const moduleMap = new Map();
    for (const entry of entries) {
      moduleMap.set(entry.legacyId, entry.targetUuid);
    }
    map.set(moduleName, moduleMap);
  }
  return map;
}

function mapFk(moduleMap, legacyId) {
  if (!legacyId) return legacyId;
  return moduleMap.get(legacyId) || legacyId;
}

function normalizeRecord(moduleName, record, registryMaps) {
  const base = {
    ...record,
    schemaVersion: 1,
    version: 0,
  };

  switch (moduleName) {
    case "hunde": {
      const kundenMap = registryMaps.get("kunden") || new Map();
      return { ...base, kundenId: mapFk(kundenMap, record.kundenId) };
    }
    case "kurse": {
      const trainerMap = registryMaps.get("trainer") || new Map();
      const hundMap = registryMaps.get("hunde") || new Map();
      return {
        ...base,
        trainerId: mapFk(trainerMap, record.trainerId),
        hundIds: (record.hundIds || []).map((id) => mapFk(hundMap, id)),
      };
    }
    case "kalender": {
      const kursMap = registryMaps.get("kurse") || new Map();
      const trainerMap = registryMaps.get("trainer") || new Map();
      return {
        ...base,
        kursId: mapFk(kursMap, record.kursId),
        trainerId: mapFk(trainerMap, record.trainerId),
      };
    }
    case "finanzen": {
      const kundenMap = registryMaps.get("kunden") || new Map();
      const kursMap = registryMaps.get("kurse") || new Map();
      const trainerMap = registryMaps.get("trainer") || new Map();
      const kundeLegacy = record.kundeId || record.kundenId;
      return {
        ...base,
        kundeId: mapFk(kundenMap, kundeLegacy),
        kursId: mapFk(kursMap, record.kursId),
        trainerId: mapFk(trainerMap, record.trainerId),
      };
    }
    case "waren": {
      const kundenMap = registryMaps.get("kunden") || new Map();
      return { ...base, kundenId: mapFk(kundenMap, record.kundenId) };
    }
    default:
      return base;
  }
}

async function writeAtomicFile(filePath, content) {
  const tmpPath = `${filePath}.tmp`;
  const handle = await fs.open(tmpPath, "w");
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmpPath, filePath);
  const dirHandle = await fs.open(path.dirname(filePath));
  try {
    await dirHandle.sync();
  } finally {
    await dirHandle.close();
  }
}

async function writeModule(moduleDir, moduleName, records) {
  const checksumDir = path.join(moduleDir, "checksums");
  await fs.mkdir(checksumDir, { recursive: true });

  const jsonl = records.map((r) => JSON.stringify(r)).join("\n") + (records.length ? "\n" : "");
  await writeAtomicFile(path.join(moduleDir, "data.jsonl"), jsonl);

  const entries = records.map((record) => ({
    id: record.id,
    hash: sha256(canonicalJson(record)),
  }));
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const entitiesContent =
    entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length ? "\n" : "");
  await writeAtomicFile(path.join(checksumDir, "entities.jsonl"), entitiesContent);

  const merkle = {
    module: moduleName,
    ordering: "id",
    leaves: entries,
    root: computeMerkle(entries.map((e) => e.hash)),
  };
  await writeAtomicFile(
    path.join(checksumDir, "merkle.json"),
    JSON.stringify(merkle, null, 2) + "\n"
  );
  return merkle.root;
}

async function writeRunMetadata(tmpRoot, runId, moduleRoots) {
  const runMeta = {
    runId,
    generatedAt: "00000000T000000Z",
    modules: moduleRoots.map((m) => ({ name: m.module, root: m.root })),
  };
  const file = path.join(tmpRoot, "checksums", "run.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await writeAtomicFile(file, JSON.stringify(runMeta, null, 2) + "\n");
}

export async function runMigrate() {
  const outputDir = DEFAULT_OUTPUT;
  const runId = process.env.MIGRATE_RUN_ID || "run-local";
  const modules = listModules();
  const registries = new Map();
  for (const moduleName of modules) {
    const registry = await loadRegistry(moduleName);
    registries.set(moduleName, registry);
  }
  const registryMaps = buildRegistryMaps(registries);

  const parentDir = path.dirname(outputDir);
  await fs.mkdir(parentDir, { recursive: true });
  const tmpRoot = await fs.mkdtemp(path.join(parentDir, TMP_PREFIX));

  const moduleRoots = [];
  try {
    for (const moduleName of modules) {
      const failAfter = process.env.MIGRATE_FAIL_AFTER_MODULE;
      const records = readModule(moduleName);
      const registryMap = registryMaps.get(moduleName) || new Map();
      const mappedRecords = records
        .map((record) => {
          const targetUuid = registryMap.get(record.id);
          if (!targetUuid) {
            throw new Error(`Missing mapping for ${moduleName} legacy id ${record.id}`);
          }
          const withId = { ...record, id: targetUuid };
          return normalizeRecord(moduleName, withId, registryMaps);
        })
        .sort((a, b) => a.id.localeCompare(b.id));

      const moduleDir = path.join(tmpRoot, moduleName);
      await fs.mkdir(moduleDir, { recursive: true });
      const root = await writeModule(moduleDir, moduleName, mappedRecords);
      moduleRoots.push({ module: moduleName, root });

      if (failAfter && failAfter === moduleName) {
        throw new Error(`Injected failure after module ${moduleName}`);
      }
    }

    await writeRunMetadata(tmpRoot, runId, moduleRoots);

    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.rename(tmpRoot, outputDir);
    return { outputDir, runId, moduleRoots };
  } catch (err) {
    await fs.rm(tmpRoot, { recursive: true, force: true });
    throw err;
  }
}
