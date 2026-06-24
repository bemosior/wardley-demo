import { describe, expect, it, vi } from "vitest";
import { runValueChainScenario } from "./userNeedDependency";
import { NEED_CATALOG } from "../domain/needCatalog";

function drag(handle: Element, to: { x: number; y: number }): void {
  handle.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, clientY: 0, pointerId: 1 }));
  handle.dispatchEvent(new PointerEvent("pointermove", { clientX: to.x, clientY: to.y, pointerId: 1 }));
  handle.dispatchEvent(new PointerEvent("pointerup", { clientX: to.x, clientY: to.y, pointerId: 1 }));
}

/** happy-dom doesn't implement HTMLFormElement.requestSubmit; dispatch the event it relies on directly */
function submitForm(toolbox: HTMLElement): void {
  toolbox.querySelector("form")!.dispatchEvent(new Event("submit", { cancelable: true }));
}

function submitText(toolbox: HTMLElement, value: string): void {
  const input = toolbox.querySelector<HTMLInputElement>(".wd-panel-form-input")!;
  input.value = value;
  submitForm(toolbox);
}

function submitSelect(toolbox: HTMLElement, value: string): void {
  const select = toolbox.querySelector<HTMLSelectElement>(".wd-panel-form-input")!;
  select.value = value;
  submitForm(toolbox);
}

function buildScenario(onCelebrate: () => void) {
  const canvas = document.createElement("div");
  const toolbox = document.createElement("div");
  document.body.append(canvas, toolbox);
  runValueChainScenario({ canvas, toolbox, onCelebrate });
  return { canvas, toolbox };
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

/** drags the Need into place (default layout's target is centerX=200, needY=76 for the default 400x300 viewBox) */
async function completeDragStep(toolbox: HTMLElement): Promise<void> {
  const activeSlot = toolbox.querySelector(".wd-panel-slot--active")!;
  drag(activeSlot, { x: 200, y: 76 });
  await flush();
}

describe("runValueChainScenario", () => {
  it("starts with the panel's drag handle active, before any form step", () => {
    const { toolbox } = buildScenario(vi.fn());
    expect(toolbox.querySelector(".wd-panel-slot--active")).not.toBeNull();
    expect(toolbox.querySelector("form")).toBeNull();
  });

  it("does not advance to the form sequence if the Need is dropped away from its target", async () => {
    const { toolbox } = buildScenario(vi.fn());
    const activeSlot = toolbox.querySelector(".wd-panel-slot--active")!;
    drag(activeSlot, { x: 0, y: 0 });
    await flush();

    expect(toolbox.querySelector(".wd-panel-slot--active")).not.toBeNull();
    expect(toolbox.querySelector("form")).toBeNull();
  });

  it("walks need -> user -> 3 capabilities after the drag step, relabeling each node as it's answered", async () => {
    const { canvas, toolbox } = buildScenario(vi.fn());
    await completeDragStep(toolbox);

    const need = NEED_CATALOG[0];
    submitSelect(toolbox, need.id);
    await flush();
    expect(canvas.querySelector('[data-node-id="need"] .wd-node-label')!.textContent).toBe(need.label);

    submitText(toolbox, "A commuter");
    await flush();
    expect(canvas.querySelector('[data-node-id="user"] .wd-node-label')!.textContent).toBe("A commuter");

    submitText(toolbox, "A kettle");
    await flush();
    expect(canvas.querySelector('[data-node-id="dependency-1"] .wd-node-label')!.textContent).toBe("A kettle");

    submitText(toolbox, "Water");
    await flush();
    expect(canvas.querySelector('[data-node-id="dependency-2"] .wd-node-label')!.textContent).toBe("Water");

    submitText(toolbox, "Electricity");
    await flush();
    expect(canvas.querySelector('[data-node-id="dependency-3"] .wd-node-label')!.textContent).toBe("Electricity");
  });

  it("clears the panel and fires onCelebrate once the last capability is answered", async () => {
    const onCelebrate = vi.fn();
    const { toolbox } = buildScenario(onCelebrate);
    await completeDragStep(toolbox);
    expect(onCelebrate).not.toHaveBeenCalled();

    submitSelect(toolbox, NEED_CATALOG[0].id);
    await flush();
    submitText(toolbox, "A commuter");
    await flush();
    submitText(toolbox, "A kettle");
    await flush();
    submitText(toolbox, "Water");
    await flush();
    expect(onCelebrate).not.toHaveBeenCalled();

    submitText(toolbox, "Electricity");
    await flush();

    expect(toolbox.children.length).toBe(0);
    expect(onCelebrate).toHaveBeenCalledOnce();
  });

  it("does not advance on a whitespace-only capability answer", async () => {
    const { toolbox } = buildScenario(vi.fn());
    await completeDragStep(toolbox);
    submitSelect(toolbox, NEED_CATALOG[0].id);
    await flush();
    submitText(toolbox, "A commuter");
    await flush();

    submitText(toolbox, "   ");
    await flush();

    expect(toolbox.querySelector(".wd-panel-form-prompt")!.textContent).toBe(
      "What's something they depend on to get this? (1 of 3)",
    );
  });
});
