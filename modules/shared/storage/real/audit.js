/* global Buffer */
import fs from "node:fs/promises";
import path from "node:path";
import { canonicalJson, ensureDir, sha256Hex, writeFileAtomic } from "./utils.js";
import { StorageError, STORAGE_ERROR_CODES } from "../errors.js";

async function readManifest(paths, entity) {
  const manifestPath = paths.manifestFile(entity);
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { entity, lastIndex: 0, lastHash: "0", schemaVersion: 1, updatedAt: null };
    }
    throw error;
  }
}

async function readAuditTailHash(paths, entity, expectedIndex) {
  if (expectedIndex === 0) return "0";
  const auditPath = paths.auditFile(entity);
  let content;
  try {
    content = await fs.readFile(auditPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return "0";
    }
    throw error;
  }
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return "0";
  const last = lines[lines.length - 1];
  const parsed = JSON.parse(last);
  const clone = { ...parsed };
  delete clone.recordHash;
  return sha256Hex(canonicalJson(clone));
}

export async function loadAuditChainState(paths, entity) {
  const manifest = await readManifest(paths, entity);
  const tailHash = await readAuditTailHash(paths, entity, manifest.lastIndex);
  if (manifest.lastIndex > 0 && tailHash !== manifest.lastHash) {
    throw new StorageError(
      STORAGE_ERROR_CODES.MANIFEST_CHAIN_MISMATCH,
      `Manifest chain mismatch for ${entity}`,
      { details: { expected: manifest.lastHash, actual: tailHash } }
    );
  }
  return {
    manifest,
    hashPrev: manifest.lastHash,
    hashIndex: manifest.lastIndex + 1,
  };
}

async function appendLineWithFsync(filePath, line) {
  // Assumes single-process writer; concurrent writers may race on hashIndex/manifest.
  await ensureDir(path.dirname(filePath));
  const fh = await fs.open(filePath, "a");
  try {
    await fh.write(`${line}\n`);
    await fh.sync();
  } finally {
    await fh.close();
  }
}

export async function appendAuditRecord(paths, entity, auditEvent, chainState) {
  try {
    const state = chainState || (await loadAuditChainState(paths, entity));
    const baseRecord = {
      ts: auditEvent.ts || new Date().toISOString(),
      actionId: auditEvent.actionId,
      actor: auditEvent.actor,
      target: auditEvent.target,
      result: auditEvent.result || "success",
      requestId: auditEvent.requestId || "storage-write",
      before: auditEvent.before ?? null,
      after: auditEvent.after ?? null,
      hashPrev: state.hashPrev,
      hashIndex: state.hashIndex,
      context: auditEvent.context ?? null,
      beforeChecksum: auditEvent.beforeChecksum ?? null,
      afterChecksum: auditEvent.afterChecksum ?? null,
    };
    const canonical = canonicalJson(baseRecord);
    const recordHash = sha256Hex(canonical);
    const finalRecord = { ...baseRecord, recordHash };
    await appendLineWithFsync(paths.auditFile(entity), JSON.stringify(finalRecord));
    const manifest = {
      entity,
      schemaVersion: state.manifest.schemaVersion || 1,
      lastIndex: state.hashIndex,
      lastHash: recordHash,
      updatedAt: new Date().toISOString(),
    };
    try {
      await writeFileAtomic(paths.manifestFile(entity), Buffer.from(JSON.stringify(manifest)));
    } catch (error) {
      throw new StorageError(
        STORAGE_ERROR_CODES.MANIFEST_UPDATE_FAILED,
        `Failed to update manifest for ${entity}`,
        { cause: error }
      );
    }
    return { recordHash, hashPrev: state.hashPrev, hashIndex: state.hashIndex };
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      STORAGE_ERROR_CODES.AUDIT_APPEND_FAILED,
      `Failed to append audit for ${entity}`,
      { cause: error }
    );
  }
}
