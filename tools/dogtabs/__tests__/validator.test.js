import { describe, it, expect } from "vitest";
import { validateRecord } from "../validator.js";

describe("dogtabs validator", () => {
  it("flags missing required fields", () => {
    const issues = validateRecord("kunden", { id: "", nachname: "" });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].code).toBe("FIELD_MISSING");
  });
});
