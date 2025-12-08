import { readModule, listModules } from "./sourceAdapter.js";
import { loadRegistry, findMapping } from "./registry.js";
import { validateSchema, stubFkAndInvariantChecks } from "./validation.js";
import { mapRecord } from "./mapper.js";

export async function runDryRun() {
  const modules = listModules();
  const report = [];
  for (const moduleName of modules) {
    const registry = await loadRegistry(moduleName);
    const records = readModule(moduleName);
    const moduleIssues = [];
    const mapped = [];
    for (const record of records) {
      const schemaIssues = validateSchema(moduleName, record);
      const fkIssues = stubFkAndInvariantChecks(moduleName, record);
      const mapping = findMapping(registry, record.id);
      const { mapped: mappedRecord, issues: mapIssues } = mapRecord(moduleName, record, mapping);
      moduleIssues.push(...schemaIssues, ...fkIssues, ...mapIssues);
      mapped.push(mappedRecord);
    }
    report.push({
      module: moduleName,
      count: records.length,
      issues: moduleIssues,
    });
  }
  return report;
}
