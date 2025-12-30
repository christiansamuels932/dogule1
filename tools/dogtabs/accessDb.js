import { spawnSync } from "node:child_process";
import { parseCsvWithHeaders } from "./csv.js";

function runMdbExport(dbPath, tableName) {
  const result = spawnSync(
    "mdb-export",
    ["-D", "%Y-%m-%d %H:%M:%S", dbPath, tableName],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 50 }
  );
  if (result.error) {
    throw new Error(`mdb-export failed: ${result.error.message || result.error}`);
  }
  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    throw new Error(`mdb-export failed (status ${result.status})${stderr ? `: ${stderr}` : ""}`);
  }
  return result.stdout || "";
}

export function loadAccessTable(dbPath, tableName) {
  const csv = runMdbExport(dbPath, tableName);
  const { headers, records } = parseCsvWithHeaders(csv);
  return { headers, records };
}
