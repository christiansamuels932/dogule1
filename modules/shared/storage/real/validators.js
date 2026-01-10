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

function assertOptionalBoolean(value, field) {
  if (value === undefined || value === null) return;
  if (typeof value !== "boolean") {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      `${field} must be a boolean`
    );
  }
}

function assertOptionalStringOrNumber(value, field) {
  if (value === undefined || value === null) return;
  if (typeof value === "string") return;
  if (typeof value === "number" && !Number.isNaN(value)) return;
  throw new StorageError(
    STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
    `${field} must be a string or number`
  );
}

function assertNullOrNumber(value, field) {
  if (value === null) return;
  assertOptionalNumber(value, field);
}

function assertUuid(value, field) {
  assertString(value, field);
  if (!UUID_REGEX.test(value)) {
    throw new StorageError(STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED, `${field} must be a uuid`);
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
  assertOptionalString(record.status, "hunde.status");
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
    "aboForm",
    "alterHund",
    "aufbauend",
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
  if (record.trainerIds !== undefined && record.trainerIds !== null) {
    if (!Array.isArray(record.trainerIds)) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        "kurse.trainerIds must be an array"
      );
    }
    record.trainerIds.forEach((id, idx) => {
      assertString(id, `kurse.trainerIds[${idx}]`);
    });
  }
  assertOptionalString(record.date, "kurse.date");
  assertOptionalString(record.startTime, "kurse.startTime");
  assertOptionalString(record.endTime, "kurse.endTime");
  assertOptionalString(record.location, "kurse.location");
  assertOptionalString(record.status, "kurse.status");
  assertOptionalString(record.aboForm, "kurse.aboForm");
  assertOptionalString(record.alterHund, "kurse.alterHund");
  assertOptionalString(record.aufbauend, "kurse.aufbauend");
  assertOptionalNumber(record.capacity, "kurse.capacity");
  assertOptionalNumber(record.bookedCount, "kurse.bookedCount");
  assertOptionalString(record.level, "kurse.level");
  assertOptionalStringOrNumber(record.price, "kurse.price");
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

export function validateGroupchatRoom(record) {
  const required = ["id", "title", "retentionDays", "createdAt", "updatedAt", "schemaVersion"];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_groupchat_room.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_groupchat_room");
  assertString(record.id, "kommunikation_groupchat_room.id");
  assertString(record.title, "kommunikation_groupchat_room.title");
  assertNullOrNumber(record.retentionDays, "kommunikation_groupchat_room.retentionDays");
  if (record.retentionDays !== null) {
    if (!Number.isInteger(record.retentionDays) || record.retentionDays < 1) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        "kommunikation_groupchat_room.retentionDays must be an integer >= 1 or null"
      );
    }
  }
  assertString(record.createdAt, "kommunikation_groupchat_room.createdAt");
  assertString(record.updatedAt, "kommunikation_groupchat_room.updatedAt");
  return record;
}

export function validateGroupchatMessage(record) {
  const required = [
    "id",
    "roomId",
    "createdAt",
    "authorActorId",
    "authorRole",
    "body",
    "clientNonce",
    "status",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_groupchat_message.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_groupchat_message");
  assertUuid(record.id, "kommunikation_groupchat_message.id");
  assertString(record.roomId, "kommunikation_groupchat_message.roomId");
  assertString(record.createdAt, "kommunikation_groupchat_message.createdAt");
  assertString(record.authorActorId, "kommunikation_groupchat_message.authorActorId");
  assertString(record.authorRole, "kommunikation_groupchat_message.authorRole");
  assertString(record.body, "kommunikation_groupchat_message.body");
  assertString(record.clientNonce, "kommunikation_groupchat_message.clientNonce");
  assertString(record.status, "kommunikation_groupchat_message.status");
  return record;
}

export function validateGroupchatReadMarker(record) {
  const required = ["id", "roomId", "actorId", "lastReadMessageId", "lastReadAt", "schemaVersion"];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_groupchat_read_marker.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_groupchat_read_marker");
  assertString(record.id, "kommunikation_groupchat_read_marker.id");
  assertString(record.roomId, "kommunikation_groupchat_read_marker.roomId");
  assertString(record.actorId, "kommunikation_groupchat_read_marker.actorId");
  assertUuid(record.lastReadMessageId, "kommunikation_groupchat_read_marker.lastReadMessageId");
  assertString(record.lastReadAt, "kommunikation_groupchat_read_marker.lastReadAt");
  return record;
}

export function validateGroupchatSendDedupe(record) {
  const required = [
    "id",
    "key",
    "roomId",
    "actorId",
    "clientNonceHash",
    "messageId",
    "createdAt",
    "expiresAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_groupchat_send_dedupe.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_groupchat_send_dedupe");
  assertString(record.id, "kommunikation_groupchat_send_dedupe.id");
  assertString(record.key, "kommunikation_groupchat_send_dedupe.key");
  assertString(record.roomId, "kommunikation_groupchat_send_dedupe.roomId");
  assertString(record.actorId, "kommunikation_groupchat_send_dedupe.actorId");
  assertString(record.clientNonceHash, "kommunikation_groupchat_send_dedupe.clientNonceHash");
  assertUuid(record.messageId, "kommunikation_groupchat_send_dedupe.messageId");
  assertString(record.createdAt, "kommunikation_groupchat_send_dedupe.createdAt");
  assertString(record.expiresAt, "kommunikation_groupchat_send_dedupe.expiresAt");
  return record;
}

export function validateInfochannelNotice(record) {
  const required = [
    "id",
    "title",
    "body",
    "status",
    "createdAt",
    "createdByActorId",
    "createdByRole",
    "targetRole",
    "targetIds",
    "slaHours",
    "slaDueAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_infochannel_notice.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_infochannel_notice");
  assertUuid(record.id, "kommunikation_infochannel_notice.id");
  assertString(record.title, "kommunikation_infochannel_notice.title");
  assertString(record.body, "kommunikation_infochannel_notice.body");
  assertString(record.status, "kommunikation_infochannel_notice.status");
  assertString(record.createdAt, "kommunikation_infochannel_notice.createdAt");
  assertString(record.createdByActorId, "kommunikation_infochannel_notice.createdByActorId");
  assertString(record.createdByRole, "kommunikation_infochannel_notice.createdByRole");
  assertString(record.targetRole, "kommunikation_infochannel_notice.targetRole");
  if (!Array.isArray(record.targetIds)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      "kommunikation_infochannel_notice.targetIds must be an array"
    );
  }
  record.targetIds.forEach((id, idx) => {
    assertUuid(id, `kommunikation_infochannel_notice.targetIds[${idx}]`);
  });
  assertOptionalNumber(record.slaHours, "kommunikation_infochannel_notice.slaHours");
  assertString(record.slaDueAt, "kommunikation_infochannel_notice.slaDueAt");
  return record;
}

export function validateInfochannelConfirmation(record) {
  const required = [
    "id",
    "noticeId",
    "trainerId",
    "confirmedAt",
    "actorId",
    "actorRole",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_infochannel_confirmation.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_infochannel_confirmation");
  assertString(record.id, "kommunikation_infochannel_confirmation.id");
  assertString(record.noticeId, "kommunikation_infochannel_confirmation.noticeId");
  assertString(record.trainerId, "kommunikation_infochannel_confirmation.trainerId");
  assertString(record.confirmedAt, "kommunikation_infochannel_confirmation.confirmedAt");
  assertString(record.actorId, "kommunikation_infochannel_confirmation.actorId");
  assertString(record.actorRole, "kommunikation_infochannel_confirmation.actorRole");
  return record;
}

export function validateInfochannelEvent(record) {
  const required = [
    "id",
    "noticeId",
    "trainerId",
    "eventType",
    "createdAt",
    "actorId",
    "actorRole",
    "slaDueAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_infochannel_notice_event.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_infochannel_notice_event");
  assertString(record.id, "kommunikation_infochannel_notice_event.id");
  assertString(record.noticeId, "kommunikation_infochannel_notice_event.noticeId");
  assertString(record.trainerId, "kommunikation_infochannel_notice_event.trainerId");
  assertString(record.eventType, "kommunikation_infochannel_notice_event.eventType");
  if (!["reminder", "escalation"].includes(record.eventType)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      "kommunikation_infochannel_notice_event.eventType must be reminder or escalation"
    );
  }
  assertString(record.createdAt, "kommunikation_infochannel_notice_event.createdAt");
  assertString(record.actorId, "kommunikation_infochannel_notice_event.actorId");
  assertString(record.actorRole, "kommunikation_infochannel_notice_event.actorRole");
  assertString(record.slaDueAt, "kommunikation_infochannel_notice_event.slaDueAt");
  return record;
}

export function validateAutomationSettings(record) {
  const required = [
    "id",
    "provider",
    "senderEmail",
    "senderName",
    "replyTo",
    "smtpHost",
    "smtpPort",
    "smtpSecure",
    "smtpUser",
    "smtpPassword",
    "sendingEnabled",
    "birthdayEnabled",
    "certificateEnabled",
    "createdAt",
    "updatedAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_automation_settings.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_automation_settings");
  assertString(record.id, "kommunikation_automation_settings.id");
  assertString(record.provider, "kommunikation_automation_settings.provider");
  assertString(record.senderEmail, "kommunikation_automation_settings.senderEmail");
  assertString(record.senderName, "kommunikation_automation_settings.senderName");
  assertString(record.replyTo, "kommunikation_automation_settings.replyTo");
  assertString(record.smtpHost, "kommunikation_automation_settings.smtpHost");
  assertOptionalNumber(record.smtpPort, "kommunikation_automation_settings.smtpPort");
  assertOptionalBoolean(record.smtpSecure, "kommunikation_automation_settings.smtpSecure");
  assertString(record.smtpUser, "kommunikation_automation_settings.smtpUser");
  assertString(record.smtpPassword, "kommunikation_automation_settings.smtpPassword");
  assertOptionalBoolean(record.sendingEnabled, "kommunikation_automation_settings.sendingEnabled");
  assertOptionalBoolean(
    record.birthdayEnabled,
    "kommunikation_automation_settings.birthdayEnabled"
  );
  assertOptionalBoolean(
    record.certificateEnabled,
    "kommunikation_automation_settings.certificateEnabled"
  );
  assertString(record.createdAt, "kommunikation_automation_settings.createdAt");
  assertString(record.updatedAt, "kommunikation_automation_settings.updatedAt");
  return record;
}

export function validateAutomationEvent(record) {
  const required = [
    "id",
    "eventType",
    "status",
    "reason",
    "senderEmail",
    "recipientEmail",
    "kundeId",
    "hundId",
    "zertifikatId",
    "actorId",
    "actorRole",
    "createdAt",
    "schemaVersion",
  ];
  required.forEach((field) => {
    if (record[field] === undefined) {
      throw new StorageError(
        STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        `kommunikation_automation_event.${field} is required`
      );
    }
  });
  requireSchemaVersion(record, "kommunikation_automation_event");
  assertString(record.id, "kommunikation_automation_event.id");
  assertString(record.eventType, "kommunikation_automation_event.eventType");
  if (!["birthday", "certificate_delivery"].includes(record.eventType)) {
    throw new StorageError(
      STORAGE_ERROR_CODES.SCHEMA_VALIDATION_FAILED,
      "kommunikation_automation_event.eventType must be birthday or certificate_delivery"
    );
  }
  assertString(record.status, "kommunikation_automation_event.status");
  assertString(record.reason, "kommunikation_automation_event.reason");
  assertString(record.senderEmail, "kommunikation_automation_event.senderEmail");
  assertString(record.recipientEmail, "kommunikation_automation_event.recipientEmail");
  assertOptionalString(record.kundeId, "kommunikation_automation_event.kundeId");
  assertOptionalString(record.hundId, "kommunikation_automation_event.hundId");
  assertOptionalString(record.zertifikatId, "kommunikation_automation_event.zertifikatId");
  assertOptionalString(record.decision, "kommunikation_automation_event.decision");
  assertOptionalString(record.decidedAt, "kommunikation_automation_event.decidedAt");
  assertOptionalString(record.decidedBy, "kommunikation_automation_event.decidedBy");
  assertString(record.actorId, "kommunikation_automation_event.actorId");
  assertString(record.actorRole, "kommunikation_automation_event.actorRole");
  assertString(record.createdAt, "kommunikation_automation_event.createdAt");
  return record;
}
