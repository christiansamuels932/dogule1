/* eslint-env node */
/* global Buffer, process, console */
import crypto from "node:crypto";
import { db } from "../../modules/shared/api/db/index.js";

function uuidv7FromSeed(seed) {
  const hash = crypto.createHash("sha256").update(seed).digest();
  const bytes = Buffer.alloc(16);
  hash.copy(bytes, 0, 0, 16);
  // version 7
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // RFC 4122 variant
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

const modules = {
  kunden: db.kunden,
  hunde: db.hunde,
  kurse: db.kurse,
  trainer: db.trainer,
  kalender: db.kalender,
  finanzen: db.zahlungen,
  waren: db.waren,
  kommunikation: [],
};

export function generateMappings() {
  const mappings = {};
  for (const [name, arr] of Object.entries(modules)) {
    mappings[name] = Array.from(new Set((arr || []).map((r) => r.id)))
      .sort()
      .map((id) => ({
        legacyId: id,
        targetUuid: uuidv7FromSeed(`${name}:${id}`),
        version: 1,
      }));
  }
  return mappings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const mappings = generateMappings();
  console.log(JSON.stringify(mappings, null, 2));
}
