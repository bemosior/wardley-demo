import type { Component } from "./component";

/** a value chain link: `from` depends on `to` to deliver value */
export interface Dependency {
  from: Component["id"];
  to: Component["id"];
}
