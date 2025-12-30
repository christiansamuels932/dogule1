/* global Buffer */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { canonicalJson } from "../migration/canonicalJson.js";

function uuidv7FromSeed(seed) {
  const hash = crypto.createHash("sha256").update(seed).digest();
  const bytes = Buffer.alloc(16);
  hash.copy(bytes, 0, 0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

export function getRegistryPath(registryDir, moduleName) {
  return path.join(registryDir, `${moduleName}.json`);
}

export async function loadRegistry(registryDir, moduleName) {
  const filePath = getRegistryPath(registryDir, moduleName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`Registry ${moduleName} must be an array`);
    }
    return parsed;
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export function resolveRegistryEntry(registry, moduleName, legacyId) {
  if (!legacyId) return null;
  const found = registry.find((entry) => entry.legacyId === legacyId);
  if (found) return { entry: found, created: false };
  const entry = {
    legacyId,
    targetUuid: uuidv7FromSeed(`${moduleName}:${legacyId}`),
    version: 1,
  };
  return { entry, created: true };
}

export async function persistRegistry(registryDir, moduleName, registry) {
  await fs.mkdir(registryDir, { recursive: true });
  const filePath = getRegistryPath(registryDir, moduleName);
  const sorted = [...registry].sort((a, b) => a.legacyId.localeCompare(b.legacyId));
  await fs.writeFile(filePath, canonicalJson(sorted), "utf8");
}
