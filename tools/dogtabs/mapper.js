import {
  normalizeString,
  normalizeEmail,
  normalizePhone,
  normalizeStatus,
  normalizeBoolean,
  normalizeDateTime,
  normalizePicklist,
} from "./normalizers.js";

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(String(value).replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

function formatTimestamp(dateTime) {
  if (!dateTime.date) return "";
  if (!dateTime.time) return dateTime.date;
  return `${dateTime.date}T${dateTime.time}`;
}

function joinNotes(lines) {
  return lines.filter((line) => line && line.trim()).join("\n");
}

function dateFromTimestamp(value) {
  if (!value) return "";
  return String(value).split("T")[0] || "";
}

export function mapKunde(row, ctx) {
  const issues = [];
  const legacyId = normalizeString(row.kundennummer);
  const mapping = ctx.resolveId("kunden", legacyId);

  const vorname = normalizeString(row.vorname);
  const nachname = normalizeString(row.name);
  const emailResult = normalizeEmail(row.email);
  const telefon = normalizePhone(row.telefon_natel || row.telefon_privat || row.telefon_geschaeft);
  const status = normalizeStatus(row.status);

  if (emailResult.value === "" && row.email) {
    issues.push({
      severity: "WARNING",
      code: "EMAIL_INVALID",
      legacyId,
      message: "Email invalid; cleared",
    });
  }
  if (!status && row.status) {
    issues.push({
      severity: "WARNING",
      code: "STATUS_UNKNOWN",
      legacyId,
      message: "Status not recognized",
    });
  }

  const adresse = joinNotes([
    normalizeString(row.adr_strasse),
    normalizeString(row.adr_zusatz1),
    normalizeString(row.adr_zusatz2),
    [row.adr_plz, row.adr_ort].filter(Boolean).join(" ").trim(),
    normalizeString(row.adr_land),
  ]);

  const notes = joinNotes([
    normalizeString(row.bemerkung),
    row.kontaktperson ? `Kontakt: ${normalizeString(row.kontaktperson)}` : "",
    row.telefon_geschaeft ? `Telefon (geschaeft): ${normalizePhone(row.telefon_geschaeft)}` : "",
    row.telefon_privat ? `Telefon (privat): ${normalizePhone(row.telefon_privat)}` : "",
  ]);

  const createdAt = formatTimestamp(normalizeDateTime(row.erf_dat));
  const updatedAt = formatTimestamp(normalizeDateTime(row.mut_dat)) || createdAt;

  const record = {
    id: mapping?.targetUuid || "",
    legacyId,
    code: legacyId ? `DT-${legacyId}` : "",
    vorname,
    nachname,
    email: emailResult.value,
    telefon,
    adresse,
    status,
    ausweisId: "",
    fotoUrl: normalizeString(row.person_bild),
    begleitpersonen: [],
    notizen: notes,
    createdAt,
    updatedAt,
    schemaVersion: 1,
    version: 0,
  };

  if (mapping?.created) {
    issues.push({
      severity: "INFO",
      code: "REGISTRY_CREATED",
      legacyId,
      message: "Registry entry created",
    });
  }

  return { record, issues };
}

export function mapHund(row, ctx) {
  const issues = [];
  const legacyId = normalizeString(row.hund_nummer);
  const resolvedLegacyId = ctx.resolveHundLegacyId
    ? ctx.resolveHundLegacyId(legacyId, row)
    : legacyId;
  if (resolvedLegacyId !== legacyId) {
    issues.push({
      severity: "WARNING",
      code: "LEGACY_ID_DUPLICATE",
      legacyId,
      message: "Duplicate dog legacy id; generated unique suffix",
    });
  }
  const kundeLegacyId = normalizeString(row.hund_kundennummer);
  const mapping = ctx.resolveId("hunde", resolvedLegacyId);
  const kundeId = ctx.resolveId("kunden", kundeLegacyId)?.targetUuid || "";

  if (!kundeLegacyId) {
    issues.push({
      severity: "BLOCKER",
      code: "KUNDE_MISSING",
      legacyId,
      message: "Missing customer legacy id",
    });
  } else if (!ctx.kundeLegacySet.has(kundeLegacyId)) {
    issues.push({
      severity: "BLOCKER",
      code: "KUNDE_NOT_FOUND",
      legacyId,
      message: "Customer not found for dog",
    });
  }

  const kastriertJa = normalizeBoolean(row.hund_kastriert_ja);
  const kastriertNein = normalizeBoolean(row.hund_kastriert_nein);
  let kastriert = null;
  if (kastriertJa === true && kastriertNein === true) {
    issues.push({
      severity: "WARNING",
      code: "KASTRIERT_CONFLICT",
      legacyId,
      message: "Conflicting kastriert flags",
    });
  } else if (kastriertJa === true) {
    kastriert = true;
  } else if (kastriertNein === true) {
    kastriert = false;
  }

  const geburtsdatum = normalizeDateTime(row.hund_gebdatum).date;
  const groesseTyp = normalizePicklist(normalizeString(row.hund_groesse_klasse), ["1", "2", "3"]);
  if (!groesseTyp && row.hund_groesse_klasse) {
    issues.push({
      severity: "WARNING",
      code: "GROESSE_UNKNOWN",
      legacyId,
      message: "Unknown groesse class",
    });
  }

  const record = {
    id: mapping?.targetUuid || "",
    legacyId: resolvedLegacyId,
    code: resolvedLegacyId ? `DT-${resolvedLegacyId}` : "",
    name: normalizeString(row.hund_name),
    rufname: normalizeString(row.hund_rufname),
    rasse: normalizeString(row.hund_rasse) || "Sonstige",
    geschlecht: normalizeString(row.hund_geschlecht),
    geburtsdatum,
    gewichtKg: toNumber(row.hund_gewicht),
    groesseCm: null,
    kundenId: kundeId,
    trainingsziele: "",
    notizen: joinNotes([
      normalizeString(row.hund_bemerkung),
      normalizeString(row.hund_merkmale),
      normalizeString(row.hund_history),
      normalizeString(row.hund_hinweis_intern),
    ]),
    felltyp: normalizeString(row.hund_fell),
    kastriert,
    fellfarbe: normalizeString(row.hund_farbe),
    groesseTyp,
    herkunft: normalizeString(row.hund_tiergruppe),
    chipNummer: normalizeString(row.hund_chipnummer),
    createdAt: formatTimestamp(normalizeDateTime(row.erf_dat)),
    updatedAt: formatTimestamp(normalizeDateTime(row.mut_dat)),
    schemaVersion: 1,
    version: 0,
  };

  if (mapping?.created) {
    issues.push({
      severity: "INFO",
      code: "REGISTRY_CREATED",
      legacyId,
      message: "Registry entry created",
    });
  }

  return { record, issues };
}

export function mapTrainer(name, ctx) {
  const issues = [];
  const normalized = normalizeString(name);
  if (!normalized) {
    return { record: null, issues };
  }
  const legacyId = normalized;
  const mapping = ctx.resolveId("trainer", legacyId);
  const rawCode = `DT-${legacyId}`;
  const code = rawCode.slice(0, 64);
  if (rawCode.length > code.length) {
    issues.push({
      severity: "WARNING",
      code: "CODE_TRUNCATED",
      legacyId,
      message: "Trainer code truncated to 64 chars",
    });
  }
  const record = {
    id: mapping?.targetUuid || "",
    legacyId,
    code,
    name: normalized,
    email: "",
    telefon: "",
    notizen: "",
    verfuegbarkeiten: [],
    ausbildungshistorie: "",
    stundenerfassung: "",
    lohnabrechnung: "",
    createdAt: "",
    updatedAt: "",
    schemaVersion: 1,
    version: 0,
  };
  if (mapping?.created) {
    issues.push({
      severity: "INFO",
      code: "REGISTRY_CREATED",
      legacyId,
      message: "Registry entry created",
    });
  }
  return { record, issues };
}

export function mapKurs(row, ctx) {
  const issues = [];
  const legacyId = normalizeString(row.seminardat_nummer || row.seminardat_seminar_id);
  const mapping = ctx.resolveId("kurse", legacyId);

  const start = normalizeDateTime(row.seminardat_datvon);
  const end = normalizeDateTime(row.seminardat_datbis);
  const createdAt = formatTimestamp(normalizeDateTime(row.erf_dat)) || formatTimestamp(start);
  const updatedAt = formatTimestamp(normalizeDateTime(row.mut_dat)) || createdAt;
  let courseDate =
    start.date || dateFromTimestamp(createdAt) || dateFromTimestamp(updatedAt);

  const trainerName =
    normalizeString(row.seminardat_leitung) ||
    normalizeString(row.seminardat_referenten) ||
    [row.seminardat_skn_ausbildner_vorname, row.seminardat_skn_ausbildner_name]
      .map(normalizeString)
      .filter(Boolean)
      .join(" ");
  const trainerId = ctx.resolveTrainerId(trainerName);

  let title = normalizeString(row.seminardat_thema) || normalizeString(row.seminardat_kursinhalt);
  if (!title) {
    title = "DogTabs Kurs";
    issues.push({
      severity: "WARNING",
      code: "TITLE_MISSING",
      legacyId,
      message: "Course title missing; defaulted",
    });
  }

  if (!courseDate) {
    courseDate = "1900-01-01";
    issues.push({
      severity: "WARNING",
      code: "DATE_MISSING",
      legacyId,
      message: "Course date missing; defaulted",
    });
  }

  const record = {
    id: mapping?.targetUuid || "",
    legacyId,
    code: legacyId ? `DT-${legacyId}` : "",
    title,
    trainerName,
    trainerId,
    date: courseDate,
    startTime: start.time,
    endTime: end.time,
    location: normalizeString(row.seminardat_kursort),
    status: normalizeBoolean(row.seminardat_aufgeloest) ? "abgesagt" : "aktiv",
    capacity: toNumber(row.seminardat_maxpers_aktiv) || 0,
    bookedCount: 0,
    level: "",
    price: toNumber(row.seminardat_grundpreis_aktiv) || 0,
    notes: normalizeString(row.seminardat_bemerkung),
    hundIds: [],
    kundenIds: [],
    outlookEventId: "",
    outlookDate: "",
    outlookStart: "",
    outlookEnd: "",
    outlookLocation: "",
    inventoryFlag: false,
    portfolioFlag: false,
    createdAt,
    updatedAt,
    schemaVersion: 1,
    version: 0,
  };

  if (mapping?.created) {
    issues.push({
      severity: "INFO",
      code: "REGISTRY_CREATED",
      legacyId,
      message: "Registry entry created",
    });
  }

  if (!trainerId) {
    issues.push({
      severity: "WARNING",
      code: "TRAINER_MISSING",
      legacyId,
      message: "Trainer missing; using fallback",
    });
  }

  return { record, issues };
}

export function mapFinanz(row, ctx) {
  const issues = [];
  const legacyId = normalizeString(row.rek_rechnr);
  const mapping = ctx.resolveId("finanzen", legacyId);
  const kundeLegacyId = normalizeString(row.rek_kundennummer);
  const kundeId = ctx.resolveId("kunden", kundeLegacyId)?.targetUuid || "";

  if (!kundeLegacyId) {
    issues.push({
      severity: "BLOCKER",
      code: "KUNDE_MISSING",
      legacyId,
      message: "Missing customer legacy id for invoice",
    });
  } else if (!ctx.kundeLegacySet.has(kundeLegacyId)) {
    issues.push({
      severity: "BLOCKER",
      code: "KUNDE_NOT_FOUND",
      legacyId,
      message: "Customer not found for invoice",
    });
  }

  const createdAt = formatTimestamp(normalizeDateTime(row.erf_dat));
  const updatedAt = formatTimestamp(normalizeDateTime(row.mut_dat)) || createdAt;
  let datum = normalizeDateTime(row.rek_datum).date || dateFromTimestamp(createdAt);
  if (!datum) {
    datum = "1900-01-01";
    issues.push({
      severity: "WARNING",
      code: "DATUM_MISSING",
      legacyId,
      message: "Invoice date missing; defaulted",
    });
  }

  const record = {
    id: mapping?.targetUuid || "",
    legacyId,
    code: legacyId ? `DT-${legacyId}` : "",
    kundeId,
    kursId: null,
    trainerId: null,
    typ: normalizeString(row.rek_art || row.rek_typ),
    betrag: toNumber(row.rek_betr_tot_brutto) || 0,
    datum,
    beschreibung: joinNotes([
      normalizeString(row.rek_bemerkung),
      normalizeString(row.rek_status),
      normalizeString(row.rek_zahlungsart),
    ]),
    createdAt,
    updatedAt,
    schemaVersion: 1,
    version: 0,
  };

  if (mapping?.created) {
    issues.push({
      severity: "INFO",
      code: "REGISTRY_CREATED",
      legacyId,
      message: "Registry entry created",
    });
  }

  return { record, issues };
}

export function mapPension(row, ctx) {
  const legacyId = normalizeString(row.zimmer_nummer || row.kundennummer || row.id);
  const kundeLegacyId = normalizeString(row.kundennummer || row.kunde_id);
  const kundeId = ctx.resolveId("kunden", kundeLegacyId)?.targetUuid || "";
  return {
    legacyId,
    kundeId,
    kundeLegacyId,
    raw: row,
  };
}
