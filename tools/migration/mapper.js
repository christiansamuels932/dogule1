const BASE_DEFAULTS = {
  schemaVersion: 1,
  version: 0,
};

export function mapRecord(moduleName, record, mapping) {
  const issues = [];
  const mapped = { ...record, ...BASE_DEFAULTS };
  if (!mapping) {
    issues.push({
      severity: "BLOCKER",
      message: `No mapping for legacy id ${record.id}`,
    });
  } else {
    mapped.id = mapping.targetUuid;
  }
  return { mapped, issues };
}
