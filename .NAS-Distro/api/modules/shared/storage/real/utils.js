/* global process */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { StorageError, STORAGE_ERROR_CODES } from "../errors.js";

export function canonicalJson(value) {
  const normalize = (input) => {
    if (input === null) return null;
    if (typeof input === "number" || typeof input === "string" || typeof input === "boolean") {
      return input;
    }
    if (Array.isArray(input)) {
      return input.map((entry) => normalize(entry === undefined ? null : entry));
    }
    if (input instanceof Date) {
      return input.toISOString();
    }
    if (typeof input === "object") {
      const output = {};
      Object.keys(input)
        .sort()
        .forEach((key) => {
          const normalized = normalize(input[key]);
          if (normalized === undefined) return;
          output[key] = normalized;
        });
      return output;
    }
    return input;
  };

  return JSON.stringify(normalize(value));
}

export function sha256Hex(value) {
  const buf = typeof value === "string" || value instanceof Uint8Array ? value : String(value);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeFileAtomic(targetPath, bytes) {
  const dir = path.dirname(targetPath);
  await ensureDir(dir);
  const temp = path.join(dir, `.tmp.${process.pid}.${crypto.randomUUID()}`);
  try {
    const fh = await fs.open(temp, "w");
    await fh.writeFile(bytes);
    await fh.sync();
    await fh.close();
    await fs.rename(temp, targetPath);
    const dirHandle = await fs.open(dir, "r");
    await dirHandle.sync();
    await dirHandle.close();
  } catch (error) {
    await fs.rm(temp, { force: true }).catch(() => {});
    throw new StorageError(
      STORAGE_ERROR_CODES.ATOMIC_WRITE_FAILED,
      `Atomic write failed for ${targetPath}`,
      { cause: error }
    );
  }
}
