/* eslint-env node */
/* global process */
import fs from "node:fs/promises";
import path from "node:path";
import { canonicalJson } from "./canonicalJson.js";

const REPORT_DIR = path.join(process.cwd(), "storage_reports", "latest-dry-run");
const REPORT_FILE = path.join(REPORT_DIR, "dry-run.json");

export async function writeReport(data) {
  await fs.mkdir(REPORT_DIR, { recursive: true });
  const content = canonicalJson({ generatedAt: "00000000T000000Z", modules: data });
  await fs.writeFile(REPORT_FILE, content, "utf8");
  return REPORT_FILE;
}
