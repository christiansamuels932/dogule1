import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachKursAndTrainer, sortEventsChronologically } from "./eventContext.js";

vi.mock("../../shared/api/index.js", () => {
  const getKurs = vi.fn();
  const getTrainer = vi.fn();
  return { getKurs, getTrainer };
});

import { getKurs, getTrainer } from "../../shared/api/index.js";

describe("eventContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches trainer resolved from kurs regardless of event trainerId", async () => {
    getKurs.mockResolvedValueOnce({
      id: "kurs-1",
      trainerId: "t2",
      title: "Dummy Kurs",
    });
    getTrainer.mockResolvedValueOnce({ id: "t2", code: "TR-002", name: "Alex" });

    const { events } = await attachKursAndTrainer([
      { id: "evt-1", kursId: "kurs-1", trainerId: "t-old", start: new Date(), end: new Date() },
    ]);

    expect(getKurs).toHaveBeenCalledWith("kurs-1");
    expect(getTrainer).toHaveBeenCalledWith("t2");
    expect(events[0].trainer).toMatchObject({ id: "t2", code: "TR-002" });
    expect(events[0].kurs).toMatchObject({ id: "kurs-1", trainerId: "t2" });
  });

  it("handles missing trainers gracefully", async () => {
    getKurs.mockResolvedValueOnce({ id: "kurs-2", trainerId: "" });

    const { events } = await attachKursAndTrainer([
      { id: "evt-2", kursId: "kurs-2", start: new Date(), end: new Date() },
    ]);

    expect(getTrainer).not.toHaveBeenCalled();
    expect(events[0].trainer).toBeNull();
  });

  it("sorts events chronologically by start time then id", () => {
    const first = { id: "a", start: new Date("2024-02-01T08:00:00") };
    const second = { id: "b", start: new Date("2024-02-01T10:00:00") };
    const sorted = sortEventsChronologically([second, first]);
    expect(sorted.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
