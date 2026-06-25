import { WardleyDemo } from "../engine/WardleyDemo";
import { Panel, type PanelDragSlot } from "../engine/panel";
import { createValueChain, relabelCapability, relabelNeed, relabelUser } from "../domain/valueChain";
import { layoutValueChain, type ValueChainLayoutOptions } from "../application/valueChainLayout";
import { NEED_CATALOG } from "../domain/needCatalog";
import type { DemoConfig } from "../engine/types";

const seedValueChain = createValueChain({
  user: { id: "user", label: "User" },
  need: { id: "need", label: "Need" },
  capabilities: [
    { id: "dependency-1", label: "Capability" },
    { id: "dependency-2", label: "Capability" },
    { id: "dependency-3", label: "Capability" },
  ],
});

const PANEL_SLOTS: PanelDragSlot[] = [
  { id: "user", iconText: "User", label: "Who It's For", active: false },
  { id: "need", iconText: "User Need", label: "What They Get", active: true },
  { id: "capability", iconText: "Capability", label: "How They Get It", active: false },
];

/** stagger between the Need's snap (Phase 0 done) and the Toolbox switching into the Phase 1 form, so a host's reveal tied to onNeedPlaced is visible first */
const TOOLBOX_STAGGER_MS = 500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ValueChainScenarioOptions {
  canvas: HTMLElement;
  toolbox: HTMLElement;
  /** fires as soon as the Need snaps into place (Phase 0 done), before the Toolbox switches into the Phase 1 form */
  onNeedPlaced?: () => void;
  onCelebrate?: () => void;
  /** override the generated layout's geometry; ignored if `config` is supplied */
  layout?: ValueChainLayoutOptions;
  /**
   * supply a fully custom DemoConfig (e.g. a host page's hand-tuned embed geometry)
   * instead of the generated one. Node ids must match the seed ValueChain's
   * ("user", "need", "dependency-1", "dependency-2", "dependency-3") — relabeling
   * is keyed by those ids. The Need node must be `draggable: true` with a `start`,
   * matching what `layoutValueChain` produces by default.
   */
  config?: DemoConfig;
}

/**
 * One continuous flow: drag the generic Need into place (Phase 0), then the
 * Toolbox walks the visitor through a 5-step form (need -> user -> 3
 * capabilities) that relabels each placeholder node as its answer comes in
 * (Phase 1), celebrating once more at the end now that the chain is fully
 * personalized.
 */
export async function runValueChainScenario(options: ValueChainScenarioOptions): Promise<WardleyDemo> {
  let chain = seedValueChain;
  const demoConfig = options.config ?? layoutValueChain(chain, options.layout);
  const panel = new Panel(options.toolbox);
  const dragHandle = panel.showDragHandles(PANEL_SLOTS);

  let demo!: WardleyDemo;
  await new Promise<void>((resolve) => {
    demo = WardleyDemo.mount(
      options.canvas,
      {
        ...demoConfig,
        onComplete: () => {
          dragHandle.complete();
          resolve();
        },
      },
      { dragHandle: dragHandle.activeElement },
    );
  });

  options.onNeedPlaced?.();
  await wait(TOOLBOX_STAGGER_MS);

  const needId = await panel.showField({
    type: "select",
    prompt: "What does this person need?",
    options: NEED_CATALOG.map((need) => ({ value: need.id, label: need.label })),
  });
  const needOption = NEED_CATALOG.find((need) => need.id === needId)!;
  chain = relabelNeed(chain, needOption.label);
  demo.relabelNode(chain.need.id, chain.need.label);

  const userLabel = await panel.showField({
    type: "text",
    prompt: "Who has this need?",
    placeholder: "e.g. A commuter",
  });
  chain = relabelUser(chain, userLabel);
  demo.relabelNode(chain.user.id, chain.user.label);

  const capabilityCount = seedValueChain.capabilities.length;
  for (let i = 0; i < capabilityCount; i++) {
    const capability = seedValueChain.capabilities[i];
    const capabilityLabel = await panel.showField({
      type: "text",
      prompt: `What's something they depend on to get this? (${i + 1} of ${capabilityCount})`,
      placeholder: "e.g. A kettle",
    });
    chain = relabelCapability(chain, capability.id, capabilityLabel);
    demo.relabelNode(capability.id, capabilityLabel);
  }

  panel.clear();
  demo.celebrate(chain.need.id);
  options.onCelebrate?.();

  return demo;
}
