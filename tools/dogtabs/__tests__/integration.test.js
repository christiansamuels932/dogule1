/* global process */
import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { mapKunde, mapHund, mapKurs, mapFinanz, mapTrainer } from "../mapper.js";
import { resolveRegistryEntry } from "../registry.js";
import { validateRecord } from "../validator.js";

function createResolver() {
  const registries = new Map([
    ["kunden", []],
    ["hunde", []],
    ["trainer", []],
    ["kurse", []],
    ["finanzen", []],
  ]);
  const created = new Map();
  return {
    resolveId(moduleName, legacyId) {
      const registry = registries.get(moduleName) || [];
      const resolved = resolveRegistryEntry(registry, moduleName, legacyId);
      if (resolved.created) {
        registry.push(resolved.entry);
        if (!created.has(moduleName)) created.set(moduleName, []);
        created.get(moduleName).push(resolved.entry);
      }
      registries.set(moduleName, registry);
      return resolved.entry;
    },
    kundeLegacySet: new Set(),
  };
}

describe("dogtabs integration mapping", () => {
  it("maps fixtures without blockers", async () => {
    const fixturePath = path.join(
      process.cwd(),
      "tools",
      "dogtabs",
      "fixtures",
      "sample_access.json"
    );
    const raw = JSON.parse(await fs.readFile(fixturePath, "utf8"));
    const ctx = createResolver();
    raw.kunden.forEach((row) => ctx.kundeLegacySet.add(String(row.kundennummer || "")));

    const kunden = raw.kunden.map((row) => mapKunde(row, ctx).record);
    const hunde = raw.hunde.map((row) => mapHund(row, ctx).record);

    const trainerRecords = new Map();
    const trainerCtx = { ...ctx };
    const resolveTrainerId = (name) => {
      const legacyId = (name || "").trim() || "DogTabs Unbekannt";
      if (!trainerRecords.has(legacyId)) {
        const { record } = mapTrainer(legacyId, trainerCtx);
        trainerRecords.set(legacyId, record);
      }
      return trainerRecords.get(legacyId).id;
    };
    const kurse = raw.kurse.map((row) => mapKurs(row, { ...trainerCtx, resolveTrainerId }).record);
    const finanzen = raw.finanzen.map((row) => mapFinanz(row, ctx).record);

    const issues = [
      ...kunden.flatMap((record) => validateRecord("kunden", record)),
      ...hunde.flatMap((record) => validateRecord("hunde", record)),
      ...Array.from(trainerRecords.values()).flatMap((record) =>
        validateRecord("trainer", record)
      ),
      ...kurse.flatMap((record) => validateRecord("kurse", record)),
      ...finanzen.flatMap((record) => validateRecord("finanzen", record)),
    ];
    const blockers = issues.filter((issue) => issue.severity === "BLOCKER");
    expect(blockers).toHaveLength(0);
    expect(kunden).toHaveLength(1);
    expect(hunde).toHaveLength(1);
    expect(kurse).toHaveLength(1);
    expect(finanzen).toHaveLength(1);
  });
});
