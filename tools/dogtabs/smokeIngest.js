#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
import { writeDogtabsModules } from "./mariadbWriter.js";

function nowIso() {
  return new Date().toISOString();
}

async function main() {
  const stamp = nowIso();
  const kundenId = "11111111-1111-7111-8111-111111111111";
  const hundId = "22222222-2222-7222-8222-222222222222";
  const trainerId = "33333333-3333-7333-8333-333333333333";
  const kursId = "44444444-4444-7444-8444-444444444444";
  const finanzId = "55555555-5555-7555-8555-555555555555";
  const pensionId = "66666666-6666-7666-8666-666666666666";

  const modules = {
    kunden: [
      {
        id: kundenId,
        code: "DT-SMOKE-K1",
        vorname: "Test",
        nachname: "Kunde",
        email: "test@example.com",
        telefon: "+41000000000",
        adresse: "Teststrasse 1",
        status: "aktiv",
        ausweisId: "",
        fotoUrl: "",
        begleitpersonen: [],
        notizen: "",
        createdAt: stamp,
        updatedAt: stamp,
        schemaVersion: 1,
        version: 0,
      },
    ],
    hunde: [
      {
        id: hundId,
        code: "DT-SMOKE-H1",
        name: "Bello",
        rufname: "",
        rasse: "Sonstige",
        geschlecht: "m",
        geburtsdatum: "2020-01-01",
        gewichtKg: null,
        groesseCm: null,
        kundenId: kundenId,
        trainingsziele: "",
        notizen: "",
        felltyp: "",
        kastriert: null,
        fellfarbe: "",
        groesseTyp: "",
        herkunft: "",
        chipNummer: "",
        createdAt: stamp,
        updatedAt: stamp,
        schemaVersion: 1,
        version: 0,
      },
    ],
    trainer: [
      {
        id: trainerId,
        code: "DT-SMOKE-T1",
        name: "Trainer",
        email: "",
        telefon: "",
        notizen: "",
        verfuegbarkeiten: [],
        ausbildungshistorie: "",
        stundenerfassung: "",
        lohnabrechnung: "",
        createdAt: stamp,
        updatedAt: stamp,
        schemaVersion: 1,
        version: 0,
      },
    ],
    kurse: [
      {
        id: kursId,
        code: "DT-SMOKE-KURS1",
        title: "Basis",
        trainerName: "Trainer",
        trainerId,
        date: "2025-01-01",
        startTime: "10:00:00",
        endTime: "11:00:00",
        location: "Test",
        status: "aktiv",
        capacity: 10,
        bookedCount: 0,
        level: "",
        price: 0,
        notes: "",
        hundIds: [],
        kundenIds: [],
        outlookEventId: "",
        outlookDate: "",
        outlookStart: "",
        outlookEnd: "",
        outlookLocation: "",
        inventoryFlag: false,
        portfolioFlag: false,
        createdAt: stamp,
        updatedAt: stamp,
        schemaVersion: 1,
        version: 0,
      },
    ],
    finanzen: [
      {
        id: finanzId,
        code: "DT-SMOKE-F1",
        kundeId: kundenId,
        kursId: null,
        trainerId: null,
        typ: "Kurs",
        betrag: 100,
        datum: "2025-01-02",
        beschreibung: "",
        createdAt: stamp,
        updatedAt: stamp,
        schemaVersion: 1,
        version: 0,
      },
    ],
    pension: [
      {
        id: pensionId,
        legacyId: "P-1",
        kundeId: kundenId,
        kundeLegacyId: "K-1",
        raw: { sample: true },
        createdAt: stamp,
        updatedAt: stamp,
      },
    ],
  };

  try {
    const results = await writeDogtabsModules(modules);
    console.log("DogTabs smoke ingest completed:");
    for (const result of results) {
      console.log(`- ${result.module}: inserted ${result.inserted}`);
    }
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
