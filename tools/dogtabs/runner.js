import fs from "node:fs/promises";
import path from "node:path";
import { resolveDogtabsConfig } from "./config.js";
import { loadAccessTable } from "./accessDb.js";
import { readXlsxSheetStats } from "./xlsx.js";
import { loadRegistry, resolveRegistryEntry, persistRegistry } from "./registry.js";
import { mapKunde, mapHund, mapTrainer, mapKurs, mapFinanz, mapPension } from "./mapper.js";
import { validateRecord } from "./validator.js";
import { writeDogtabsReport } from "./reporter.js";
import { writeDogtabsModules } from "./mariadbWriter.js";

const TABLES = {
  kunden: "$_kundenstamm",
  hunde: "$_kunden_hunde",
  kurse: "$_seminardaten",
  finanzen: "$_rechnung_kopf",
  pension: "$_kunden_zimmer",
};

const XLSX_SNAPSHOTS = {
  kunden: "Save_Daten_Kunden_",
  hunde: "Save_Daten_Hunde_",
  kurse: "Save_Daten_Seminare_",
  finanzen: "Save_Daten_Rechnungen_",
  pension: "Save_Daten_Pension_",
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveAccessDbPath(config) {
  if (await fileExists(config.accessDbPath)) return config.accessDbPath;
  if (await fileExists(config.fallbackDbPath)) return config.fallbackDbPath;
  throw new Error("Access database file not found");
}

function parseSnapshotDate(name, prefix) {
  const suffix = name.slice(prefix.length);
  const match = suffix.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})/);
  if (!match) return null;
  const date = match[1];
  const time = match[2].replace("-", ":");
  return new Date(`${date}T${time}:00Z`);
}

async function findLatestSnapshots(xlsxDir) {
  const files = await fs.readdir(xlsxDir);
  const result = {};
  for (const [moduleName, prefix] of Object.entries(XLSX_SNAPSHOTS)) {
    const matches = files.filter((name) => name.startsWith(prefix) && name.endsWith(".xlsx"));
    let latest = null;
    let latestDate = null;
    for (const name of matches) {
      const parsed = parseSnapshotDate(name, prefix);
      if (!parsed || Number.isNaN(parsed.getTime())) continue;
      if (!latestDate || parsed > latestDate) {
        latestDate = parsed;
        latest = name;
      }
    }
    if (latest) {
      result[moduleName] = path.join(xlsxDir, latest);
    }
  }
  return result;
}

function createRegistryResolver(registries, createdEntries) {
  return {
    resolveId(moduleName, legacyId) {
      if (!legacyId) return null;
      const registry = registries.get(moduleName) || [];
      const resolved = resolveRegistryEntry(registry, moduleName, legacyId);
      if (resolved.created) {
        registry.push(resolved.entry);
        if (!createdEntries.has(moduleName)) {
          createdEntries.set(moduleName, []);
        }
        createdEntries.get(moduleName).push(resolved.entry);
      }
      registries.set(moduleName, registry);
      return resolved.entry;
    },
  };
}

function createHundLegacyResolver(hundeRows) {
  const counts = new Map();
  for (const row of hundeRows) {
    const legacyId = String(row.hund_nummer || "").trim();
    if (!legacyId) continue;
    counts.set(legacyId, (counts.get(legacyId) || 0) + 1);
  }
  const duplicates = new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([legacyId]) => legacyId)
  );
  const seen = new Map();
  return function resolveHundLegacyId(legacyId) {
    if (!legacyId || !duplicates.has(legacyId)) return legacyId;
    const next = (seen.get(legacyId) || 0) + 1;
    seen.set(legacyId, next);
    return `${legacyId}__dup${next}`;
  };
}

function makeTrainerResolver(ctx, trainerRecords, trainerIssues) {
  const fallbackName = "DogTabs Unbekannt";
  return function resolveTrainerId(rawName) {
    const name = (rawName || "").trim();
    const legacyId = name || fallbackName;
    if (!trainerRecords.has(legacyId)) {
      const { record, issues } = mapTrainer(legacyId, ctx);
      if (record) trainerRecords.set(legacyId, record);
      trainerIssues.push(...issues);
    }
    return trainerRecords.get(legacyId)?.id || "";
  };
}

function createReportBase(mode, config) {
  return {
    generatedAt: "00000000T000000Z",
    mode,
    sourceRoot: config.sourceRoot,
    accessDbPath: config.accessDbPath,
    xlsxDir: config.xlsxDir,
  };
}

function collectIssues(target, moduleName, issues) {
  if (!issues.length) return;
  if (!target[moduleName]) {
    target[moduleName] = [];
  }
  target[moduleName].push(...issues);
}

function countBlockers(issueLog) {
  return Object.values(issueLog)
    .flat()
    .filter((issue) => issue.severity === "BLOCKER").length;
}

export async function runDryRun(options = {}) {
  const config = resolveDogtabsConfig(options);
  const accessDbPath = await resolveAccessDbPath(config);
  const registries = new Map();
  const createdEntries = new Map();
  const registryModules = ["kunden", "hunde", "trainer", "kurse", "finanzen", "pension"];
  for (const moduleName of registryModules) {
    registries.set(moduleName, await loadRegistry(config.registryDir, moduleName));
  }

  const registryResolver = createRegistryResolver(registries, createdEntries);
  const accessTables = new Map();
  for (const [moduleName, tableName] of Object.entries(TABLES)) {
    accessTables.set(moduleName, loadAccessTable(accessDbPath, tableName));
  }

  const kundenRows = accessTables.get("kunden").records;
  const kundeLegacySet = new Set(
    kundenRows
      .map((row) => String(row.kundennummer || ""))
      .filter((value) => value.length > 0)
  );

  const reportModules = [];
  const issueLog = {};

  const kunden = [];
  for (const row of kundenRows) {
    const { record, issues } = mapKunde(row, registryResolver);
    const validation = validateRecord("kunden", record);
    collectIssues(issueLog, "kunden", [...issues, ...validation]);
    kunden.push(record);
  }
  reportModules.push({
    module: "kunden",
    sourceTable: TABLES.kunden,
    sourceCount: kundenRows.length,
    mappedCount: kunden.length,
  });

  const hundeRows = accessTables.get("hunde").records;
  const resolveHundLegacyId = createHundLegacyResolver(hundeRows);
  const hunde = [];
  const ctx = {
    ...registryResolver,
    kundeLegacySet,
    resolveTrainerId: () => "",
    resolveHundLegacyId,
  };
  for (const row of hundeRows) {
    const { record, issues } = mapHund(row, ctx);
    const validation = validateRecord("hunde", record);
    collectIssues(issueLog, "hunde", [...issues, ...validation]);
    hunde.push(record);
  }
  reportModules.push({
    module: "hunde",
    sourceTable: TABLES.hunde,
    sourceCount: hundeRows.length,
    mappedCount: hunde.length,
  });

  const trainerRecords = new Map();
  const trainerIssues = [];
  const trainerCtx = {
    ...registryResolver,
    kundeLegacySet,
  };
  const resolveTrainerId = makeTrainerResolver(trainerCtx, trainerRecords, trainerIssues);
  const kursRows = accessTables.get("kurse").records;
  const kurse = [];
  for (const row of kursRows) {
    const { record, issues } = mapKurs(row, { ...trainerCtx, resolveTrainerId });
    const validation = validateRecord("kurse", record);
    collectIssues(issueLog, "kurse", [...issues, ...validation]);
    kurse.push(record);
  }
  const trainer = Array.from(trainerRecords.values());
  for (const record of trainer) {
    const validation = validateRecord("trainer", record);
    collectIssues(issueLog, "trainer", validation);
  }
  collectIssues(issueLog, "trainer", trainerIssues);
  reportModules.push({
    module: "trainer",
    sourceTable: TABLES.kurse,
    sourceCount: trainer.length,
    mappedCount: trainer.length,
  });
  reportModules.push({
    module: "kurse",
    sourceTable: TABLES.kurse,
    sourceCount: kursRows.length,
    mappedCount: kurse.length,
  });

  const finanzenRows = accessTables.get("finanzen").records;
  const finanzen = [];
  for (const row of finanzenRows) {
    const { record, issues } = mapFinanz(row, ctx);
    const validation = validateRecord("finanzen", record);
    collectIssues(issueLog, "finanzen", [...issues, ...validation]);
    finanzen.push(record);
  }
  reportModules.push({
    module: "finanzen",
    sourceTable: TABLES.finanzen,
    sourceCount: finanzenRows.length,
    mappedCount: finanzen.length,
  });

  const pensionRows = accessTables.get("pension").records;
  reportModules.push({
    module: "pension",
    sourceTable: TABLES.pension,
    sourceCount: pensionRows.length,
    mappedCount: pensionRows.length,
  });

  const latestSnapshots = await findLatestSnapshots(config.xlsxDir);
  const xlsxStats = {};
  for (const [moduleName, filePath] of Object.entries(latestSnapshots)) {
    try {
      const stats = await readXlsxSheetStats(filePath);
      const headerCount = accessTables.get(moduleName)?.headers?.length || 0;
      xlsxStats[moduleName] = {
        file: path.basename(filePath),
        rows: stats.rowCount,
        maxRow: stats.maxRow,
        maxCol: stats.maxCol,
        expectedColumns: headerCount,
        columnsMatch: headerCount ? stats.maxCol === headerCount : null,
      };
      if (headerCount && stats.maxCol !== headerCount) {
        collectIssues(issueLog, moduleName, [
          {
            severity: "WARNING",
            code: "XLSX_COLUMN_MISMATCH",
            message: "XLSX column count does not match Access headers",
          },
        ]);
      }
    } catch (err) {
      xlsxStats[moduleName] = {
        file: path.basename(filePath),
        error: err.message || String(err),
      };
    }
  }

  const report = {
    ...createReportBase("dry-run", { ...config, accessDbPath }),
    modules: reportModules,
    issues: issueLog,
    registryAdds: Object.fromEntries(
      Array.from(createdEntries.entries()).map(([key, values]) => [key, values.length])
    ),
    xlsxSnapshots: xlsxStats,
  };

  const reportPath = await writeDogtabsReport(config.reportDir, report);
  return { reportPath, report };
}

export async function runIngest(options = {}) {
  const config = resolveDogtabsConfig(options);
  const accessDbPath = await resolveAccessDbPath(config);
  const registries = new Map();
  const createdEntries = new Map();
  const registryModules = ["kunden", "hunde", "trainer", "kurse", "finanzen", "pension"];
  for (const moduleName of registryModules) {
    registries.set(moduleName, await loadRegistry(config.registryDir, moduleName));
  }
  const registryResolver = createRegistryResolver(registries, createdEntries);
  const accessTables = new Map();
  for (const [moduleName, tableName] of Object.entries(TABLES)) {
    accessTables.set(moduleName, loadAccessTable(accessDbPath, tableName));
  }

  const kundenRows = accessTables.get("kunden").records;
  const kundeLegacySet = new Set(
    kundenRows
      .map((row) => String(row.kundennummer || ""))
      .filter((value) => value.length > 0)
  );

  const issueLog = {};
  const kunden = [];
  for (const row of kundenRows) {
    const { record, issues } = mapKunde(row, registryResolver);
    const validation = validateRecord("kunden", record);
    collectIssues(issueLog, "kunden", [...issues, ...validation]);
    kunden.push(record);
  }

  const hundeRows = accessTables.get("hunde").records;
  const resolveHundLegacyId = createHundLegacyResolver(hundeRows);
  const ctx = {
    ...registryResolver,
    kundeLegacySet,
    resolveTrainerId: () => "",
    resolveHundLegacyId,
  };
  const hunde = [];
  for (const row of hundeRows) {
    const { record, issues } = mapHund(row, ctx);
    const validation = validateRecord("hunde", record);
    collectIssues(issueLog, "hunde", [...issues, ...validation]);
    hunde.push(record);
  }

  const trainerRecords = new Map();
  const trainerIssues = [];
  const trainerCtx = {
    ...registryResolver,
    kundeLegacySet,
  };
  const resolveTrainerId = makeTrainerResolver(trainerCtx, trainerRecords, trainerIssues);

  const kursRows = accessTables.get("kurse").records;
  const kurse = [];
  for (const row of kursRows) {
    const { record, issues } = mapKurs(row, { ...trainerCtx, resolveTrainerId });
    const validation = validateRecord("kurse", record);
    collectIssues(issueLog, "kurse", [...issues, ...validation]);
    kurse.push(record);
  }
  const trainer = Array.from(trainerRecords.values());
  for (const record of trainer) {
    const validation = validateRecord("trainer", record);
    collectIssues(issueLog, "trainer", validation);
  }
  collectIssues(issueLog, "trainer", trainerIssues);

  const finanzenRows = accessTables.get("finanzen").records;
  const finanzen = [];
  for (const row of finanzenRows) {
    const { record, issues } = mapFinanz(row, ctx);
    const validation = validateRecord("finanzen", record);
    collectIssues(issueLog, "finanzen", [...issues, ...validation]);
    finanzen.push(record);
  }

  const pensionRows = accessTables.get("pension").records;
  const pension = pensionRows.map((row) => {
    const mapped = mapPension(row, ctx);
    const mapping = registryResolver.resolveId("pension", mapped.legacyId);
    return {
      id: mapping?.targetUuid || "",
      legacyId: mapped.legacyId,
      kundeId: mapped.kundeId,
      kundeLegacyId: mapped.kundeLegacyId,
      raw: mapped.raw,
      createdAt: "",
      updatedAt: "",
    };
  });

  const blockerCount = countBlockers(issueLog);
  if (blockerCount > 0) {
    const report = {
      ...createReportBase("ingest", { ...config, accessDbPath }),
      modules: [
        { module: "kunden", sourceCount: kunden.length },
        { module: "hunde", sourceCount: hunde.length },
        { module: "trainer", sourceCount: trainer.length },
        { module: "kurse", sourceCount: kurse.length },
        { module: "finanzen", sourceCount: finanzen.length },
        { module: "pension", sourceCount: pension.length },
      ],
      issues: issueLog,
      registryAdds: Object.fromEntries(
        Array.from(createdEntries.entries()).map(([key, values]) => [key, values.length])
      ),
      blocked: true,
      blockerCount,
    };
    const reportPath = await writeDogtabsReport(config.ingestReportDir, report);
    return { reportPath, report };
  }

  const modules = { kunden, hunde, trainer, kurse, finanzen, pension };
  const writeResults = await writeDogtabsModules(modules, options.mariadb || {});

  for (const [moduleName, entries] of registries.entries()) {
    await persistRegistry(config.registryDir, moduleName, entries);
  }

  const report = {
    ...createReportBase("ingest", { ...config, accessDbPath }),
    modules: writeResults,
    issues: issueLog,
    registryAdds: Object.fromEntries(
      Array.from(createdEntries.entries()).map(([key, values]) => [key, values.length])
    ),
  };
  const reportPath = await writeDogtabsReport(config.ingestReportDir, report);
  return { reportPath, report };
}
