/* global Buffer */
import { canonicalJson, ensureDir, sha256Hex, writeFileAtomic } from "./utils.js";
import { StorageError, STORAGE_ERROR_CODES } from "../errors.js";

export async function writeEntityFile(paths, entity, id, payload) {
  const targetPath = paths.dataFile(entity, id);
  const dir = paths.entityDir(entity);
  await ensureDir(dir);
  const canonical = canonicalJson(payload);
  const checksum = sha256Hex(canonical);
  const wrapper = {
    data: payload,
    checksum,
    checksumAlgo: "sha256",
    canonical: "json-v1",
  };
  try {
    await writeFileAtomic(targetPath, Buffer.from(JSON.stringify(wrapper)));
    return { checksum, canonical };
  } catch (error) {
    throw new StorageError(
      STORAGE_ERROR_CODES.ATOMIC_WRITE_FAILED,
      `Failed to write entity file for ${entity}:${id}`,
      { cause: error }
    );
  }
}
