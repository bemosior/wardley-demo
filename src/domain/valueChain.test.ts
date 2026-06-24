import { describe, expect, it } from "vitest";
import {
  createValueChain,
  relabelCapability,
  relabelNeed,
  relabelUser,
  valueChainComponents,
  valueChainDependencies,
} from "./valueChain";

function buildChain() {
  return createValueChain({
    user: { id: "user", label: "User" },
    need: { id: "need", label: "Need" },
    capabilities: [
      { id: "capability-1", label: "Capability" },
      { id: "capability-2", label: "Capability" },
    ],
  });
}

describe("createValueChain", () => {
  it("throws when there are no capabilities", () => {
    expect(() =>
      createValueChain({
        user: { id: "user", label: "User" },
        need: { id: "need", label: "Need" },
        capabilities: [],
      }),
    ).toThrow();
  });

  it("assigns the correct kind to each component", () => {
    const chain = buildChain();
    expect(chain.user.kind).toBe("user");
    expect(chain.need.kind).toBe("need");
    expect(chain.capabilities.every((c) => c.kind === "capability")).toBe(true);
  });
});

describe("relabelUser / relabelNeed / relabelCapability", () => {
  it("relabels only the targeted component, without mutating the original chain", () => {
    const original = buildChain();

    const withUser = relabelUser(original, "Ben");
    expect(withUser.user.label).toBe("Ben");
    expect(withUser.need.label).toBe("Need");
    expect(original.user.label).toBe("User");

    const withNeed = relabelNeed(original, "Hot, drinkable tea");
    expect(withNeed.need.label).toBe("Hot, drinkable tea");
    expect(original.need.label).toBe("Need");

    const withCapability = relabelCapability(original, "capability-2", "A kettle");
    expect(withCapability.capabilities.find((c) => c.id === "capability-2")?.label).toBe("A kettle");
    expect(withCapability.capabilities.find((c) => c.id === "capability-1")?.label).toBe("Capability");
    expect(original.capabilities.find((c) => c.id === "capability-2")?.label).toBe("Capability");
  });

  it("relabelCapability leaves the chain unchanged if the id doesn't match any capability", () => {
    const original = buildChain();
    const result = relabelCapability(original, "nonexistent", "A kettle");
    expect(result.capabilities).toEqual(original.capabilities);
  });
});

describe("valueChainComponents / valueChainDependencies", () => {
  it("lists user, need, then capabilities in order", () => {
    const chain = buildChain();
    expect(valueChainComponents(chain).map((c) => c.id)).toEqual(["user", "need", "capability-1", "capability-2"]);
  });

  it("links user->need and need->each capability", () => {
    const chain = buildChain();
    expect(valueChainDependencies(chain)).toEqual([
      { from: "user", to: "need" },
      { from: "need", to: "capability-1" },
      { from: "need", to: "capability-2" },
    ]);
  });
});
