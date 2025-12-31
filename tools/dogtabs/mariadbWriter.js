/* global process */
import mariadb from "mariadb";

const DEFAULT_POOL_LIMIT = 5;

function resolveConfig(options = {}) {
  const env = options.env || process.env;
  const socketPath = options.socketPath || env.DOGULE1_MARIADB_SOCKET || undefined;
  const config = {
    host: options.host || env.DOGULE1_MARIADB_HOST || "127.0.0.1",
    port: Number(options.port || env.DOGULE1_MARIADB_PORT || 3307),
    user: options.user || env.DOGULE1_MARIADB_USER || "root",
    password: options.password || env.DOGULE1_MARIADB_PASSWORD || "",
    database: options.database || env.DOGULE1_MARIADB_DATABASE || "dogule1",
    connectionLimit: Number(
      options.connectionLimit || env.DOGULE1_MARIADB_POOL_LIMIT || DEFAULT_POOL_LIMIT
    ),
  };
  if (socketPath) {
    config.socketPath = socketPath;
  }
  return config;
}

function toJson(value) {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

async function writeModule(conn, moduleName, records, insertFn) {
  await conn.beginTransaction();
  try {
    for (const record of records) {
      await insertFn(conn, record);
    }
    await conn.commit();
    return { module: moduleName, inserted: records.length };
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

function insertKunde(conn, record) {
  return conn.query(
    "INSERT INTO kunden (id, code, vorname, nachname, email, telefon, adresse, status, ausweis_id, foto_url, begleitpersonen, notizen, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      record.id,
      record.code,
      record.vorname,
      record.nachname,
      record.email,
      record.telefon,
      record.adresse,
      record.status,
      record.ausweisId,
      record.fotoUrl,
      toJson(record.begleitpersonen),
      record.notizen,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ]
  );
}

function insertHund(conn, record) {
  return conn.query(
    "INSERT INTO hunde (id, code, name, rufname, rasse, geschlecht, geburtsdatum, gewicht_kg, groesse_cm, kunden_id, trainingsziele, notizen, felltyp, kastriert, fellfarbe, groesse_typ, herkunft, chip_nummer, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      record.id,
      record.code,
      record.name,
      record.rufname,
      record.rasse,
      record.geschlecht,
      record.geburtsdatum,
      record.gewichtKg,
      record.groesseCm,
      record.kundenId,
      record.trainingsziele,
      record.notizen,
      record.felltyp,
      record.kastriert,
      record.fellfarbe,
      record.groesseTyp,
      record.herkunft,
      record.chipNummer,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ]
  );
}

function insertTrainer(conn, record) {
  return conn.query(
    "INSERT INTO trainer (id, code, name, email, telefon, notizen, verfuegbarkeiten, ausbildungshistorie, stundenerfassung, lohnabrechnung, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      record.id,
      record.code,
      record.name,
      record.email,
      record.telefon,
      record.notizen,
      toJson(record.verfuegbarkeiten),
      record.ausbildungshistorie,
      record.stundenerfassung,
      record.lohnabrechnung,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ]
  );
}

function insertKurs(conn, record) {
  return conn.query(
    "INSERT INTO kurse (id, code, title, trainer_name, trainer_id, date, start_time, end_time, location, status, capacity, booked_count, level, price, notes, hund_ids, kunden_ids, outlook_event_id, outlook_date, outlook_start, outlook_end, outlook_location, inventory_flag, portfolio_flag, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      record.id,
      record.code,
      record.title,
      record.trainerName,
      record.trainerId,
      record.date,
      record.startTime,
      record.endTime,
      record.location,
      record.status,
      record.capacity,
      record.bookedCount,
      record.level,
      record.price,
      record.notes,
      toJson(record.hundIds),
      toJson(record.kundenIds),
      record.outlookEventId,
      record.outlookDate,
      record.outlookStart,
      record.outlookEnd,
      record.outlookLocation,
      record.inventoryFlag ? 1 : 0,
      record.portfolioFlag ? 1 : 0,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ]
  );
}

function insertFinanz(conn, record) {
  return conn.query(
    "INSERT INTO zahlungen (id, code, kunde_id, kurs_id, trainer_id, typ, betrag, datum, beschreibung, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      record.id,
      record.code,
      record.kundeId,
      record.kursId,
      record.trainerId,
      record.typ,
      record.betrag,
      record.datum,
      record.beschreibung,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ]
  );
}

function insertPension(conn, record) {
  return conn.query(
    "INSERT INTO dogtabs_pension_staging (id, legacy_id, kunden_id, kunden_legacy_id, raw_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      record.id,
      record.legacyId,
      record.kundeId,
      record.kundeLegacyId,
      JSON.stringify(record.raw),
      record.createdAt,
      record.updatedAt,
    ]
  );
}

export async function writeDogtabsModules(modules, options = {}) {
  const pool = mariadb.createPool(resolveConfig(options));
  const conn = await pool.getConnection();
  try {
    const results = [];
    if (modules.kunden) {
      results.push(await writeModule(conn, "kunden", modules.kunden, insertKunde));
    }
    if (modules.hunde) {
      results.push(await writeModule(conn, "hunde", modules.hunde, insertHund));
    }
    if (modules.trainer) {
      results.push(await writeModule(conn, "trainer", modules.trainer, insertTrainer));
    }
    if (modules.kurse) {
      results.push(await writeModule(conn, "kurse", modules.kurse, insertKurs));
    }
    if (modules.finanzen) {
      results.push(await writeModule(conn, "finanzen", modules.finanzen, insertFinanz));
    }
    if (modules.pension) {
      results.push(await writeModule(conn, "pension", modules.pension, insertPension));
    }
    return results;
  } finally {
    conn.release();
    await pool.end();
  }
}

export async function writeKundenRecords(records, options = {}) {
  const pool = mariadb.createPool(resolveConfig(options));
  const conn = await pool.getConnection();
  try {
    return await writeModule(conn, "kunden", records, insertKunde);
  } finally {
    conn.release();
    await pool.end();
  }
}
