import { WardleyDemo } from "./engine/WardleyDemo";
import { fitNodeLabel } from "./engine/render";
import { Panel } from "./engine/panel";
import { createValueChain } from "./domain/valueChain";
import { layoutValueChain } from "./application/valueChainLayout";
import { runValueChainScenario } from "./demos/userNeedDependency";
import { attachAutopilot, parseSkipTarget } from "./dev/autopilot";

const api = {
  mount: WardleyDemo.mount,
  fitNodeLabel,
  Panel,
  domain: { createValueChain },
  layouts: { layoutValueChain },
  demos: { userNeedDependency: runValueChainScenario },
  /** dev/testing convenience for jumping past earlier phases — see src/dev/autopilot.ts */
  dev: { attachAutopilot, parseSkipTarget },
};

export default api;
