import { WardleyDemo } from "./engine/WardleyDemo";
import { fitNodeLabel } from "./engine/render";
import { createValueChain } from "./domain/valueChain";
import { layoutValueChain } from "./application/valueChainLayout";
import { userNeedDependencyDemo } from "./demos/userNeedDependency";

const api = {
  mount: WardleyDemo.mount,
  fitNodeLabel,
  domain: { createValueChain },
  layouts: { layoutValueChain },
  demos: { userNeedDependency: userNeedDependencyDemo },
};

export default api;
