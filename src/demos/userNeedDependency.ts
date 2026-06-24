import { createValueChain } from "../domain/valueChain";
import { layoutValueChain } from "../application/valueChainLayout";
import type { DemoConfig } from "../engine/types";

const valueChain = createValueChain({
  user: { id: "user", label: "User" },
  need: { id: "need", label: "Need" },
  capabilities: [
    { id: "dependency-1", label: "Capability" },
    { id: "dependency-2", label: "Capability" },
  ],
});

export const userNeedDependencyDemo: DemoConfig = layoutValueChain(valueChain, {
  viewBox: { width: 400, height: 300 },
  needStart: { x: 35, y: 76 },
});
