/**
 * deterministic shims for DOM APIs happy-dom doesn't implement (SVG screen-coordinate
 * transforms, pointer capture) or that would otherwise make tests racy (real
 * requestAnimationFrame timing, real CSS-driven text measurement). Each shim is the
 * smallest stand-in that lets the actual production code path run, not a
 * re-implementation of its behavior.
 */
import { afterEach } from "vitest";

// each test mounts its own canvas/panel container; without this, elements from
// earlier tests stay attached to the document and a later test's unscoped
// querySelector can silently match a stale leftover instead of its own markup.
afterEach(() => {
  document.body.innerHTML = "";
});

// patch each <svg> element as it's created, as an own property, rather than guessing
// which prototype object happy-dom shares across instances — prototype-level patches
// silently missed the real instances (own properties always win over inherited ones,
// regardless of how happy-dom structures its internal class hierarchy).
const realCreateElementNS = document.createElementNS.bind(document);
document.createElementNS = ((ns: string, tag: string, options?: ElementCreationOptions) => {
  const el = realCreateElementNS(ns, tag, options);
  if (tag === "svg") {
    // toSvgPoint (src/engine/drag.ts) already has a defined fallback when there's no
    // screen CTM (treats client coordinates as SVG coordinates) — taking that branch
    // keeps drag tests' coordinates predictable instead of routing through a fake matrix.
    // @ts-expect-error -- shimming a real-browser-only SVG method for the test environment
    el.getScreenCTM = () => null;
  }
  return el;
}) as typeof document.createElementNS;

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function (): void {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = function (): void {};
}

if (typeof PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  // @ts-expect-error -- polyfilling a missing global for the test environment
  globalThis.PointerEvent = PointerEventPolyfill;
}

// animateTo (src/engine/animate.ts) takes an instant, synchronous path when the
// visitor prefers reduced motion — forcing that path means drag-to-snap tests don't
// need to fake requestAnimationFrame to observe the post-snap callback.
window.matchMedia = (() => ({ matches: true })) as unknown as typeof window.matchMedia;
