import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";
import { findBestKursMatch, parseEmailDraft } from "./parser.js";

const FIXTURE_ROOT = path.join(process.cwd(), "data", "DogTabs Data", "Anmeldung Modul Lerninhalt");

async function readFixture(name) {
  return fs.readFile(path.join(FIXTURE_ROOT, name), "utf8");
}

describe("anmeldung parser", () => {
  it("parses the clean anmeldung template", async () => {
    const rawText = await readFixture("AnmeldungFormular.txt");
    const parsed = parseEmailDraft(rawText);

    expect(parsed.kursTitle).toBe("Junghundeausbildung");
    expect(parsed.kundePayload).toMatchObject({
      anrede: "Herr",
      vorname: "Luca",
      nachname: "Segler",
      geschlecht: "männlich",
      email: "evlu9223@gmail.com",
      telefon: "076 830 90 01",
      geburtsdatum: "20.09.1991",
      strasse: "Landstrasse 11",
      plz: "5300",
      ort: "Turgi",
      adresse: "Landstrasse 11, 5300 Turgi",
    });
    expect(parsed.hundPayload).toMatchObject({
      name: "Akihito",
      rufname: "Aki",
      rasse: "Akita Inu",
      geschlecht: "Rüde",
      kastriert: false,
      geburtsdatum: "22.07.2025",
      chipNummer: "250269699759138",
    });
    expect(parsed.errors).toEqual({ kurs: null, kunde: null, hund: null });
  });

  it("decodes raw eml payloads and strips the AWS footer", async () => {
    const rawText = await readFixture("Neue Anmeldung für einen Kurs(4).eml");
    const parsed = parseEmailDraft(rawText);

    expect(parsed.kursTitle).toBe("Welpenschule/Welpenprägung");
    expect(parsed.kundePayload).toMatchObject({
      anrede: "Frau",
      vorname: "Daniela",
      nachname: "Schneider",
      plz: "5323",
      ort: "Rietheim",
      heimatort: "Würenlingen",
      adresse: "Feldstrasse 9, 5323 Rietheim",
    });
    expect(parsed.kundePayload.aufmerksamDurch).toContain('"Hundepause"');
    expect(parsed.kundePayload.aufmerksamDurch).not.toContain("&#34;");
    expect(parsed.hundPayload).toMatchObject({
      name: "Sally",
      rufname: "Sally",
      geschlecht: "Hündin",
      chipNummer: "kommt noch",
    });
    expect(parsed.errors).toEqual({ kurs: null, kunde: null, hund: null });
  });

  it("normalizes postal data and single-digit dates from real samples", async () => {
    const angelaRaw = await readFixture("Neue Anmeldung für einen Kurs(1).eml");
    const angela = parseEmailDraft(angelaRaw);
    expect(angela.kundePayload).toMatchObject({
      plz: "5607",
      ort: "Hägglingen",
      adresse: "Schafweid 2, 5607 Hägglingen",
      mobile: "0792809227",
    });

    const spikeRaw = await readFixture("Neue Anmeldung für einen Kurs.eml");
    const spike = parseEmailDraft(spikeRaw);
    expect(spike.hundPayload).toMatchObject({
      name: "Spike",
      rufname: "Spike",
      geburtsdatum: "15.08.2025",
    });
    expect(spike.errors).toEqual({ kurs: null, kunde: null, hund: null });
  });

  it("matches kurs titles despite punctuation and umlaut differences", () => {
    const match = findBestKursMatch(
      [
        { id: "kurs-1", title: "Welpenschule & Prägung" },
        { id: "kurs-2", title: "Junghundeausbildung" },
      ],
      "Welpenschule/Welpenprägung"
    );

    expect(match).toMatchObject({ id: "kurs-1", title: "Welpenschule & Prägung" });
  });
});
