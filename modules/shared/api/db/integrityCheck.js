/* globals process */
import { db } from "./index.js";

function ensureUniqueIds(tableName, records = []) {
  const seen = new Set();
  for (const record of records) {
    if (!record?.id) {
      throw new Error(`[INTEGRITY] ${tableName} record missing id`);
    }
    if (seen.has(record.id)) {
      throw new Error(`[INTEGRITY] Duplicate id "${record.id}" in ${tableName}`);
    }
    seen.add(record.id);
  }
}

function ensureForeignKeys() {
  const exists = (table, id) => db[table]?.some((item) => item.id === id);

  db.hunde?.forEach((hund) => {
    if (!exists("kunden", hund.kundenId)) {
      throw new Error(`[INTEGRITY] Hund ${hund.id} references missing Kunde ${hund.kundenId}`);
    }
  });

  db.kurse?.forEach((kurs) => {
    if (kurs.trainerId && !exists("trainer", kurs.trainerId)) {
      throw new Error(`[INTEGRITY] Kurs ${kurs.id} references missing Trainer ${kurs.trainerId}`);
    }
    kurs.hundIds?.forEach((hundId) => {
      if (!exists("hunde", hundId)) {
        throw new Error(`[INTEGRITY] Kurs ${kurs.id} references missing Hund ${hundId}`);
      }
    });
  });

  db.kalender?.forEach((entry) => {
    if (entry.kursId && !exists("kurse", entry.kursId)) {
      throw new Error(`[INTEGRITY] Kalender ${entry.id} references missing Kurs ${entry.kursId}`);
    }
    if (entry.trainerId && !exists("trainer", entry.trainerId)) {
      throw new Error(
        `[INTEGRITY] Kalender ${entry.id} references missing Trainer ${entry.trainerId}`
      );
    }
  });

  db.zahlungen?.forEach((entry) => {
    if (!exists("kunden", entry.kundenId)) {
      throw new Error(`[INTEGRITY] Zahlung ${entry.id} references missing Kunde ${entry.kundenId}`);
    }
  });

  db.waren?.forEach((verkauf) => {
    if (!exists("kunden", verkauf.kundenId)) {
      throw new Error(
        `[INTEGRITY] Warenverkauf ${verkauf.id} references missing Kunde ${verkauf.kundenId}`
      );
    }
  });
}

export function runIntegrityCheck() {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    return;
  }
  ensureUniqueIds("kunden", db.kunden);
  ensureUniqueIds("hunde", db.hunde);
  ensureUniqueIds("kurse", db.kurse);
  ensureUniqueIds("trainer", db.trainer);
  ensureUniqueIds("kalender", db.kalender);
  ensureUniqueIds("zahlungen", db.zahlungen);
  ensureUniqueIds("waren", db.waren);
  ensureForeignKeys();
}
