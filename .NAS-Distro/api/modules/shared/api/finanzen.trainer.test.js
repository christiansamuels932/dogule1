import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "./db/index.js";
import { resolveFinanzenWithRelations, getFinanzenReportForTrainer } from "./finanzen.js";

const clone = (value) => JSON.parse(JSON.stringify(value ?? []));

const restoreTable = (name, rows = []) => {
  db[name] = clone(rows);
};

describe("Finanzen ↔ Trainer helpers", () => {
  let original;

  beforeEach(() => {
    original = {
      kurse: clone(db.kurse),
      trainer: clone(db.trainer),
      zahlungen: clone(db.zahlungen),
      kunden: clone(db.kunden),
    };
  });

  afterEach(() => {
    restoreTable("kurse", original.kurse);
    restoreTable("trainer", original.trainer);
    restoreTable("zahlungen", original.zahlungen);
    restoreTable("kunden", original.kunden);
  });

  it("resolves trainer metadata for kurs-backed Finanz-Eintrag", async () => {
    restoreTable("kunden", [{ id: "k1", code: "K-1" }]);
    restoreTable("trainer", [{ id: "t1", code: "TR-1", name: "Alpha" }]);
    restoreTable("kurse", [
      {
        id: "kurs-1",
        code: "KS-1",
        title: "Testkurs",
        trainerId: "t1",
        date: "2025-01-01",
        startTime: "09:00",
        endTime: "10:00",
        status: "offen",
        hundIds: [],
      },
    ]);
    restoreTable("zahlungen", [
      {
        id: "pay-1",
        code: "PAY-1",
        kundenId: "k1",
        kursId: "kurs-1",
        typ: "bezahlt",
        betrag: 120,
        datum: "2025-01-01",
      },
    ]);

    const resolved = await resolveFinanzenWithRelations(null, { delay: 0 });
    const target = resolved.find(({ finanz }) => finanz.id === "pay-1");
    expect(target?.kurs?.id).toBe("kurs-1");
    expect(target?.trainer?.id).toBe("t1");
  });

  it("aggregates totals for a trainer and ignores non-kurs entries", async () => {
    restoreTable("kunden", [
      { id: "k1", code: "K-1" },
      { id: "k2", code: "K-2" },
    ]);
    restoreTable("trainer", [
      { id: "t1", code: "TR-1", name: "Alpha" },
      { id: "t2", code: "TR-2", name: "Beta" },
    ]);
    restoreTable("kurse", [
      {
        id: "kurs-1",
        code: "KS-1",
        title: "Kurs A",
        trainerId: "t1",
        date: "2025-01-02",
        startTime: "10:00",
        endTime: "11:00",
        status: "offen",
        hundIds: [],
      },
      {
        id: "kurs-2",
        code: "KS-2",
        title: "Kurs B",
        trainerId: "t1",
        date: "2025-01-03",
        startTime: "12:00",
        endTime: "13:00",
        status: "offen",
        hundIds: [],
      },
      {
        id: "kurs-3",
        code: "KS-3",
        title: "Fremder Kurs",
        trainerId: "t2",
        date: "2025-01-04",
        startTime: "14:00",
        endTime: "15:00",
        status: "offen",
        hundIds: [],
      },
    ]);
    restoreTable("zahlungen", [
      {
        id: "pay-1",
        code: "PAY-1",
        kundenId: "k1",
        kursId: "kurs-1",
        typ: "bezahlt",
        betrag: 100,
        datum: "2025-01-02",
      },
      {
        id: "pay-2",
        code: "PAY-2",
        kundenId: "k2",
        kursId: "kurs-2",
        typ: "offen",
        betrag: 40,
        datum: "2025-01-03",
      },
      {
        id: "pay-3",
        code: "PAY-3",
        kundenId: "k1",
        kursId: "kurs-3",
        typ: "bezahlt",
        betrag: 75,
        datum: "2025-01-04",
      },
      {
        id: "pay-4",
        code: "PAY-4",
        kundenId: "k1",
        typ: "bezahlt",
        betrag: 999,
        datum: "2025-01-05",
      },
    ]);

    const report = await getFinanzenReportForTrainer("t1", { delay: 0 });
    expect(report.totals.bezahlt).toBe(100);
    expect(report.totals.offen).toBe(40);
    expect(report.totals.saldo).toBe(60);
    expect(report.entries.map((entry) => entry.id)).toEqual(["pay-2", "pay-1"]);
  });

  it("returns empty report when trainer has no kurs-gebundene Zahlungen", async () => {
    restoreTable("trainer", [{ id: "t99", code: "TR-99", name: "Ohne Umsatz" }]);
    restoreTable("kunden", []);
    restoreTable("kurse", [{ id: "kurs-x", code: "KS-X", title: "Test", trainerId: "t1" }]);
    restoreTable("zahlungen", [
      {
        id: "pay-1",
        code: "PAY-1",
        kundenId: "k1",
        typ: "bezahlt",
        betrag: 10,
        datum: "2025-01-01",
      },
    ]);

    const report = await getFinanzenReportForTrainer("t99", { delay: 0 });
    expect(report.totals).toEqual({ bezahlt: 0, offen: 0, saldo: 0 });
    expect(report.entries).toHaveLength(0);
  });
});
