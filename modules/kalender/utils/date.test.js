import { describe, expect, it } from "vitest";
import {
  addDays,
  addWeeks,
  getIsoWeek,
  getMondayOfIsoWeek,
  getMonthStart,
  getYearStart,
  isValidLocalDateObject,
  parseIsoWeek,
  parseLocalDate,
} from "./date.js";

describe("kalender date helpers", () => {
  describe("parseLocalDate", () => {
    it("parses a valid date at local midnight", () => {
      const result = parseLocalDate("2024-02-29");
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(29);
      expect(result.getHours()).toBe(0);
    });

    it("rejects invalid format", () => {
      expect(getError(() => parseLocalDate("2024/02/01"))).toMatchObject({
        type: "kalender",
        scope: "date",
        code: "invalid-date-format",
      });
    });

    it("rejects invalid calendar dates", () => {
      expect(getError(() => parseLocalDate("2025-02-30"))).toMatchObject({
        code: "invalid-date-value",
      });
      expect(getError(() => parseLocalDate("2019-02-29"))).toMatchObject({
        code: "invalid-date-value",
      });
    });

    it("rejects out-of-range years", () => {
      expect(getError(() => parseLocalDate("1969-12-31"))).toMatchObject({
        code: "out-of-range-year",
      });
      expect(getError(() => parseLocalDate("2101-01-01"))).toMatchObject({
        code: "out-of-range-year",
      });
    });
  });

  describe("parseIsoWeek and getMondayOfIsoWeek", () => {
    it("parses a valid ISO week and returns its Monday", () => {
      const parsed = parseIsoWeek("2025-W01");
      expect(parsed.isoYear).toBe(2025);
      expect(parsed.isoWeek).toBe(1);
      expect(parsed.monday.getFullYear()).toBe(2024);
      expect(parsed.monday.getMonth()).toBe(11); // Dec
      expect(parsed.monday.getDate()).toBe(30); // 2024-12-30 is ISO week 1 of 2025
    });

    it("accepts ISO week 53 when valid", () => {
      const monday = getMondayOfIsoWeek(2020, 53);
      expect(monday.getFullYear()).toBe(2020);
      expect(monday.getMonth()).toBe(11);
      expect(monday.getDate()).toBe(28);
    });

    it("rejects ISO weeks that do not exist in the year", () => {
      expect(getError(() => parseIsoWeek("2021-W53"))).toMatchObject({
        code: "invalid-iso-week",
      });
    });

    it("rejects malformed ISO week strings", () => {
      expect(getError(() => parseIsoWeek("2025-W1"))).toMatchObject({
        code: "invalid-iso-week-format",
      });
      expect(getError(() => parseIsoWeek("2025-13"))).toMatchObject({
        code: "invalid-iso-week-format",
      });
    });

    it("rejects out-of-range week numbers and years", () => {
      expect(getError(() => parseIsoWeek("2101-W01"))).toMatchObject({
        code: "out-of-range-year",
      });
      expect(getError(() => parseIsoWeek("2025-W00"))).toMatchObject({
        code: "invalid-week-range",
      });
      expect(getError(() => parseIsoWeek("2025-W54"))).toMatchObject({
        code: "invalid-week-range",
      });
    });
  });

  describe("getIsoWeek", () => {
    it("computes ISO week using Thursday anchor", () => {
      const jan4 = new Date(2021, 0, 4); // Monday
      expect(getIsoWeek(jan4)).toEqual({ isoYear: 2021, isoWeek: 1 });

      const dec31 = new Date(2018, 11, 31); // belongs to 2019-W01
      expect(getIsoWeek(dec31)).toEqual({ isoYear: 2019, isoWeek: 1 });

      const jan1 = new Date(2021, 0, 1); // Friday, part of 2020-W53
      expect(getIsoWeek(jan1)).toEqual({ isoYear: 2020, isoWeek: 53 });
    });
  });

  describe("addDays and addWeeks", () => {
    it("adds days preserving local midnight", () => {
      const base = new Date(2025, 0, 15, 15, 30);
      const shifted = addDays(base, 2);
      expect(shifted.getFullYear()).toBe(2025);
      expect(shifted.getMonth()).toBe(0);
      expect(shifted.getDate()).toBe(17);
      expect(shifted.getHours()).toBe(0);
    });

    it("adds weeks using addDays", () => {
      const base = new Date(2025, 0, 1);
      const shifted = addWeeks(base, 3);
      expect(shifted.getDate()).toBe(22);
    });
  });

  describe("month and year starts", () => {
    it("returns start of month", () => {
      const base = new Date(2025, 5, 15, 10, 5);
      const start = getMonthStart(base);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(5);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
    });

    it("returns start of year", () => {
      const base = new Date(2025, 8, 20, 23, 59);
      const start = getYearStart(base);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
    });
  });

  describe("isValidLocalDateObject", () => {
    it("returns true only for valid, in-range local dates", () => {
      expect(isValidLocalDateObject(new Date(2025, 0, 1))).toBe(true);
      expect(isValidLocalDateObject(new Date("not-a-date"))).toBe(false);
      expect(isValidLocalDateObject(new Date(2105, 0, 1))).toBe(false);
    });
  });
});

function getError(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return null;
}
