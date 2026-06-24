import { describe, expect, it } from "vitest";
import { relabelComponent, type Component } from "./component";

describe("relabelComponent", () => {
  it("returns a new component with the new label", () => {
    const original: Component = { id: "need", label: "Need", kind: "need" };
    const relabeled = relabelComponent(original, "Hot, drinkable tea");

    expect(relabeled).toEqual({ id: "need", label: "Hot, drinkable tea", kind: "need" });
  });

  it("does not mutate the original component", () => {
    const original: Component = { id: "need", label: "Need", kind: "need" };
    relabelComponent(original, "Hot, drinkable tea");

    expect(original.label).toBe("Need");
  });

  it("preserves id and kind", () => {
    const original: Component = { id: "capability-1", label: "Capability", kind: "capability" };
    const relabeled = relabelComponent(original, "A kettle");

    expect(relabeled.id).toBe("capability-1");
    expect(relabeled.kind).toBe("capability");
  });
});
