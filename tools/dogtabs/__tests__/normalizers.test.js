import { describe, it, expect } from "vitest";
import { normalizeEmail, normalizePhone, normalizeDateTime } from "../normalizers.js";

describe("dogtabs normalizers", () => {
  it("normalizes emails to lowercase and flags invalid", () => {
    const ok = normalizeEmail("Test@Example.com");
    expect(ok.value).toBe("test@example.com");
    expect(ok.valid).toBe(true);

    const bad = normalizeEmail("not-an-email");
    expect(bad.value).toBe("");
    expect(bad.valid).toBe(false);
  });

  it("normalizes phone numbers", () => {
    expect(normalizePhone("00 41 44 123 45 67")).toBe("+41441234567");
    expect(normalizePhone("+41 (44) 123-45-67")).toBe("+41441234567");
  });

  it("parses date/time strings", () => {
    const iso = normalizeDateTime("2025-12-09 07:30:00");
    expect(iso.date).toBe("2025-12-09");
    expect(iso.time).toBe("07:30:00");

    const de = normalizeDateTime("09.12.2025 07:30");
    expect(de.date).toBe("2025-12-09");
    expect(de.time).toBe("07:30:00");
  });
});
