import { describe, expect, it } from "vitest";
import { parseKalenderRoute, buildKalenderHash } from "./routes.js";

describe("kalender route helpers", () => {
  describe("parseKalenderRoute", () => {
    it("normalizes root to current ISO week", () => {
      const result = parseKalenderRoute(routeInfo("#/kalender"));
      expect(result.mode).toBe("woche");
      expect(result.payload.isoYear).toBeGreaterThanOrEqual(1970);
      expect(result.payload.isoYear).toBeLessThanOrEqual(2100);
      expect(result.payload.isoWeek).toBeGreaterThanOrEqual(1);
      expect(result.payload.isoWeek).toBeLessThanOrEqual(53);
    });

    it("rejects root with trailing slash", () => {
      expect(getError(() => parseKalenderRoute(routeInfo("#/kalender/")))).toMatchObject({
        code: "invalid-route-pattern",
      });
    });

    it("parses day route", () => {
      const result = parseKalenderRoute(routeInfo("#/kalender/tag/2025-06-03"));
      expect(result).toEqual({ mode: "tag", payload: { date: "2025-06-03" } });
    });

    it("rejects invalid day format", () => {
      expect(
        getError(() => parseKalenderRoute(routeInfo("#/kalender/tag/2025-6-03")))
      ).toMatchObject({
        code: "invalid-route-pattern",
      });
    });

    it("parses week route", () => {
      const result = parseKalenderRoute(routeInfo("#/kalender/woche/2025-W04"));
      expect(result).toEqual({ mode: "woche", payload: { isoYear: 2025, isoWeek: 4 } });
    });

    it("rejects week 00 and 54", () => {
      expect(
        getError(() => parseKalenderRoute(routeInfo("#/kalender/woche/2025-W00")))
      ).toMatchObject({
        code: "route-out-of-range",
      });
      expect(
        getError(() => parseKalenderRoute(routeInfo("#/kalender/woche/2025-W54")))
      ).toMatchObject({
        code: "route-out-of-range",
      });
    });

    it("rejects non-existent ISO week 53 for 2021", () => {
      expect(
        getError(() => parseKalenderRoute(routeInfo("#/kalender/woche/2021-W53")))
      ).toMatchObject({
        code: "invalid-route-pattern",
      });
    });

    it("parses month route", () => {
      const result = parseKalenderRoute(routeInfo("#/kalender/monat/2025-07"));
      expect(result).toEqual({ mode: "monat", payload: { year: 2025, month: 7 } });
    });

    it("rejects invalid month", () => {
      expect(
        getError(() => parseKalenderRoute(routeInfo("#/kalender/monat/2025-00")))
      ).toMatchObject({
        code: "route-out-of-range",
      });
    });

    it("parses year route", () => {
      const result = parseKalenderRoute(routeInfo("#/kalender/jahr/2025"));
      expect(result).toEqual({ mode: "jahr", payload: { year: 2025 } });
    });

    it("rejects out-of-range year", () => {
      expect(getError(() => parseKalenderRoute(routeInfo("#/kalender/jahr/2101")))).toMatchObject({
        code: "route-out-of-range",
      });
    });

    it("parses event route with decoding", () => {
      const result = parseKalenderRoute(routeInfo("#/kalender/event/evt%20123"));
      expect(result).toEqual({ mode: "event", payload: { eventId: "evt 123" } });
    });

    it("rejects empty event id", () => {
      expect(getError(() => parseKalenderRoute(routeInfo("#/kalender/event/")))).toMatchObject({
        code: "invalid-event-id",
      });
    });

    it("rejects extra segments", () => {
      expect(
        getError(() => parseKalenderRoute(routeInfo("#/kalender/tag/2025-01-01/extra")))
      ).toMatchObject({
        code: "invalid-route-pattern",
      });
    });

    it("rejects mixed-case module", () => {
      expect(
        getError(() => parseKalenderRoute({ hash: "#/Kalender", segments: ["Kalender"] }))
      ).toMatchObject({
        code: "invalid-route-mode",
      });
    });
  });

  describe("buildKalenderHash", () => {
    it("builds day hash with padding", () => {
      expect(buildKalenderHash({ mode: "tag", date: "2025-06-03" })).toBe(
        "#/kalender/tag/2025-06-03"
      );
    });

    it("builds week hash with padding", () => {
      expect(buildKalenderHash({ mode: "woche", isoYear: 2025, isoWeek: 4 })).toBe(
        "#/kalender/woche/2025-W04"
      );
    });

    it("builds month hash with padding", () => {
      expect(buildKalenderHash({ mode: "monat", year: 2025, month: 3 })).toBe(
        "#/kalender/monat/2025-03"
      );
    });

    it("builds year hash", () => {
      expect(buildKalenderHash({ mode: "jahr", year: 2025 })).toBe("#/kalender/jahr/2025");
    });

    it("builds event hash with encoding", () => {
      expect(buildKalenderHash({ mode: "event", eventId: "evt 123" })).toBe(
        "#/kalender/event/evt%20123"
      );
    });

    it("rejects missing fields", () => {
      expect(getError(() => buildKalenderHash({ mode: "woche", isoYear: 2025 }))).toMatchObject({
        code: "invalid-route-pattern",
      });
      expect(getError(() => buildKalenderHash({ mode: "tag" }))).toMatchObject({
        code: "invalid-route-pattern",
      });
    });

    it("rejects out-of-range values", () => {
      expect(
        getError(() => buildKalenderHash({ mode: "woche", isoYear: 2025, isoWeek: 0 }))
      ).toMatchObject({
        code: "route-out-of-range",
      });
      expect(
        getError(() => buildKalenderHash({ mode: "monat", year: 2025, month: 13 }))
      ).toMatchObject({
        code: "route-out-of-range",
      });
      expect(getError(() => buildKalenderHash({ mode: "jahr", year: 2101 }))).toMatchObject({
        code: "route-out-of-range",
      });
    });
  });
});

function routeInfo(hash) {
  const segments = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { hash, segments };
}

function getError(fn) {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return null;
}
