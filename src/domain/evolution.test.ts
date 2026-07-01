import { describe, expect, it } from "vitest";
import { characteristicsFor, EVOLUTION_STAGES } from "./evolution";

describe("characteristicsFor", () => {
  it("returns non-empty text for every stage, for both draggable kinds", () => {
    for (const kind of ["need", "capability"] as const) {
      for (const stage of EVOLUTION_STAGES) {
        expect(characteristicsFor(kind, stage).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('throws for "user", which is never dragged along the evolution axis', () => {
    expect(() => characteristicsFor("user", "Genesis")).toThrow();
  });

  it("gives need and capability different text at the same stage", () => {
    for (const stage of EVOLUTION_STAGES) {
      expect(characteristicsFor("need", stage)).not.toBe(characteristicsFor("capability", stage));
    }
  });
});
