import { describe, it, expect } from "vitest";
import { mapKunde, mapHund } from "../mapper.js";
import { resolveRegistryEntry } from "../registry.js";

function createResolver() {
  const registries = new Map([
    ["kunden", []],
    ["hunde", []],
  ]);
  return {
    resolveId(moduleName, legacyId) {
      const registry = registries.get(moduleName) || [];
      const resolved = resolveRegistryEntry(registry, moduleName, legacyId);
      if (resolved.created) registry.push(resolved.entry);
      registries.set(moduleName, registry);
      return resolved.entry;
    },
    kundeLegacySet: new Set(),
  };
}

describe("dogtabs mapper", () => {
  it("maps kunden records and warns on invalid email", () => {
    const ctx = createResolver();
    const { record, issues } = mapKunde(
      {
        kundennummer: "100",
        name: "Muster",
        vorname: "Max",
        email: "bad-email",
        telefon_natel: "0041 79 123 45 67",
      },
      ctx
    );
    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(record.nachname).toBe("Muster");
    expect(record.email).toBe("");
    expect(issues.some((issue) => issue.code === "EMAIL_INVALID")).toBe(true);
  });

  it("maps hunde and blocks missing kunde ids", () => {
    const ctx = createResolver();
    ctx.kundeLegacySet.add("200");
    const { record, issues } = mapHund(
      {
        hund_nummer: "300",
        hund_kundennummer: "999",
        hund_name: "Bello",
      },
      ctx
    );
    expect(record.name).toBe("Bello");
    expect(issues.some((issue) => issue.code === "KUNDE_NOT_FOUND")).toBe(true);
  });
});
