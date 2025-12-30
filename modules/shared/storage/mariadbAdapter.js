/* global process, console */
import mariadb from "mariadb";
import { StorageError, STORAGE_ERROR_CODES } from "./errors.js";
import { uuidv7 } from "../utils/uuidv7.js";

const DEFAULT_POOL_LIMIT = 10;
const DEFAULT_SOCKET_PATH = "/home/ran/codex/.local/mariadb/mariadb.sock";

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value;
  return String(value);
}

function toArrayValue(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function toJson(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  return JSON.stringify(value);
}

function parseJson(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toBoolOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return Boolean(value);
}

function nowIso() {
  return new Date().toISOString();
}

function resolveConfig(options = {}) {
  const env = options.env || process.env;
  const socketPath = options.socketPath || env.DOGULE1_MARIADB_SOCKET || DEFAULT_SOCKET_PATH;
  const defaultUser = env.DOGULE1_MARIADB_USER || env.USER || env.LOGNAME || "root";
  const config = {
    host: options.host || env.DOGULE1_MARIADB_HOST || "127.0.0.1",
    port: Number(options.port || env.DOGULE1_MARIADB_PORT || 3307),
    user: options.user || defaultUser,
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

function toStorageError(error, fallbackMessage) {
  if (error instanceof StorageError) return error;
  return new StorageError(
    STORAGE_ERROR_CODES.STORAGE_ERROR,
    fallbackMessage || error?.message || "MariaDB operation failed",
    { cause: error }
  );
}

function mapKundeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    vorname: row.vorname,
    nachname: row.nachname,
    email: row.email,
    telefon: row.telefon,
    adresse: row.adresse,
    status: row.status,
    ausweisId: row.ausweis_id,
    fotoUrl: row.foto_url,
    begleitpersonen: parseJson(row.begleitpersonen, []),
    notizen: row.notizen,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    version: row.version,
  };
}

function mapHundRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    rufname: row.rufname,
    rasse: row.rasse,
    geschlecht: row.geschlecht,
    status: row.status,
    geburtsdatum: row.geburtsdatum,
    gewichtKg: row.gewicht_kg === null ? null : toNumber(row.gewicht_kg, null),
    groesseCm: row.groesse_cm === null ? null : toNumber(row.groesse_cm, null),
    kundenId: row.kunden_id,
    trainingsziele: row.trainingsziele,
    notizen: row.notizen,
    felltyp: row.felltyp,
    kastriert: row.kastriert === null ? null : Boolean(row.kastriert),
    fellfarbe: row.fellfarbe,
    groesseTyp: row.groesse_typ,
    herkunft: row.herkunft,
    chipNummer: row.chip_nummer,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    version: row.version,
  };
}

function mapTrainerRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    email: row.email,
    telefon: row.telefon,
    notizen: row.notizen,
    verfuegbarkeiten: parseJson(row.verfuegbarkeiten, []),
    ausbildungshistorie: row.ausbildungshistorie,
    stundenerfassung: row.stundenerfassung,
    lohnabrechnung: row.lohnabrechnung,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    version: row.version,
  };
}

function mapKursRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    trainerName: row.trainer_name,
    trainerId: row.trainer_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    status: row.status,
    capacity: toNumber(row.capacity, 0),
    bookedCount: toNumber(row.booked_count, 0),
    level: row.level,
    price: toNumber(row.price, 0),
    notes: row.notes,
    hundIds: parseJson(row.hund_ids, []),
    kundenIds: parseJson(row.kunden_ids, []),
    outlookEventId: row.outlook_event_id,
    outlookDate: row.outlook_date,
    outlookStart: row.outlook_start,
    outlookEnd: row.outlook_end,
    outlookLocation: row.outlook_location,
    inventoryFlag: Boolean(row.inventory_flag),
    portfolioFlag: Boolean(row.portfolio_flag),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    version: row.version,
  };
}

function mapKalenderRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    start: row.start_at,
    end: row.end_at,
    location: row.location,
    notes: row.notes,
    kursId: row.kurs_id,
    trainerId: row.trainer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    version: row.version,
  };
}

function mapFinanzRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    kundeId: row.kunde_id,
    kursId: row.kurs_id,
    trainerId: row.trainer_id,
    typ: row.typ,
    betrag: toNumber(row.betrag, 0),
    datum: row.datum,
    beschreibung: row.beschreibung,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    version: row.version,
  };
}

function mapWarenRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    kundenId: row.kunden_id,
    produktName: row.produkt_name,
    menge: toNumber(row.menge, 1),
    preis: toNumber(row.preis, 0),
    datum: row.datum,
    beschreibung: row.beschreibung,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schemaVersion: row.schema_version,
    version: row.version,
  };
}

function normalizeKunde(data = {}, existing) {
  const createdAt = existing?.createdAt || data.createdAt || nowIso();
  return {
    id: data.id || existing?.id || uuidv7(),
    code: toStringValue(data.code ?? existing?.code),
    vorname: toStringValue(data.vorname ?? existing?.vorname),
    nachname: toStringValue(data.nachname ?? existing?.nachname),
    email: toStringValue(data.email ?? existing?.email),
    telefon: toStringValue(data.telefon ?? existing?.telefon),
    adresse: toStringValue(data.adresse ?? existing?.adresse),
    status: toStringValue(data.status ?? existing?.status),
    ausweisId: toStringValue(
      data.ausweisId ?? data.ausweisID ?? existing?.ausweisId ?? existing?.ausweisID
    ),
    fotoUrl: toStringValue(data.fotoUrl ?? data.foto ?? existing?.fotoUrl ?? existing?.foto),
    begleitpersonen: Array.isArray(data.begleitpersonen)
      ? data.begleitpersonen
      : Array.isArray(existing?.begleitpersonen)
        ? existing.begleitpersonen
        : [],
    notizen: toStringValue(data.notizen ?? existing?.notizen),
    createdAt,
    updatedAt: nowIso(),
    schemaVersion: Number(data.schemaVersion ?? existing?.schemaVersion ?? 1),
    version: Number(data.version ?? existing?.version ?? 0),
  };
}

function normalizeHund(data = {}, existing) {
  const createdAt = existing?.createdAt || data.createdAt || nowIso();
  return {
    id: data.id || existing?.id || uuidv7(),
    code: toStringValue(data.code ?? existing?.code),
    name: toStringValue(data.name ?? existing?.name),
    rufname: toStringValue(data.rufname ?? existing?.rufname),
    rasse: toStringValue(data.rasse ?? existing?.rasse),
    geschlecht: toStringValue(data.geschlecht ?? existing?.geschlecht),
    status: toStringValue(data.status ?? existing?.status),
    geburtsdatum: toStringValue(data.geburtsdatum ?? existing?.geburtsdatum),
    gewichtKg: data.gewichtKg ?? existing?.gewichtKg ?? null,
    groesseCm: data.groesseCm ?? existing?.groesseCm ?? null,
    kundenId: toStringValue(data.kundenId ?? existing?.kundenId),
    trainingsziele: toStringValue(data.trainingsziele ?? existing?.trainingsziele),
    notizen: toStringValue(data.notizen ?? existing?.notizen),
    felltyp: toStringValue(data.felltyp ?? data.fellTyp ?? existing?.felltyp ?? existing?.fellTyp),
    kastriert: toBoolOrNull(data.kastriert ?? existing?.kastriert),
    fellfarbe: toStringValue(
      data.fellfarbe ?? data.fellFarbe ?? existing?.fellfarbe ?? existing?.fellFarbe
    ),
    groesseTyp: toStringValue(data.groesseTyp ?? existing?.groesseTyp),
    herkunft: toStringValue(data.herkunft ?? existing?.herkunft),
    chipNummer: toStringValue(
      data.chipNummer ?? data.chipnummer ?? existing?.chipNummer ?? existing?.chipnummer
    ),
    createdAt,
    updatedAt: nowIso(),
    schemaVersion: Number(data.schemaVersion ?? existing?.schemaVersion ?? 1),
    version: Number(data.version ?? existing?.version ?? 0),
  };
}

function normalizeTrainer(data = {}, existing) {
  const createdAt = existing?.createdAt || data.createdAt || nowIso();
  return {
    id: data.id || existing?.id || uuidv7(),
    code: toStringValue(data.code ?? existing?.code),
    name: toStringValue(data.name ?? existing?.name),
    email: toStringValue(data.email ?? existing?.email),
    telefon: toStringValue(data.telefon ?? existing?.telefon),
    notizen: toStringValue(data.notizen ?? existing?.notizen),
    verfuegbarkeiten: Array.isArray(data.verfuegbarkeiten)
      ? data.verfuegbarkeiten
      : Array.isArray(existing?.verfuegbarkeiten)
        ? existing.verfuegbarkeiten
        : [],
    ausbildungshistorie: toStringValue(data.ausbildungshistorie ?? existing?.ausbildungshistorie),
    stundenerfassung: toStringValue(data.stundenerfassung ?? existing?.stundenerfassung),
    lohnabrechnung: toStringValue(data.lohnabrechnung ?? existing?.lohnabrechnung),
    createdAt,
    updatedAt: nowIso(),
    schemaVersion: Number(data.schemaVersion ?? existing?.schemaVersion ?? 1),
    version: Number(data.version ?? existing?.version ?? 0),
  };
}

function normalizeKurs(data = {}, existing) {
  const createdAt = existing?.createdAt || data.createdAt || nowIso();
  return {
    id: data.id || existing?.id || uuidv7(),
    code: toStringValue(data.code ?? existing?.code),
    title: toStringValue(data.title ?? existing?.title),
    trainerName: toStringValue(data.trainerName ?? existing?.trainerName),
    trainerId: toStringValue(data.trainerId ?? existing?.trainerId),
    date: toStringValue(data.date ?? existing?.date),
    startTime: toStringValue(data.startTime ?? existing?.startTime),
    endTime: toStringValue(data.endTime ?? existing?.endTime),
    location: toStringValue(data.location ?? existing?.location),
    status: toStringValue(data.status ?? existing?.status),
    capacity: toNumber(data.capacity ?? existing?.capacity ?? 0, 0),
    bookedCount: toNumber(data.bookedCount ?? existing?.bookedCount ?? 0, 0),
    level: toStringValue(data.level ?? existing?.level),
    price: toNumber(data.price ?? existing?.price ?? 0, 0),
    notes: toStringValue(data.notes ?? existing?.notes),
    hundIds: toArrayValue(data.hundIds ?? existing?.hundIds),
    kundenIds: toArrayValue(data.kundenIds ?? existing?.kundenIds),
    outlookEventId: toStringValue(data.outlookEventId ?? existing?.outlookEventId),
    outlookDate: toStringValue(data.outlookDate ?? existing?.outlookDate),
    outlookStart: toStringValue(data.outlookStart ?? existing?.outlookStart),
    outlookEnd: toStringValue(data.outlookEnd ?? existing?.outlookEnd),
    outlookLocation: toStringValue(data.outlookLocation ?? existing?.outlookLocation),
    inventoryFlag: Boolean(data.inventoryFlag ?? existing?.inventoryFlag ?? false),
    portfolioFlag: Boolean(data.portfolioFlag ?? existing?.portfolioFlag ?? false),
    createdAt,
    updatedAt: nowIso(),
    schemaVersion: Number(data.schemaVersion ?? existing?.schemaVersion ?? 1),
    version: Number(data.version ?? existing?.version ?? 0),
  };
}

function normalizeKalender(data = {}, existing) {
  const createdAt = existing?.createdAt || data.createdAt || nowIso();
  return {
    id: data.id || existing?.id || uuidv7(),
    code: toStringValue(data.code ?? existing?.code),
    title: toStringValue(data.title ?? existing?.title),
    start: toStringValue(data.start ?? existing?.start),
    end: toStringValue(data.end ?? existing?.end),
    location: toStringValue(data.location ?? existing?.location),
    notes: toStringValue(data.notes ?? existing?.notes),
    kursId: data.kursId ?? existing?.kursId ?? null,
    trainerId: data.trainerId ?? existing?.trainerId ?? null,
    createdAt,
    updatedAt: nowIso(),
    schemaVersion: Number(data.schemaVersion ?? existing?.schemaVersion ?? 1),
    version: Number(data.version ?? existing?.version ?? 0),
  };
}

function normalizeFinanz(data = {}, existing) {
  const createdAt = existing?.createdAt || data.createdAt || nowIso();
  return {
    id: data.id || existing?.id || uuidv7(),
    code: toStringValue(data.code ?? existing?.code),
    kundeId: toStringValue(data.kundeId ?? existing?.kundeId),
    kursId: data.kursId ?? existing?.kursId ?? null,
    trainerId: data.trainerId ?? existing?.trainerId ?? null,
    typ: toStringValue(data.typ ?? existing?.typ),
    betrag: toNumber(data.betrag ?? existing?.betrag ?? 0, 0),
    datum: toStringValue(data.datum ?? existing?.datum),
    beschreibung: toStringValue(data.beschreibung ?? existing?.beschreibung),
    createdAt,
    updatedAt: nowIso(),
    schemaVersion: Number(data.schemaVersion ?? existing?.schemaVersion ?? 1),
    version: Number(data.version ?? existing?.version ?? 0),
  };
}

function normalizeWaren(data = {}, existing) {
  const createdAt = existing?.createdAt || data.createdAt || nowIso();
  return {
    id: data.id || existing?.id || uuidv7(),
    code: toStringValue(data.code ?? existing?.code),
    kundenId: toStringValue(data.kundenId ?? existing?.kundenId),
    produktName: toStringValue(data.produktName ?? existing?.produktName),
    menge: toNumber(data.menge ?? existing?.menge ?? 1, 1),
    preis: toNumber(data.preis ?? existing?.preis ?? 0, 0),
    datum: toStringValue(data.datum ?? existing?.datum),
    beschreibung: toStringValue(data.beschreibung ?? existing?.beschreibung),
    createdAt,
    updatedAt: nowIso(),
    schemaVersion: Number(data.schemaVersion ?? existing?.schemaVersion ?? 1),
    version: Number(data.version ?? existing?.version ?? 0),
  };
}

async function fetchOne(pool, sql, params, mapper) {
  const rows = await pool.query(sql, params);
  if (!rows || rows.length === 0) return null;
  return mapper(rows[0]);
}

async function listAll(pool, sql, params, mapper) {
  const rows = await pool.query(sql, params);
  return rows.map(mapper);
}

async function ensureExists(pool, table, id) {
  const rows = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
  if (!rows || rows.length === 0) {
    throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `${table} ${id} not found`);
  }
}

export function createMariaDbAdapter(options = {}) {
  const config = resolveConfig(options);
  console.log(
    `[mariadb] connect host=${config.host} port=${config.port} socket=${config.socketPath || "none"} user=${config.user} db=${config.database}`
  );
  const pool = options.pool || mariadb.createPool(config);

  async function listKunden() {
    try {
      return await listAll(pool, "SELECT * FROM kunden ORDER BY id", [], mapKundeRow);
    } catch (error) {
      throw toStorageError(error, "Failed to list kunden");
    }
  }

  async function getKunde(id) {
    try {
      const record = await fetchOne(pool, "SELECT * FROM kunden WHERE id = ?", [id], mapKundeRow);
      if (!record) {
        throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `kunden ${id} not found`);
      }
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to get kunden ${id}`);
    }
  }

  async function createKunde(data = {}) {
    const record = normalizeKunde(data, null);
    const params = [
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
    ];
    try {
      await pool.query(
        "INSERT INTO kunden (id, code, vorname, nachname, email, telefon, adresse, status, ausweis_id, foto_url, begleitpersonen, notizen, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, "Failed to create kunden");
    }
  }

  async function updateKunde(id, patch = {}) {
    try {
      const existing = await fetchOne(pool, "SELECT * FROM kunden WHERE id = ?", [id], mapKundeRow);
      if (!existing) return null;
      const record = normalizeKunde({ ...existing, ...patch, id: existing.id }, existing);
      const params = [
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
        record.updatedAt,
        record.schemaVersion,
        record.version,
        record.id,
      ];
      await pool.query(
        "UPDATE kunden SET code=?, vorname=?, nachname=?, email=?, telefon=?, adresse=?, status=?, ausweis_id=?, foto_url=?, begleitpersonen=?, notizen=?, updated_at=?, schema_version=?, version=? WHERE id=?",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to update kunden ${id}`);
    }
  }

  async function deleteKunde(id) {
    try {
      await ensureExists(pool, "kunden", id);
      await pool.query("DELETE FROM kunden WHERE id = ?", [id]);
      return { ok: true, id };
    } catch (error) {
      throw toStorageError(error, `Failed to delete kunden ${id}`);
    }
  }

  async function listHunde() {
    try {
      return await listAll(pool, "SELECT * FROM hunde ORDER BY id", [], mapHundRow);
    } catch (error) {
      throw toStorageError(error, "Failed to list hunde");
    }
  }

  async function getHund(id) {
    try {
      const record = await fetchOne(pool, "SELECT * FROM hunde WHERE id = ?", [id], mapHundRow);
      if (!record) {
        throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `hunde ${id} not found`);
      }
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to get hunde ${id}`);
    }
  }

  async function createHund(data = {}) {
    const record = normalizeHund(data, null);
    const params = [
      record.id,
      record.code,
      record.name,
      record.rufname,
      record.rasse,
      record.geschlecht,
      record.status,
      record.geburtsdatum,
      record.gewichtKg,
      record.groesseCm,
      record.kundenId,
      record.trainingsziele,
      record.notizen,
      record.felltyp,
      record.kastriert === null ? null : record.kastriert ? 1 : 0,
      record.fellfarbe,
      record.groesseTyp,
      record.herkunft,
      record.chipNummer,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ];
    try {
      await pool.query(
        "INSERT INTO hunde (id, code, name, rufname, rasse, geschlecht, status, geburtsdatum, gewicht_kg, groesse_cm, kunden_id, trainingsziele, notizen, felltyp, kastriert, fellfarbe, groesse_typ, herkunft, chip_nummer, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, "Failed to create hunde");
    }
  }

  async function updateHund(id, patch = {}) {
    try {
      const existing = await fetchOne(pool, "SELECT * FROM hunde WHERE id = ?", [id], mapHundRow);
      if (!existing) return null;
      const record = normalizeHund({ ...existing, ...patch, id: existing.id }, existing);
      const params = [
        record.code,
        record.name,
        record.rufname,
        record.rasse,
        record.geschlecht,
        record.status,
        record.geburtsdatum,
        record.gewichtKg,
        record.groesseCm,
        record.kundenId,
        record.trainingsziele,
        record.notizen,
        record.felltyp,
        record.kastriert === null ? null : record.kastriert ? 1 : 0,
        record.fellfarbe,
        record.groesseTyp,
        record.herkunft,
        record.chipNummer,
        record.updatedAt,
        record.schemaVersion,
        record.version,
        record.id,
      ];
      await pool.query(
        "UPDATE hunde SET code=?, name=?, rufname=?, rasse=?, geschlecht=?, status=?, geburtsdatum=?, gewicht_kg=?, groesse_cm=?, kunden_id=?, trainingsziele=?, notizen=?, felltyp=?, kastriert=?, fellfarbe=?, groesse_typ=?, herkunft=?, chip_nummer=?, updated_at=?, schema_version=?, version=? WHERE id=?",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to update hunde ${id}`);
    }
  }

  async function deleteHund(id) {
    try {
      await ensureExists(pool, "hunde", id);
      await pool.query("DELETE FROM hunde WHERE id = ?", [id]);
      return { ok: true, id };
    } catch (error) {
      throw toStorageError(error, `Failed to delete hunde ${id}`);
    }
  }

  async function listTrainer() {
    try {
      return await listAll(pool, "SELECT * FROM trainer ORDER BY id", [], mapTrainerRow);
    } catch (error) {
      throw toStorageError(error, "Failed to list trainer");
    }
  }

  async function getTrainer(id) {
    try {
      const record = await fetchOne(
        pool,
        "SELECT * FROM trainer WHERE id = ?",
        [id],
        mapTrainerRow
      );
      if (!record) {
        throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `trainer ${id} not found`);
      }
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to get trainer ${id}`);
    }
  }

  async function createTrainer(data = {}) {
    const record = normalizeTrainer(data, null);
    const params = [
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
    ];
    try {
      await pool.query(
        "INSERT INTO trainer (id, code, name, email, telefon, notizen, verfuegbarkeiten, ausbildungshistorie, stundenerfassung, lohnabrechnung, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, "Failed to create trainer");
    }
  }

  async function updateTrainer(id, patch = {}) {
    try {
      const existing = await fetchOne(
        pool,
        "SELECT * FROM trainer WHERE id = ?",
        [id],
        mapTrainerRow
      );
      if (!existing) return null;
      const record = normalizeTrainer({ ...existing, ...patch, id: existing.id }, existing);
      const params = [
        record.code,
        record.name,
        record.email,
        record.telefon,
        record.notizen,
        toJson(record.verfuegbarkeiten),
        record.ausbildungshistorie,
        record.stundenerfassung,
        record.lohnabrechnung,
        record.updatedAt,
        record.schemaVersion,
        record.version,
        record.id,
      ];
      await pool.query(
        "UPDATE trainer SET code=?, name=?, email=?, telefon=?, notizen=?, verfuegbarkeiten=?, ausbildungshistorie=?, stundenerfassung=?, lohnabrechnung=?, updated_at=?, schema_version=?, version=? WHERE id=?",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to update trainer ${id}`);
    }
  }

  async function deleteTrainer(id) {
    try {
      await ensureExists(pool, "trainer", id);
      await pool.query("DELETE FROM trainer WHERE id = ?", [id]);
      return { ok: true, id };
    } catch (error) {
      throw toStorageError(error, `Failed to delete trainer ${id}`);
    }
  }

  async function listKurse() {
    try {
      return await listAll(pool, "SELECT * FROM kurse ORDER BY id", [], mapKursRow);
    } catch (error) {
      throw toStorageError(error, "Failed to list kurse");
    }
  }

  async function getKurs(id) {
    try {
      const record = await fetchOne(pool, "SELECT * FROM kurse WHERE id = ?", [id], mapKursRow);
      if (!record) {
        throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `kurse ${id} not found`);
      }
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to get kurse ${id}`);
    }
  }

  async function createKurs(data = {}) {
    const record = normalizeKurs(data, null);
    const params = [
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
    ];
    try {
      await pool.query(
        "INSERT INTO kurse (id, code, title, trainer_name, trainer_id, date, start_time, end_time, location, status, capacity, booked_count, level, price, notes, hund_ids, kunden_ids, outlook_event_id, outlook_date, outlook_start, outlook_end, outlook_location, inventory_flag, portfolio_flag, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, "Failed to create kurse");
    }
  }

  async function updateKurs(id, patch = {}) {
    try {
      const existing = await fetchOne(pool, "SELECT * FROM kurse WHERE id = ?", [id], mapKursRow);
      if (!existing) return null;
      const record = normalizeKurs({ ...existing, ...patch, id: existing.id }, existing);
      const params = [
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
        record.updatedAt,
        record.schemaVersion,
        record.version,
        record.id,
      ];
      await pool.query(
        "UPDATE kurse SET code=?, title=?, trainer_name=?, trainer_id=?, date=?, start_time=?, end_time=?, location=?, status=?, capacity=?, booked_count=?, level=?, price=?, notes=?, hund_ids=?, kunden_ids=?, outlook_event_id=?, outlook_date=?, outlook_start=?, outlook_end=?, outlook_location=?, inventory_flag=?, portfolio_flag=?, updated_at=?, schema_version=?, version=? WHERE id=?",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to update kurse ${id}`);
    }
  }

  async function deleteKurs(id) {
    try {
      await ensureExists(pool, "kurse", id);
      await pool.query("DELETE FROM kurse WHERE id = ?", [id]);
      return { ok: true, id };
    } catch (error) {
      throw toStorageError(error, `Failed to delete kurse ${id}`);
    }
  }

  async function listKalender() {
    try {
      return await listAll(pool, "SELECT * FROM kalender ORDER BY id", [], mapKalenderRow);
    } catch (error) {
      throw toStorageError(error, "Failed to list kalender");
    }
  }

  async function getKalender(id) {
    try {
      const record = await fetchOne(
        pool,
        "SELECT * FROM kalender WHERE id = ?",
        [id],
        mapKalenderRow
      );
      if (!record) {
        throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `kalender ${id} not found`);
      }
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to get kalender ${id}`);
    }
  }

  async function createKalender(data = {}) {
    const record = normalizeKalender(data, null);
    const params = [
      record.id,
      record.code,
      record.title,
      record.start,
      record.end,
      record.location,
      record.notes,
      record.kursId,
      record.trainerId,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ];
    try {
      await pool.query(
        "INSERT INTO kalender (id, code, title, start_at, end_at, location, notes, kurs_id, trainer_id, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, "Failed to create kalender");
    }
  }

  async function updateKalender(id, patch = {}) {
    try {
      const existing = await fetchOne(
        pool,
        "SELECT * FROM kalender WHERE id = ?",
        [id],
        mapKalenderRow
      );
      if (!existing) return null;
      const record = normalizeKalender({ ...existing, ...patch, id: existing.id }, existing);
      const params = [
        record.code,
        record.title,
        record.start,
        record.end,
        record.location,
        record.notes,
        record.kursId,
        record.trainerId,
        record.updatedAt,
        record.schemaVersion,
        record.version,
        record.id,
      ];
      await pool.query(
        "UPDATE kalender SET code=?, title=?, start_at=?, end_at=?, location=?, notes=?, kurs_id=?, trainer_id=?, updated_at=?, schema_version=?, version=? WHERE id=?",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to update kalender ${id}`);
    }
  }

  async function deleteKalender(id) {
    try {
      await ensureExists(pool, "kalender", id);
      await pool.query("DELETE FROM kalender WHERE id = ?", [id]);
      return { ok: true, id };
    } catch (error) {
      throw toStorageError(error, `Failed to delete kalender ${id}`);
    }
  }

  async function listFinanzen() {
    try {
      return await listAll(pool, "SELECT * FROM zahlungen ORDER BY id", [], mapFinanzRow);
    } catch (error) {
      throw toStorageError(error, "Failed to list finanzen");
    }
  }

  async function getFinanz(id) {
    try {
      const record = await fetchOne(
        pool,
        "SELECT * FROM zahlungen WHERE id = ?",
        [id],
        mapFinanzRow
      );
      if (!record) {
        throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `finanzen ${id} not found`);
      }
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to get finanzen ${id}`);
    }
  }

  async function createFinanz(data = {}) {
    const record = normalizeFinanz(data, null);
    const params = [
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
    ];
    try {
      await pool.query(
        "INSERT INTO zahlungen (id, code, kunde_id, kurs_id, trainer_id, typ, betrag, datum, beschreibung, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, "Failed to create finanzen");
    }
  }

  async function updateFinanz(id, patch = {}) {
    try {
      const existing = await fetchOne(
        pool,
        "SELECT * FROM zahlungen WHERE id = ?",
        [id],
        mapFinanzRow
      );
      if (!existing) return null;
      const record = normalizeFinanz({ ...existing, ...patch, id: existing.id }, existing);
      const params = [
        record.code,
        record.kundeId,
        record.kursId,
        record.trainerId,
        record.typ,
        record.betrag,
        record.datum,
        record.beschreibung,
        record.updatedAt,
        record.schemaVersion,
        record.version,
        record.id,
      ];
      await pool.query(
        "UPDATE zahlungen SET code=?, kunde_id=?, kurs_id=?, trainer_id=?, typ=?, betrag=?, datum=?, beschreibung=?, updated_at=?, schema_version=?, version=? WHERE id=?",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to update finanzen ${id}`);
    }
  }

  async function deleteFinanz(id) {
    try {
      await ensureExists(pool, "zahlungen", id);
      await pool.query("DELETE FROM zahlungen WHERE id = ?", [id]);
      return { ok: true, id };
    } catch (error) {
      throw toStorageError(error, `Failed to delete finanzen ${id}`);
    }
  }

  async function listWaren() {
    try {
      return await listAll(pool, "SELECT * FROM waren ORDER BY id", [], mapWarenRow);
    } catch (error) {
      throw toStorageError(error, "Failed to list waren");
    }
  }

  async function getWaren(id) {
    try {
      const record = await fetchOne(pool, "SELECT * FROM waren WHERE id = ?", [id], mapWarenRow);
      if (!record) {
        throw new StorageError(STORAGE_ERROR_CODES.NOT_FOUND, `waren ${id} not found`);
      }
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to get waren ${id}`);
    }
  }

  async function createWaren(data = {}) {
    const record = normalizeWaren(data, null);
    const params = [
      record.id,
      record.code,
      record.kundenId,
      record.produktName,
      record.menge,
      record.preis,
      record.datum,
      record.beschreibung,
      record.createdAt,
      record.updatedAt,
      record.schemaVersion,
      record.version,
    ];
    try {
      await pool.query(
        "INSERT INTO waren (id, code, kunden_id, produkt_name, menge, preis, datum, beschreibung, created_at, updated_at, schema_version, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, "Failed to create waren");
    }
  }

  async function updateWaren(id, patch = {}) {
    try {
      const existing = await fetchOne(pool, "SELECT * FROM waren WHERE id = ?", [id], mapWarenRow);
      if (!existing) return null;
      const record = normalizeWaren({ ...existing, ...patch, id: existing.id }, existing);
      const params = [
        record.code,
        record.kundenId,
        record.produktName,
        record.menge,
        record.preis,
        record.datum,
        record.beschreibung,
        record.updatedAt,
        record.schemaVersion,
        record.version,
        record.id,
      ];
      await pool.query(
        "UPDATE waren SET code=?, kunden_id=?, produkt_name=?, menge=?, preis=?, datum=?, beschreibung=?, updated_at=?, schema_version=?, version=? WHERE id=?",
        params
      );
      return record;
    } catch (error) {
      throw toStorageError(error, `Failed to update waren ${id}`);
    }
  }

  async function deleteWaren(id) {
    try {
      await ensureExists(pool, "waren", id);
      await pool.query("DELETE FROM waren WHERE id = ?", [id]);
      return { ok: true, id };
    } catch (error) {
      throw toStorageError(error, `Failed to delete waren ${id}`);
    }
  }

  return {
    kunden: {
      list: listKunden,
      get: getKunde,
      create: createKunde,
      update: (arg) => updateKunde(arg?.id || arg, arg?.data || arg?.payload || arg?.data || arg),
      delete: deleteKunde,
    },
    hunde: {
      list: listHunde,
      get: getHund,
      create: createHund,
      update: (arg) => updateHund(arg?.id || arg, arg?.data || arg?.payload || arg?.data || arg),
      delete: deleteHund,
    },
    trainer: {
      list: listTrainer,
      get: getTrainer,
      create: createTrainer,
      update: (arg) => updateTrainer(arg?.id || arg, arg?.data || arg?.payload || arg?.data || arg),
      delete: deleteTrainer,
    },
    kurse: {
      list: listKurse,
      get: getKurs,
      create: createKurs,
      update: (arg) => updateKurs(arg?.id || arg, arg?.data || arg?.payload || arg?.data || arg),
      delete: deleteKurs,
    },
    kalender: {
      list: listKalender,
      get: getKalender,
      create: createKalender,
      update: (arg) =>
        updateKalender(arg?.id || arg, arg?.data || arg?.payload || arg?.data || arg),
      delete: deleteKalender,
    },
    finanzen: {
      list: listFinanzen,
      get: getFinanz,
      create: createFinanz,
      update: (arg) => updateFinanz(arg?.id || arg, arg?.data || arg?.payload || arg?.data || arg),
      delete: deleteFinanz,
    },
    waren: {
      list: listWaren,
      get: getWaren,
      create: createWaren,
      update: (arg) => updateWaren(arg?.id || arg, arg?.data || arg?.payload || arg?.data || arg),
      delete: deleteWaren,
    },
    pool,
  };
}
