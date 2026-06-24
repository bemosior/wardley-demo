import { describe, expect, it, vi } from "vitest";
import { runValueChainScenario } from "./userNeedDependency";

function drag(handle: Element, to: { x: number; y: number }): void {
  handle.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, clientY: 0, pointerId: 1 }));
  handle.dispatchEvent(new PointerEvent("pointermove", { clientX: to.x, clientY: to.y, pointerId: 1 }));
  handle.dispatchEvent(new PointerEvent("pointerup", { clientX: to.x, clientY: to.y, pointerId: 1 }));
}

function buildScenario(onCelebrate: () => void) {
  const canvas = document.createElement("div");
  const toolbox = document.createElement("div");
  document.body.append(canvas, toolbox);
  runValueChainScenario({ canvas, toolbox, onCelebrate });
  return toolbox;
}

describe("runValueChainScenario", () => {
  it("completes the panel's active drag slot and fires onCelebrate once the Need is dropped on target", () => {
    const onCelebrate = vi.fn();
    const toolbox = buildScenario(onCelebrate);
    const activeSlot = toolbox.querySelector(".wd-panel-slot--active")!;
    expect(activeSlot).not.toBeNull();

    // default layout's Need target is centerX=200, needY=76 for the default 400x300 viewBox
    drag(activeSlot, { x: 200, y: 76 });

    expect(toolbox.querySelector(".wd-panel-slot--active")).toBeNull();
    expect(onCelebrate).toHaveBeenCalledOnce();
  });

  it("does not fire onCelebrate if the Need is dropped away from its target", () => {
    const onCelebrate = vi.fn();
    const toolbox = buildScenario(onCelebrate);
    const activeSlot = toolbox.querySelector(".wd-panel-slot--active")!;

    drag(activeSlot, { x: 0, y: 0 });

    expect(toolbox.querySelector(".wd-panel-slot--active")).not.toBeNull();
    expect(onCelebrate).not.toHaveBeenCalled();
  });
});
