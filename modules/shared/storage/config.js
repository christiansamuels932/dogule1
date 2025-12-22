/* global process */
import { StorageError, STORAGE_ERROR_CODES } from "./errors.js";

const VALID_MODES = new Set(["mock", "real"]);

export function getStorageMode(env = process.env) {
  const raw = env?.DOGULE1_STORAGE_MODE;
  const mode = (raw || "mock").trim();
  if (!VALID_MODES.has(mode)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.INVALID_MODE,
      `Unsupported storage mode: ${mode}`,
      { details: { mode } }
    );
  }
  return mode;
}

export function isRealMode(env) {
  return getStorageMode(env) === "real";
}
