import fs from "node:fs/promises";
import path from "node:path";
import { canonicalJson } from "../migration/canonicalJson.js";

export async function writeDogtabsReport(reportDir, payload) {
  await fs.mkdir(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, "report.json");
  const content = canonicalJson(payload);
  await fs.writeFile(reportPath, content, "utf8");
  return reportPath;
}
