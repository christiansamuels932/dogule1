const REQUIRED_FIELDS = {
  kunden: ["id", "nachname"],
  hunde: ["id", "name", "kundenId"],
  trainer: ["id", "name"],
  kurse: ["id", "title", "trainerId"],
  finanzen: ["id", "kundeId", "typ", "datum"],
};

export function validateRecord(moduleName, record) {
  const issues = [];
  if (!record) return issues;
  const required = REQUIRED_FIELDS[moduleName] || [];
  for (const field of required) {
    const value = record[field];
    if (value === undefined || value === null || value === "") {
      issues.push({
        severity: "BLOCKER",
        code: "FIELD_MISSING",
        field,
        message: `Missing required field ${field}`,
      });
    }
  }
  return issues;
}
