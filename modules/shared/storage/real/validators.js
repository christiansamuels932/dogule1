import { StorageError, STORAGE_ERROR_CODES } from "../errors.js";

const UUID_REGEX = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

function requireSchemaVersion(record, entity) {
  if (record.schemaVersion !== 1) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      `${entity} schemaVersion must be 1`
    );
  }
}

function assertString(value, field) {
  if (typeof value !== "string") {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      `${field} must be a string`
    );
  }
}

function assertOptionalString(value, field) {
  if (value === undefined || value === null) return;
  assertString(value, field);
}

function assertOptionalNumber(value, field) {
  if (value === undefined || value === null) return;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      `${field} must be a number`
    );
  }
}

function assertUuid(value, field) {
  assertString(value, field);
  if (!UUID_REGEX.test(value)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      `${field} must be a uuid`
    );
  }
}

export function validateKunde(record) {
  const required = [
    "id",
    "code",
    "vorname",
    "nachname",
    "email",
    "telefon",
    "adresse",
    "notizen",
    "createdAt",
    "updatedAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kunden.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kunden");
  assertUuid(record.id, "kunden.id");
  assertString(record.code, "kunden.code");
  assertString(record.vorname, "kunden.vorname");
  assertString(record.nachname, "kunden.nachname");
  assertOptionalString(record.email, "kunden.email");
  assertOptionalString(record.telefon, "kunden.telefon");
  assertOptionalString(record.adresse, "kunden.adresse");
  assertOptionalString(record.notizen, "kunden.notizen");
  assertString(record.createdAt, "kunden.createdAt");
  assertString(record.updatedAt, "kunden.updatedAt");
  return record;
}

export function validateHund(record) {
  const required = [
    "id",
    "code",
    "name",
    "rufname",
    "rasse",
    "geschlecht",
    "geburtsdatum",
    "gewichtKg",
    "groesseCm",
    "kundenId",
    "trainingsziele",
    "notizen",
    "createdAt",
    "updatedAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `hunde.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "hunde");
  assertUuid(record.id, "hunde.id");
  assertString(record.code, "hunde.code");
  assertString(record.name, "hunde.name");
  assertOptionalString(record.rufname, "hunde.rufname");
  assertOptionalString(record.rasse, "hunde.rasse");
  assertOptionalString(record.geschlecht, "hunde.geschlecht");
  assertOptionalString(record.geburtsdatum, "hunde.geburtsdatum");
  assertOptionalNumber(record.gewichtKg, "hunde.gewichtKg");
  assertOptionalNumber(record.groesseCm, "hunde.groesseCm");
  assertUuid(record.kundenId, "hunde.kundenId");
  assertOptionalString(record.trainingsziele, "hunde.trainingsziele");
  assertOptionalString(record.notizen, "hunde.notizen");
  assertString(record.createdAt, "hunde.createdAt");
  assertString(record.updatedAt, "hunde.updatedAt");
  return record;
}

export function validateTrainer(record) {
  const required = [
    "id",
    "code",
    "name",
    "email",
    "telefon",
    "notizen",
    "verfuegbarkeiten",
    "createdAt",
    "updatedAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `trainer.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "trainer");
  assertUuid(record.id, "trainer.id");
  assertString(record.code, "trainer.code");
  assertString(record.name, "trainer.name");
  assertOptionalString(record.email, "trainer.email");
  assertOptionalString(record.telefon, "trainer.telefon");
  assertOptionalString(record.notizen, "trainer.notizen");
  if (!Array.isArray(record.verfuegbarkeiten)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      "trainer.verfuegbarkeiten must be an array"
    );
  }
  record.verfuegbarkeiten.forEach((slot, idx) => {
    if (typeof slot !== "object" || slot === null) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `trainer.verfuegbarkeiten[${idx}] must be an object`
      );
    }
    assertOptionalNumber(slot.weekday, `trainer.verfuegbarkeiten[${idx}].weekday`);
    assertOptionalString(slot.startTime, `trainer.verfuegbarkeiten[${idx}].startTime`);
    assertOptionalString(slot.endTime, `trainer.verfuegbarkeiten[${idx}].endTime`);
  });
  assertString(record.createdAt, "trainer.createdAt");
  assertString(record.updatedAt, "trainer.updatedAt");
  return record;
}

export function validateKurs(record) {
  const required = [
    "id",
    "code",
    "title",
    "trainerName",
    "trainerId",
    "date",
    "startTime",
    "endTime",
    "location",
    "status",
    "capacity",
    "bookedCount",
    "level",
    "price",
    "notes",
    "hundIds",
    "createdAt",
    "updatedAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kurse.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kurse");
  assertUuid(record.id, "kurse.id");
  assertString(record.code, "kurse.code");
  assertString(record.title, "kurse.title");
  assertString(record.trainerName, "kurse.trainerName");
  assertUuid(record.trainerId, "kurse.trainerId");
  assertOptionalString(record.date, "kurse.date");
  assertOptionalString(record.startTime, "kurse.startTime");
  assertOptionalString(record.endTime, "kurse.endTime");
  assertOptionalString(record.location, "kurse.location");
  assertOptionalString(record.status, "kurse.status");
  assertOptionalNumber(record.capacity, "kurse.capacity");
  assertOptionalNumber(record.bookedCount, "kurse.bookedCount");
  assertOptionalString(record.level, "kurse.level");
  assertOptionalNumber(record.price, "kurse.price");
  assertOptionalString(record.notes, "kurse.notes");
  if (!Array.isArray(record.hundIds)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      "kurse.hundIds must be an array"
    );
  }
  record.hundIds.forEach((id, idx) => {
    assertString(id, `kurse.hundIds[${idx}]`);
  });
  assertString(record.createdAt, "kurse.createdAt");
  assertString(record.updatedAt, "kurse.updatedAt");
  return record;
}
