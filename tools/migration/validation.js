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
  const issues = [];
  const required = moduleRequired[moduleName] || [];
  for (const field of [...REQUIRED_BASE, ...required]) {
    if (record[field] === undefined || record[field] === null) {
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
