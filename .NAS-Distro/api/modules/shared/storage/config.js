/* global process */
import { StorageError, STORAGE_ERROR_CODES } from "./errors.js";

const VALID_MODES = new Set(["mock", "real", "mariadb"]);

export function getStorageMode(env = process.env) {
  const raw = env?.DOGULE1_STORAGE_MODE;
  if (!raw) {
    throw new StorageError(STORAGE_ERROR_CODES.INVALID_MODE, "MARIADB_REQUIRED", {
      details: { mode: "" },
    });
  }
  const mode = raw.trim();
  if (mode !== "mariadb") {
    throw new StorageError(STORAGE_ERROR_CODES.INVALID_MODE, "MARIADB_REQUIRED", {
      details: { mode },
    });
  }
  if (!VALID_MODES.has(mode)) {
    throw new StorageError(STORAGE_ERROR_CODES.INVALID_MODE, `Unsupported storage mode: ${mode}`, {
      details: { mode },
    });
  }
  return mode;
}

export function isRealMode(env) {
  return getStorageMode(env) === "real";
}
