/* eslint-env node */
/* global process */
import fs from "node:fs/promises";
import path from "node:path";
import { canonicalJson } from "./canonicalJson.js";

const MAPPING_DIR = path.join(process.cwd(), "migration", "mapping");

export function getMappingPath(moduleName) {
  return path.join(MAPPING_DIR, `${moduleName}.json`);
}

export async function loadRegistry(moduleName) {
  const filePath = getMappingPath(moduleName);
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`Registry for ${moduleName} must be an array`);
  }
  return data;
}

export function findMapping(registry, legacyId) {
  if (!legacyId) return null;
  return registry.find((entry) => entry.legacyId === legacyId) || null;
}

export function validateRegistry(registry, moduleName) {
  const issues = [];
  const sorted = [...registry].sort((a, b) => a.legacyId.localeCompare(b.legacyId));
  const stableStr = canonicalJson(sorted);
  for (const entry of sorted) {
    if (typeof entry.legacyId !== "string") {
      issues.push({ severity: "BLOCKER", message: `Invalid legacyId in ${moduleName}` });
    }
    if (typeof entry.targetUuid !== "string") {
      issues.push({ severity: "BLOCKER", message: `Invalid targetUuid in ${moduleName}` });
    }
    if (entry.version !== 1) {
      issues.push({ severity: "WARNING", message: `Unexpected version in ${moduleName}` });
    }
  }
  return { issues, stableStr };
}
