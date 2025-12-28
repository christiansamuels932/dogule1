/* global process, console */
import { createMariaDbAdapter } from "../../modules/shared/storage/mariadbAdapter.js";

const env = process.env;
if (!env.DOGULE1_MARIADB_USER) {
  env.DOGULE1_MARIADB_USER = env.USER || env.LOGNAME || "root";
}
if (!env.DOGULE1_MARIADB_SOCKET) {
  env.DOGULE1_MARIADB_SOCKET = "/home/ran/codex/.local/mariadb/mariadb.sock";
}

async function run() {
  const storage = createMariaDbAdapter();
  try {
    const kunde = await storage.kunden.create({
      vorname: "Test",
      nachname: "User",
      status: "aktiv",
      email: "test@example.com",
      telefon: "+41 44 555 00 00",
      adresse: "Testweg 1, 8000 Zurich",
    });

    const trainer = await storage.trainer.create({
      name: "Trainer Test",
      email: "trainer@example.com",
    });

    const hund = await storage.hunde.create({
      name: "Testhund",
      kundenId: kunde.id,
      rasse: "Mischling",
      geschlecht: "Rude",
    });

    const kurs = await storage.kurse.create({
      title: "Testkurs",
      trainerId: trainer.id,
      trainerName: trainer.name,
      date: "2025-01-01",
      startTime: "10:00",
      endTime: "11:00",
      hundIds: [hund.id],
    });

    const kalender = await storage.kalender.create({
      title: "Test Event",
      start: "2025-01-01T10:00:00.000Z",
      end: "2025-01-01T11:00:00.000Z",
      kursId: kurs.id,
      trainerId: trainer.id,
    });

    const finanz = await storage.finanzen.create({
      code: "FIN-TEST",
      kundeId: kunde.id,
      kursId: kurs.id,
      trainerId: trainer.id,
      typ: "bezahlt",
      betrag: 120,
      datum: "2025-01-01",
      beschreibung: "Testzahlung",
    });

    const ware = await storage.waren.create({
      code: "WRN-TEST",
      kundenId: kunde.id,
      produktName: "Leine",
      menge: 1,
      preis: 25,
      datum: "2025-01-01",
      beschreibung: "Testverkauf",
    });

    await storage.kunden.update({ id: kunde.id, data: { status: "aktiv" } });

    const list = await storage.kunden.list();
    console.log(`Smoke OK: kunden=${list.length}`);

    await storage.waren.delete(ware.id);
    await storage.finanzen.delete(finanz.id);
    await storage.kalender.delete(kalender.id);
    await storage.kurse.delete(kurs.id);
    await storage.hunde.delete(hund.id);
    await storage.trainer.delete(trainer.id);
    await storage.kunden.delete(kunde.id);
  } finally {
    if (storage.pool) {
      await storage.pool.end();
    }
  }
}

run().catch((error) => {
  console.error("Smoke failed:", error);
  process.exit(1);
});
