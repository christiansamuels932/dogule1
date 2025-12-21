import fs from "node:fs/promises";
import { StorageError, STORAGE_ERROR_CODES } from "../errors.js";
import { canonicalJson, sha256Hex } from "./utils.js";

export async function loadEntity(paths, entity, id, { logger, alerter } = {}) {
  const filePath = paths.dataFile(entity, id);
  let wrapper;
  try {
    const raw = await fs.readFile(filePath, "utf8");
    wrapper = JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new StorageError(
        STORAGE_ERROR_CODES.NOT_FOUND,
        `${entity} ${id} not found`
      );
    }
    throw new StorageError(
      STORAGE_ERROR_CODES.STORAGE_ERROR,
      `Failed to read ${entity} ${id}`,
      { cause: error }
    );
  }

  const canonical = canonicalJson(wrapper.data);
  const checksum = sha256Hex(canonical);
  if (wrapper.checksumAlgo !== "sha256" || wrapper.canonical !== "json-v1") {
    const event = {
      actionId: `${entity}.read`,
      actor: { type: "system", id: "storage", role: "system" },
      target: { type: entity, id },
      result: "error",
      requestId: "storage-read",
      message: "WRAPPER-METADATA-MISMATCH",
      level: "critical",
      severity: "CRITICAL",
      meta: { code: "WRAPPER_METADATA_MISMATCH" },
    };
    if (logger) logger(event);
    if (alerter) {
      alerter({
        ...event,
        alertCode: "storage.wrapper.mismatch",
        throttleKey: `${entity}:wrapper:${id}`,
      });
    }
    throw new StorageError(
      STORAGE_ERROR_CODES.CHECKSUM_MISMATCH,
      `${entity} ${id} wrapper metadata mismatch`
    );
  }
  if (checksum !== wrapper.checksum) {
    const event = {
      actionId: `${entity}.read`,
      actor: { type: "system", id: "storage", role: "system" },
      target: { type: entity, id },
      result: "error",
      requestId: "storage-read",
      message: "CHECKSUM-MISMATCH",
      level: "critical",
      severity: "CRITICAL",
      meta: { code: "CHECKSUM_MISMATCH" },
    };
    if (logger) logger(event);
    if (alerter) {
      alerter({
        ...event,
        alertCode: "storage.checksum.mismatch",
        throttleKey: `${entity}:checksum:${id}`,
      });
    }
    throw new StorageError(
      STORAGE_ERROR_CODES.CHECKSUM_MISMATCH,
      `${entity} ${id} checksum mismatch`
    );
  }

  return { data: wrapper.data, checksum };
}
