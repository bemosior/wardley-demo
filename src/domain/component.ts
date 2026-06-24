export type ComponentKind = "user" | "need" | "capability";

export interface Component {
  id: string;
  label: string;
  kind: ComponentKind;
}
