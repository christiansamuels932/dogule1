/* eslint-env node */
/* global process */
import fs from "node:fs/promises";
import path from "node:path";
import { canonicalJson } from "./canonicalJson.js";
import { listModules } from "./sourceAdapter.js";
import { loadRegistry } from "./registry.js";
import crypto from "node:crypto";

const DEFAULT_INPUT = path.join(process.cwd(), "storage_candidate", "v1");
const REPORT_DIR = path.join(process.cwd(), "storage_reports", "latest-scan");

const MODULE_CONFIG = {
  kunden: {
    required: ["id", "code", "vorname", "nachname", "email"],
    fks: [],
    invariants: [],
  },
  hunde: {
    required: ["id", "code", "name", "kundenId"],
    fks: [{ field: "kundenId", target: "kunden", required: true }],
    invariants: [],
  },
  kurse: {
    required: ["id", "code", "title", "trainerId", "date", "startTime", "endTime", "status"],
    fks: [
      { field: "trainerId", target: "trainer", required: true },
      { field: "hundIds", target: "hunde", required: false, many: true },
      { field: "kundenIds", target: "kunden", required: false, many: true },
    ],
    invariants: ["timeRange", "capacity", "nonNegativePrice"],
  },
  trainer: {
    required: ["id", "code", "name"],
    fks: [],
    invariants: [],
  },
  kalender: {
    required: ["id", "code", "title", "start", "end"],
    fks: [
      { field: "kursId", target: "kurse", required: false },
      { field: "trainerId", target: "trainer", required: false },
    ],
    invariants: ["timeRange", "atLeastOneRef"],
  },
  finanzen: {
    required: ["id", "code", "kundeId", "typ", "betrag", "datum"],
    fks: [
      { field: "kundeId", target: "kunden", required: true },
      { field: "kursId", target: "kurse", required: false },
      { field: "trainerId", target: "trainer", required: false },
    ],
    invariants: ["nonNegativeAmount"],
  },
  waren: {
    required: ["id", "code", "kundenId", "produktName", "preis", "datum"],
    fks: [{ field: "kundenId", target: "kunden", required: true }],
    invariants: ["nonNegativePrice"],
  },
  kommunikation: {
    required: ["id", "code", "channel", "title", "status"],
    fks: [],
    invariants: [],
  },
};

const PII_FIELDS = [
  "vorname",
  "nachname",
  "email",
  "telefon",
  "adresse",
  "notizen",
  "kundenId",
  "hundIds",
  "kundenIds",
  "trainerId",
  "kursId",
  "price",
  "betrag",
  "produktName",
];

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

async function readJsonl(filePath) {
  let content;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  return lines.map((line) => JSON.parse(line));
}

async function readModuleData(inputDir, moduleName) {
  const filePath = path.join(inputDir, moduleName, "data.jsonl");
  return readJsonl(filePath);
}

function validateSchema(moduleName, record) {
  const config = MODULE_CONFIG[moduleName] || { required: [] };
  const issues = [];
  for (const field of config.required) {
    if (record[field] === undefined || record[field] === null || record[field] === "") {
      issues.push(
        issue(moduleName, record.id, "schema", "BLOCKER", `Missing required field ${field}`)
      );
    }
  }
  if (record.schemaVersion !== 1) {
    issues.push(
      issue(moduleName, record.id, "schemaVersion", "BLOCKER", "schemaVersion must equal 1")
    );
  }
  if (record.version === undefined || record.version === null) {
    issues.push(issue(moduleName, record.id, "version", "BLOCKER", "version missing"));
  }
  return issues;
}

function validateFk(moduleName, record, indexByModule) {
  const config = MODULE_CONFIG[moduleName] || { fks: [] };
  const issues = [];
  for (const fk of config.fks || []) {
    if (fk.many) {
      const arr = Array.isArray(record[fk.field]) ? record[fk.field] : [];
      if (fk.required && arr.length === 0) {
        issues.push(
          issue(moduleName, record.id, "fk", "BLOCKER", `Missing required list ${fk.field}`)
        );
      }
      for (const val of arr) {
        if (!indexByModule[fk.target]?.has(val)) {
          issues.push(
            issue(
              moduleName,
              record.id,
              "fk",
              "BLOCKER",
              `FK ${fk.field} -> ${fk.target} not found: ${val}`
            )
          );
        }
      }
    } else {
      const val = record[fk.field];
      if ((val === undefined || val === null || val === "") && fk.required) {
        issues.push(
          issue(moduleName, record.id, "fk", "BLOCKER", `Missing required FK ${fk.field}`)
        );
      }
      if (val && !indexByModule[fk.target]?.has(val)) {
        issues.push(
          issue(
            moduleName,
            record.id,
            "fk",
            "BLOCKER",
            `FK ${fk.field} -> ${fk.target} not found: ${val}`
          )
        );
      }
    }
  }
  if (moduleName === "kalender") {
    if (!record.kursId && !record.trainerId) {
      issues.push(
        issue(
          moduleName,
          record.id,
          "invariant",
          "BLOCKER",
          "Kalender entry requires kursId or trainerId"
        )
      );
    }
  }
  return issues;
}

function validateInvariants(moduleName, record) {
  const config = MODULE_CONFIG[moduleName] || { invariants: [] };
  const issues = [];
  if (config.invariants.includes("timeRange")) {
    const start = new Date(record.start || record.startTime || "");
    const end = new Date(record.end || record.endTime || "");
    if (isFinite(start) && isFinite(end) && !(start < end)) {
      issues.push(issue(moduleName, record.id, "invariant", "BLOCKER", "start must be before end"));
    }
  }
  if (config.invariants.includes("capacity")) {
    const cap = record.capacity;
    const booked = record.bookedCount;
    if (cap !== undefined && booked !== undefined && cap < booked) {
      issues.push(
        issue(moduleName, record.id, "invariant", "BLOCKER", "capacity must be >= bookedCount")
      );
    }
  }
  if (config.invariants.includes("nonNegativePrice")) {
    if (record.price !== undefined && record.price < 0) {
      issues.push(issue(moduleName, record.id, "invariant", "BLOCKER", "price must be >= 0"));
    }
  }
  if (config.invariants.includes("nonNegativeAmount")) {
    if (record.betrag !== undefined && record.betrag < 0) {
      issues.push(issue(moduleName, record.id, "invariant", "BLOCKER", "betrag must be >= 0"));
    }
  }
  if (config.invariants.includes("atLeastOneRef")) {
    if (!record.kursId && !record.trainerId) {
      issues.push(
        issue(moduleName, record.id, "invariant", "BLOCKER", "requires kursId or trainerId")
      );
    }
  }
  return issues;
}

function issue(moduleName, entityId, checkType, severity, message) {
  return {
    module: moduleName,
    entityId: entityId || null,
    checkType,
    severity,
    message,
    autoFixPossible: false,
  };
}

async function buildIndex(inputDir) {
  const modules = listModules();
  const index = {};
  for (const mod of modules) {
    const records = await readModuleData(inputDir, mod);
    index[mod] = new Map(records.map((r) => [r.id, r]));
  }
  return index;
}

async function verifyChecksums(inputDir, moduleName, records) {
  const issues = [];
  const checksumDir = path.join(inputDir, moduleName, "checksums");
  const entitiesFile = path.join(checksumDir, "entities.jsonl");
  const merkleFile = path.join(checksumDir, "merkle.json");
  const entityEntries = await readJsonl(entitiesFile);
  if (entityEntries.length === 0 && records.length > 0) {
    issues.push(issue(moduleName, null, "checksum", "BLOCKER", "Missing entity checksums"));
    return issues;
  }
  const recomputed = records
    .map((r) => ({ id: r.id, hash: sha256(canonicalJson(r)) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (entityEntries.length !== recomputed.length) {
    issues.push(issue(moduleName, null, "checksum", "BLOCKER", "Entity checksum count mismatch"));
  }
  for (let i = 0; i < recomputed.length; i += 1) {
    if (
      entityEntries[i]?.id !== recomputed[i].id ||
      entityEntries[i]?.hash !== recomputed[i].hash
    ) {
      issues.push(issue(moduleName, recomputed[i].id, "checksum", "BLOCKER", "Checksum mismatch"));
    }
  }
  let merkle;
  try {
    const raw = await fs.readFile(merkleFile, "utf8");
    merkle = JSON.parse(raw);
  } catch {
    issues.push(issue(moduleName, null, "checksum", "BLOCKER", "Missing merkle.json"));
    return issues;
  }
  const leaves = recomputed.map((r) => r.hash);
  const root = computeMerkle(leaves);
  if (merkle.root !== root) {
    issues.push(issue(moduleName, null, "checksum", "BLOCKER", "Merkle root mismatch"));
  }
  return issues;
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

async function runScan({ mode, modules = [] }) {
  const inputDir = DEFAULT_INPUT;
  const activeModules = modules.length > 0 ? modules : listModules();
  const index = await buildIndex(inputDir);
  const report = [];

  for (const moduleName of activeModules) {
    const records = Array.from(index[moduleName]?.values() || []);
    const registry = await loadRegistry(moduleName);
    if (registry.length === 0 && records.length > 0) {
      report.push(issue(moduleName, null, "registry", "WARNING", "Registry missing or empty"));
    }
    if (mode === "verify-checksums" || mode === "all") {
      const checksumIssues = await verifyChecksums(inputDir, moduleName, records);
      report.push(...checksumIssues);
    }
    if (mode === "verify-checksums") continue;

    for (const record of records) {
      report.push(...validateSchema(moduleName, record));
      report.push(...validateFk(moduleName, record, index));
      report.push(...validateInvariants(moduleName, record));
    }
    if (mode === "pii") {
      report.push(...piiAudit(moduleName, records));
    }
    if (mode === "drift") {
      report.push(...driftChecks(moduleName, records));
    }
    if (mode === "all") {
      report.push(...piiAudit(moduleName, records));
      report.push(...driftChecks(moduleName, records));
    }
  }

  await writeScanReport(report);
  const hasBlocker = report.some((r) => r.severity === "BLOCKER");
  return { exitCode: hasBlocker ? 1 : 0 };
}

function piiAudit(moduleName, records) {
  const issues = [];
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (PII_FIELDS.includes(key) && moduleName === "checksums") {
        issues.push(
          issue(moduleName, null, "pii", "BLOCKER", `PII field ${key} leaked into checksum`)
        );
      }
    }
  }
  return issues;
}

function driftChecks(moduleName, records) {
  const issues = [];
  for (const record of records) {
    if (record.schemaVersion !== 1) {
      issues.push(issue(moduleName, record.id, "drift", "BLOCKER", "schemaVersion drift"));
    }
  }
  return issues;
}

async function writeScanReport(entries) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const scanPath = path.join(REPORT_DIR, "scan.json");
  const summaryPath = path.join(REPORT_DIR, "summary.json");
  const summary = summarize(entries);
  await fs.writeFile(scanPath, canonicalJson(entries), "utf8");
  await fs.writeFile(summaryPath, canonicalJson(summary), "utf8");
}

function summarize(entries) {
  const perModule = {};
  for (const e of entries) {
    if (!perModule[e.module]) {
      perModule[e.module] = { BLOCKER: 0, WARNING: 0, INFO: 0 };
    }
    perModule[e.module][e.severity] = (perModule[e.module][e.severity] || 0) + 1;
  }
  const totalBlockers = entries.filter((e) => e.severity === "BLOCKER").length;
  const totalWarnings = entries.filter((e) => e.severity === "WARNING").length;
  return { modules: perModule, totalBlockers, totalWarnings };
}

export { runScan };
