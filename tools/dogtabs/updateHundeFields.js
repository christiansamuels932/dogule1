#!/usr/bin/env node
/* eslint-env node */
/* globals process, console */
import mariadb from "mariadb";
import { loadAccessTable } from "./accessDb.js";
import { resolveDogtabsConfig } from "./config.js";
import { normalizeDateTime, normalizeString } from "./normalizers.js";

function resolveMariaConfig(options = {}) {
  const env = options.env || process.env;
  const socketPath = options.socketPath || env.DOGULE1_MARIADB_SOCKET || undefined;
  const config = {
    host: options.host || env.DOGULE1_MARIADB_HOST || "127.0.0.1",
    port: Number(options.port || env.DOGULE1_MARIADB_PORT || 3307),
    user: options.user || env.DOGULE1_MARIADB_USER || "root",
    password: options.password || env.DOGULE1_MARIADB_PASSWORD || "",
    database: options.database || env.DOGULE1_MARIADB_DATABASE || "dogule1",
  };
  if (socketPath) {
    config.socketPath = socketPath;
  }
  return config;
}

function createHundLegacyResolver(hundeRows) {
  const counts = new Map();
  for (const row of hundeRows) {
    const legacyId = String(row.hund_nummer || "").trim();
    if (!legacyId) continue;
    counts.set(legacyId, (counts.get(legacyId) || 0) + 1);
  }
  const duplicates = new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([legacyId]) => legacyId)
  );
  const seen = new Map();
  return function resolveHundLegacyId(legacyId) {
    if (!legacyId || !duplicates.has(legacyId)) return legacyId;
    const next = (seen.get(legacyId) || 0) + 1;
    seen.set(legacyId, next);
    return `${legacyId}__dup${next}`;
  };
}

function buildTiergruppenMap(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const code = String(row.tiergrp_tiergrp || "").trim();
    const label = String(row.tiergrp_bezeichnung || "").trim();
    if (code && label) {
      map.set(code, label);
    }
  }
  return map;
}

async function main() {
  const config = resolveDogtabsConfig({});
  const hundeTable = loadAccessTable(config.accessDbPath, "$_kunden_hunde");
  const tiergruppenTable = loadAccessTable(config.accessDbPath, "$_codes_tiergruppen");
  const tiergruppeByCode = buildTiergruppenMap(tiergruppenTable.records);
  const resolveHundLegacyId = createHundLegacyResolver(hundeTable.records);

  const pool = mariadb.createPool(resolveMariaConfig({}));
  const conn = await pool.getConnection();
  let updated = 0;
  try {
    await conn.beginTransaction();
    for (const row of hundeTable.records) {
      const legacyId = normalizeString(row.hund_nummer);
      if (!legacyId) continue;
      const resolvedLegacyId = resolveHundLegacyId(legacyId);
      const code = resolvedLegacyId ? `DT-${resolvedLegacyId}` : "";
      if (!code) continue;
      const geburtsdatum = normalizeDateTime(row.hund_gebdatum).date;
      const tiergruppeCode = normalizeString(row.hund_tiergruppe);
      const herkunft = tiergruppeByCode.get(tiergruppeCode) || tiergruppeCode;
      const result = await conn.query(
        "UPDATE hunde SET geburtsdatum = ?, herkunft = ? WHERE code = ?",
        [geburtsdatum || "", herkunft || "", code]
      );
      if (result.affectedRows > 0) {
        updated += 1;
      }
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
  console.log(`Updated ${updated} hunde rows`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
