import fs from "node:fs/promises";
import path from "node:path";
import { parseCsvWithHeaders } from "./csv.js";
import { writeDogtabsReport } from "./reporter.js";
import { writeKundenRecords } from "./mariadbWriter.js";
import { uuidv7 } from "../../modules/shared/utils/uuidv7.js";
import {
  normalizeString,
  normalizeEmail,
  normalizePhone,
  normalizeStatus,
} from "./normalizers.js";

const DEFAULT_REPORT_DIR = path.join(
  process.cwd(),
  "storage_reports",
  "latest-dogtabs-customers-csv"
);

function nowIso() {
  return new Date().toISOString();
}

function getField(row, key) {
  if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  const match = Object.keys(row).find((header) => header.toLowerCase() === key.toLowerCase());
  return match ? row[match] : "";
}

function joinAddress(parts) {
  const [street, extra, plz, ort] = parts.map((part) => normalizeString(part));
  const cityLine = [plz, ort].filter(Boolean).join(" ").trim();
  return [street, extra, cityLine].filter(Boolean).join("\n");
}

function mapCustomerRow(row, issues) {
  const legacyId = normalizeString(getField(row, "kundennummer"));
  const nachname = normalizeString(getField(row, "name"));
  const vorname = normalizeString(getField(row, "vorname"));
  const status = normalizeStatus(getField(row, "status"));
  const emailResult = normalizeEmail(getField(row, "email"));
  const telefon = normalizePhone(
    getField(row, "telefon_natel") ||
      getField(row, "telefon_privat") ||
      getField(row, "telefon_geschaeft")
  );
  const adresse = joinAddress([
    getField(row, "adr_strasse"),
    getField(row, "adr_zusatz1"),
    getField(row, "adr_plz"),
    getField(row, "adr_ort"),
  ]);
  const notizen = normalizeString(getField(row, "Notiz"));

  if (!legacyId) {
    issues.push({
      severity: "WARNING",
      code: "LEGACY_ID_MISSING",
      message: "kundennummer missing",
    });
  }
  if (!nachname) {
    issues.push({
      severity: "WARNING",
      code: "NAME_MISSING",
      message: "name missing",
    });
  }
  if (!status && getField(row, "status")) {
    issues.push({
      severity: "WARNING",
      code: "STATUS_UNKNOWN",
      legacyId,
      message: "status not recognized",
    });
  }
  if (emailResult.value === "" && getField(row, "email")) {
    issues.push({
      severity: "WARNING",
      code: "EMAIL_INVALID",
      legacyId,
      message: "email invalid; cleared",
    });
  }

  const timestamp = nowIso();
  return {
    id: uuidv7(),
    legacyId,
    code: legacyId ? `DT-${legacyId}` : "",
    vorname,
    nachname,
    email: emailResult.value,
    telefon,
    adresse,
    status,
    ausweisId: "",
    fotoUrl: "",
    begleitpersonen: [],
    notizen,
    createdAt: timestamp,
    updatedAt: timestamp,
    schemaVersion: 1,
    version: 0,
  };
}

export async function runCustomersCsvImport(options = {}) {
  const sourcePath = options.sourcePath || process.env.DOGTABS_CUSTOMERS_CSV;
  if (!sourcePath) {
    throw new Error("Missing customers CSV path");
  }
  const reportDir = options.reportDir || process.env.DOGTABS_CUSTOMERS_REPORT_DIR || DEFAULT_REPORT_DIR;
  const raw = await fs.readFile(sourcePath, "utf8");
  const { headers, records } = parseCsvWithHeaders(raw);
  if (!headers.length) {
    throw new Error("Customers CSV has no headers");
  }

  const issues = [];
  const kunden = records.map((row) => mapCustomerRow(row, issues));
  const writeResult = await writeKundenRecords(kunden, options.mariadb || {});

  const report = {
    generatedAt: "00000000T000000Z",
    mode: "customers-csv",
    sourcePath,
    headers,
    sourceCount: records.length,
    mappedCount: kunden.length,
    issues: { kunden: issues },
    results: writeResult,
  };
  const reportPath = await writeDogtabsReport(reportDir, report);
  return { reportPath, report };
}

async function main() {
  const sourcePath = process.argv[2];
  const result = await runCustomersCsvImport({ sourcePath });
  console.log(`Customers CSV import report written to ${result.reportPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
