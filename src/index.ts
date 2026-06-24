import { WardleyDemo } from "./engine/WardleyDemo";
import { fitNodeLabel } from "./engine/render";
import { userNeedDependencyDemo } from "./demos/userNeedDependency";

const api = {
  mount: WardleyDemo.mount,
  fitNodeLabel,
  demos: { userNeedDependency: userNeedDependencyDemo },
};

export default api;
