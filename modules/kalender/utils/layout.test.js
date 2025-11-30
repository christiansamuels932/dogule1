import { describe, expect, it } from "vitest";
import { computeEventLayout } from "./layout.js";

const midnight = (year, month, day) => new Date(year, month - 1, day);
const iso = (str) => new Date(str);

describe("computeEventLayout", () => {
  const gridStart = midnight(2025, 6, 1);
  const gridEnd = midnight(2025, 6, 2);

  it("handles non-overlapping events in one column", () => {
    const events = [
      { id: "a", start: "2025-06-01T08:00", end: "2025-06-01T09:00" },
      { id: "b", start: "2025-06-01T10:00", end: "2025-06-01T11:00" },
    ];
    const positioned = computeEventLayout(events, gridStart, gridEnd);
    expect(positioned).toHaveLength(2);
    positioned.forEach((evt) => expect(evt.columnCount).toBe(1));
  });

  it("handles two overlapping events with two columns", () => {
    const events = [
      { id: "a", start: "2025-06-01T08:00", end: "2025-06-01T10:00" },
      { id: "b", start: "2025-06-01T09:00", end: "2025-06-01T11:00" },
    ];
    const positioned = computeEventLayout(events, gridStart, gridEnd);
    expect(positioned.map((e) => e.columnCount)).toEqual([2, 2]);
    expect(new Set(positioned.map((e) => e.column)).size).toBe(2);
  });

  it("handles triple overlap with three columns", () => {
    const events = [
      { id: "a", start: "2025-06-01T08:00", end: "2025-06-01T10:00" },
      { id: "b", start: "2025-06-01T08:30", end: "2025-06-01T09:30" },
      { id: "c", start: "2025-06-01T09:00", end: "2025-06-01T11:00" },
    ];
    const positioned = computeEventLayout(events, gridStart, gridEnd);
    expect(positioned.map((e) => e.columnCount)).toEqual([3, 3, 3]);
    expect(new Set(positioned.map((e) => e.column)).size).toBe(3);
  });

  it("sorts by start, then end, then id", () => {
    const events = [
      { id: "b", start: "2025-06-01T08:00", end: "2025-06-01T09:00" },
      { id: "a", start: "2025-06-01T08:00", end: "2025-06-01T09:00" },
      { id: "c", start: "2025-06-01T08:00", end: "2025-06-01T08:30" },
    ];
    const positioned = computeEventLayout(events, gridStart, gridEnd);
    expect(positioned.map((e) => e.id)).toEqual(["c", "a", "b"]);
  });

  it("clamps to gridStart and gridEnd", () => {
    const events = [
      { id: "a", start: "2025-05-31T23:00", end: "2025-06-01T01:00" },
      { id: "b", start: "2025-06-01T23:30", end: "2025-06-02T02:00" },
    ];
    const positioned = computeEventLayout(events, gridStart, gridEnd);
    const slot = 30 * 60 * 1000;
    expect(positioned[0].rowStart).toBe(0);
    expect(positioned[0].rowEnd).toBe(Math.ceil((iso("2025-06-01T01:00") - gridStart) / slot));
    expect(positioned[1].rowEnd).toBe(Math.ceil((gridEnd - gridStart) / slot));
  });

  it("forces minimum height when start and end align to same slot", () => {
    const events = [{ id: "a", start: "2025-06-01T08:00", end: "2025-06-01T08:00" }];
    const positioned = computeEventLayout(events, gridStart, gridEnd);
    expect(positioned[0].rowEnd - positioned[0].rowStart).toBe(1);
  });

  it("is deterministic for identical start times", () => {
    const events = [
      { id: "a", start: "2025-06-01T08:00", end: "2025-06-01T09:00" },
      { id: "b", start: "2025-06-01T08:00", end: "2025-06-01T09:30" },
      { id: "c", start: "2025-06-01T08:00", end: "2025-06-01T08:45" },
    ];
    const run1 = computeEventLayout(events, gridStart, gridEnd).map((e) => e.id);
    const run2 = computeEventLayout(events, gridStart, gridEnd).map((e) => e.id);
    expect(run1).toEqual(["c", "a", "b"]);
    expect(run2).toEqual(run1);
  });

  it("respects pre-split multi-day fragments", () => {
    const events = [{ id: "multi-1", start: "2025-06-01T22:00", end: "2025-06-02T02:00" }];
    const positioned = computeEventLayout(events, gridStart, gridEnd);
    expect(positioned[0].rowStart).toBe((22 * 60) / 30);
    expect(positioned[0].rowEnd).toBe((24 * 60) / 30);
  });
});
