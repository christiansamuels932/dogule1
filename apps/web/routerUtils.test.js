import { describe, it, expect } from "vitest";
import { parseHash } from "./routerUtils.js";

describe("router utils", () => {
  it("parses empty hash to dashboard route", () => {
    expect(parseHash("")).toEqual({ route: "dashboard", segments: [] });
    expect(parseHash("#")).toEqual({ route: "dashboard", segments: [] });
  });

  it("parses single segment route", () => {
    expect(parseHash("#/kunden")).toEqual({ route: "kunden", segments: [] });
  });

  it("parses route with id segment", () => {
    expect(parseHash("#/kunden/abc")).toEqual({ route: "kunden", segments: ["abc"] });
  });

  it("parses route with id + action segments", () => {
    expect(parseHash("#/kunden/abc/edit")).toEqual({
      route: "kunden",
      segments: ["abc", "edit"],
    });
  });
});
