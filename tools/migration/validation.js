const REQUIRED_BASE = ["id", "code"];

const moduleRequired = {
  kunden: ["vorname", "nachname", "email"],
  hunde: ["name", "kundenId"],
  kurse: ["title", "trainerId", "date", "startTime", "endTime", "status"],
  trainer: ["name"],
  kalender: ["title", "start", "end"],
  finanzen: ["kundeId", "typ", "betrag", "datum"],
  waren: ["produktName", "kundenId", "preis", "datum"],
  kommunikation: ["id", "code", "channel", "title", "status"],
};

export function validateSchema(moduleName, record) {
  const normalized =
    moduleName === "finanzen" && record.kundeId === undefined && record.kundenId !== undefined
      ? { ...record, kundeId: record.kundenId }
      : record;
  const issues = [];
  const required = moduleRequired[moduleName] || [];
  for (const field of [...REQUIRED_BASE, ...required]) {
    if (normalized[field] === undefined || normalized[field] === null) {
      issues.push({
        severity: "BLOCKER",
        message: `Missing required field ${field}`,
      });
    }
  }
  return issues;
}

export function stubFkAndInvariantChecks() {
  return [];
}
