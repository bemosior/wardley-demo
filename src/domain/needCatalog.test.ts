import { describe, expect, it } from "vitest";
import { NEED_CATALOG } from "./needCatalog";

describe("NEED_CATALOG", () => {
  it("is non-empty", () => {
    expect(NEED_CATALOG.length).toBeGreaterThan(0);
  });

  it("has a unique id per option", () => {
    const ids = NEED_CATALOG.map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a non-empty label per option", () => {
    for (const option of NEED_CATALOG) {
      expect(option.label.trim().length).toBeGreaterThan(0);
    }
  });
});
