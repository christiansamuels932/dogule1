import path from "node:path";

const DEFAULT_CAPTURE = "capture_20251219_185854Z";

/* global process */
export function resolveDogtabsConfig(options = {}) {
  const cwd = process.cwd();
  const sourceRoot =
    options.sourceRoot ||
    process.env.DOGTABS_SOURCE_ROOT ||
    path.join(cwd, "migration", "legacy", "station61", DEFAULT_CAPTURE, "raw");
  const accessDbPath =
    options.accessDbPath ||
    process.env.DOGTABS_ACCESS_DB ||
    path.join(sourceRoot, "dogtaps_90_Datenbank", "delete dogtaps_Datenbank.accdr.ORG");
  const fallbackDbPath = path.join(
    sourceRoot,
    "dogtaps_90_Datenbank",
    "delete dogtaps_Datenbank.bak"
  );
  const xlsxDir =
    options.xlsxDir ||
    process.env.DOGTABS_XLSX_DIR ||
    path.join(sourceRoot, "dogtaps_80_Datenbank_Save");
  const reportDir =
    options.reportDir ||
    process.env.DOGTABS_REPORT_DIR ||
    path.join(cwd, "storage_reports", "latest-dogtabs-dry-run");
  const ingestReportDir =
    options.ingestReportDir ||
    process.env.DOGTABS_INGEST_REPORT_DIR ||
    path.join(cwd, "storage_reports", "latest-dogtabs-ingest");
  const registryDir =
    options.registryDir ||
    process.env.DOGTABS_REGISTRY_DIR ||
    path.join(cwd, "migration", "dogtabs", "registry");

  return {
    sourceRoot,
    accessDbPath,
    fallbackDbPath,
    xlsxDir,
    reportDir,
    ingestReportDir,
    registryDir,
  };
}
