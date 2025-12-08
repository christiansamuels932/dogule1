import { db } from "../../modules/shared/api/db/index.js";

const MODULES = [
  { name: "kunden", records: () => db.kunden },
  { name: "hunde", records: () => db.hunde },
  { name: "kurse", records: () => db.kurse },
  { name: "trainer", records: () => db.trainer },
  { name: "kalender", records: () => db.kalender },
  { name: "finanzen", records: () => db.zahlungen },
  { name: "waren", records: () => db.waren },
  { name: "kommunikation", records: () => [] },
];

export function readModule(moduleName) {
  const mod = MODULES.find((m) => m.name === moduleName);
  if (!mod) throw new Error(`Unsupported module ${moduleName}`);
  const data = mod.records() || [];
  return Array.isArray(data) ? data : [];
}

export function listModules() {
  return MODULES.map((m) => m.name);
}
