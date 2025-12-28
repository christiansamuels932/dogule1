/* global process */
import { logEvent } from "../logging/logger.js";
import { alertEvent } from "../logging/alerts.js";
import { StorageError, STORAGE_ERROR_CODES } from "./errors.js";
import { getStorageMode } from "./config.js";
import { createMockAdapter } from "./mockAdapter.js";
import { createRealAdapter } from "./realAdapter.js";
import { createMariaDbAdapter } from "./mariadbAdapter.js";

export function createStorage(options = {}) {
  const logger = options.logger || logEvent;
  const alerter = options.alert || alertEvent;
  const mode = options.mode || getStorageMode();
  if (process.env.DOGULE1_REQUIRE_MARIADB === "1" && mode !== "mariadb") {
    throw new StorageError(
      STORAGE_ERROR_CODES.INVALID_MODE,
      `MariaDB is required; received ${mode}`,
      { details: { mode } }
    );
  }
  const shared = {
    mode,
    logger,
    alerter,
    authz: options.authz,
    audit: options.audit,
    paths: options.paths,
  };

  if (mode === "mock") {
    return createMockAdapter(shared);
  }
  if (mode === "real") {
    return createRealAdapter(shared);
  }
  if (mode === "mariadb") {
    return createMariaDbAdapter(shared);
  }

  throw new StorageError(STORAGE_ERROR_CODES.INVALID_MODE, `Unsupported storage mode: ${mode}`, {
    details: { mode },
  });
}
