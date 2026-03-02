import { describe, expect, it } from "vitest";
import { matchesSearchQuery, normalizePhoneDigits } from "./search.js";

describe("search utils", () => {
  it("normalizes phone digits across formatting", () => {
    expect(normalizePhoneDigits("+41 76 830 90 01")).toBe("41768309001");
    expect(normalizePhoneDigits("076-830-90-01")).toBe("0768309001");
  });

  it("matches phone queries against normalized phone fields", () => {
    expect(
      matchesSearchQuery("0768309001", {
        textFields: ["Luca Segler"],
        phoneFields: ["076 830 90 01"],
      })
    ).toBe(true);
    expect(
      matchesSearchQuery("+41768309001", {
        textFields: ["Luca Segler"],
        phoneFields: ["076 830 90 01"],
      })
    ).toBe(true);
  });

  it("falls back to text fields for digit-only matching when asked", () => {
    expect(
      matchesSearchQuery("250269699759138", {
        textFields: ["Chip 250269699759138"],
        fallbackPhoneFields: ["Chip 250269699759138"],
      })
    ).toBe(true);
  });
});
