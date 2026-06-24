# TODO — Tutorial Flow Plan

One continuous demo, not disconnected pieces. The visitor never leaves the
canvas; each phase builds on what the last phase left in place. This file is
written so a fresh Claude Code session can pick up any phase without having
read prior conversations — it names concrete files, exports, and types, not
just intent.

## How the engine is put together (read this before touching code)

Four layers, strict one-way dependency (lower layers know nothing about higher ones):

- **`src/engine/`** — generic SVG rendering/drag/animation. Knows about
  "nodes" and "connections", never about "User"/"Need"/"Capability".
  - `types.ts` — `DemoNode`, `DemoConnection`, `DemoConfig` (the engine's only contract).
  - `render.ts` — pure DOM/SVG element factories (`createNodeGroup`, `createConnectionLine`, `createTargetMarker`, `createFlowParticles`, `createFireworkShells`, `fitNodeLabel`). `NODE_RADIUS = 48`.
  - `drag.ts` — `attachDrag`: pointer-event drag-to-target with snap/return animation, optional `externalHandle` (drag picked up from a toolbox slot instead of the node itself).
  - `animate.ts` — `animateTo`, a generic tweened-position helper used by drag snap/return.
  - `WardleyDemo.ts` — the stateful scene. `WardleyDemo.mount(container, config, options?)` builds the whole scene once; after that, composable methods let a `Scenario` (see below) drive it step by step against the *same* mounted SVG:
    - `addNode(node)` — register + render one node.
    - `addConnection(conn)` — register + render one line (endpoints must already be added).
    - `relabelNode(id, label)` — update a node's text in place, refit font size.
    - `runDragStep(node, options)` — wire one drag-to-target interaction; on snap, calls `celebrateSnap` (lines activate, flow particles, firework burst, `options.onComplete`).
    - **Important gotcha:** the constructor auto-runs `runDragStep` for whichever node in `config.nodes` has `draggable: true` (at most one). If a phase has *no* drag step (Phase 1 doesn't), make sure no node in the initial `DemoConfig` is `draggable: true` — otherwise `mount` will wire a drag step you didn't ask for.
  - `panel.ts` — `Panel`, the toolbox abstraction. One `Panel` instance owns a container element and swaps between modes:
    - `showDragHandles(slots: PanelDragSlot[])` → `PanelDragHandle` (used by Phase 0).
    - `showField(field: PanelField)` → `Promise<string>`, resolves with the trimmed answer once the visitor submits (`type: "select"` or `type: "text"`). Already built and unit-tested; **not yet wired into any Scenario**.
    - Not yet built: an "instrument panel" mode (live evolutionary-characteristics readout, Phase 2) and a "Q&A" mode (Phase 3). See those phases below for what they need.
  - `styles.ts` — `injectStylesOnce`, all CSS-in-JS class names (`wd-node`, `wd-panel-*`, etc.).

- **`src/domain/`** — Wardley Mapping vocabulary, framework-agnostic, no DOM.
  - `component.ts` — `Component { id, label, kind }`, `relabelComponent`.
  - `dependency.ts` — `Dependency { from, to }`.
  - `valueChain.ts` — `ValueChain { user, need, capabilities }` aggregate. `createValueChain(spec)` (throws if `capabilities.length === 0`), `valueChainComponents`, `valueChainDependencies`, `relabelUser`, `relabelNeed`, `relabelCapability`. **The chain is an immutable value** — every relabel function returns a new `ValueChain`; nothing mutates in place.
  - `needCatalog.ts` — `NEED_CATALOG: NeedOption[]` (`{id, label}`), the preset list for Phase 1's dropdown. Phase 3's question bank should follow the same `{id, label}`-ish shape.

- **`src/application/`** — translates domain → engine.
  - `valueChainLayout.ts` — `layoutValueChain(chain, options?)`: positions a `ValueChain` as a `DemoConfig` (User centered above the viewBox, Need below it, Capabilities spread evenly along a row). Currently always marks the Need as the one draggable node with a `start` position — that default is Phase-0-specific and will need an option to disable for Phase 1 (no dragging at all).

- **`src/demos/`** — one file per tutorial scenario, composing the layers above.
  - `userNeedDependency.ts` — exports `runValueChainScenario(options)`. **As of now this is still only Phase 0**: build the chain with generic placeholder labels, show one drag slot in the Panel, mount, done. It is *not* yet the multi-step Phase 1 flow (dropdown → 4 text fields → celebration) — don't assume the "Scenario" refactor mentioned in past TODO revisions already covers Phase 1's steps. It only removed the toolbox-toggling duplication that used to live in `index.html`/`preview.html`'s inline `<script>` blocks.

- **`src/index.ts`** — the public API surface (`WardleyDemo.demos.userNeedDependency`, etc.), consumed by `index.html` (Vite dev server, source) and `preview.html` (loads `dist/wardley-demo.js`, the built bundle — mirrors how the real host page `lwm-html` would embed this).

### Working conventions
- Test with `npm test` (Vitest + happy-dom). **Never run it inline in this session** — delegate to a subagent and have it report back condensed pass/fail output (see `[[feedback_test_execution]]` memory).
- `npm run dev` serves `index.html` for live iteration; `npm run build` then `npm run preview` exercises the built bundle through `preview.html`'s host-page-style embed.
- Every existing module under `domain/`, `application/`, `engine/`, `demos/` has a co-located `*.test.ts`. Keep that pattern — new modules get tests beside them, not in a separate tree.

## Phase 0 — Value Chain (done)

- [x] Generic User → User Need → Capability x3, drag Need into place, celebration.

## Phase 0.5 — Refactor prep (done)

- [x] Mutable domain labels (`relabelComponent`, `relabelUser`, `relabelNeed`, `relabelCapability`).
- [x] Decompose the engine's one-shot mount into composable ops (`addNode`, `addConnection`, `relabelNode`, `runDragStep` — see `WardleyDemo.ts` above).
- [x] `Panel` abstraction with swappable modes — drag-handle and form modes built; instrument-panel and Q&A modes deliberately deferred to Phase 2/3.
- [x] `needCatalog.ts` with `{id, label}` shape.
- [x] Removed the toolbox-toggling duplication between `index.html` and `preview.html` (both now just call `WardleyDemo.demos.userNeedDependency(...)`).

## Phase 1 — Personalize the value chain (not started — primitives exist, flow doesn't)

Goal: the Toolbox becomes a 5-step data-entry sequence; no dragging. Order: pick
a need from `NEED_CATALOG` → type a User → type Capability 1 → Capability 2 →
Capability 3 → celebrate.

Concrete plan:
1. In `src/demos/userNeedDependency.ts`, replace the current single-shot `runValueChainScenario` body with a step sequence (an `async` function or a small step-runner is fine — there's no existing `Scenario` *type* to conform to, despite the function's name; build whatever's simplest).
2. Build the initial `ValueChain` with **placeholder labels** (as today: "User"/"Need"/"Capability") via `createValueChain`, then `layoutValueChain(chain, { ...})` — but pass an option (add one to `ValueChainLayoutOptions` in `valueChainLayout.ts`) so **no** node is marked `draggable`. Mount via `WardleyDemo.mount` with this config; with nothing draggable, the constructor's auto-drag-step is a no-op.
3. Step 1 — need: `panel.showField({ type: "select", prompt: "...", options: NEED_CATALOG.map(n => ({ value: n.id, label: n.label })) })`. On resolve, look up the chosen `NeedOption`, `relabelNeed(chain, option.label)`, and call `demo.relabelNode(chain.need.id, option.label)` to update the rendered SVG text.
4. Step 2 — user: `panel.showField({ type: "text", prompt: "Who has this need?", placeholder: "..." })`. On resolve, `relabelUser` + `demo.relabelNode(chain.user.id, value)`.
5. Steps 3–5 — capabilities: loop over `chain.capabilities` (3 of them — update the seed spec in `userNeedDependency.ts` from 2 to 3 capability entries, matching the forecast's "three specific components"), one `showField` text prompt each, `relabelCapability(chain, capability.id, value)` + `demo.relabelNode(capability.id, value)` per answer.
6. After the last capability, call `panel.clear()` (or similar) and fire the existing celebration path — reuse `WardleyDemo`'s firework/flow-particle effects (`celebrateSnap` is private and snap-triggered only, so for Phase 1 you'll likely want a small public method on `WardleyDemo`, e.g. `celebrate(nodeId)`, that runs the same visual payoff without requiring a drag/snap to have happened — check whether extracting that makes sense vs. duplicating a smaller effect).
7. Keep `ValueChainScenarioOptions` (`canvas`, `toolbox`, `onCelebrate`, `layout`, `config`) as the function's external contract — host pages (`index.html`, `preview.html`) shouldn't need to change for this phase.
8. Update/extend `src/demos/userNeedDependency.test.ts` for the new step sequence (it currently only tests the Phase-0 drag interaction).

Open question to settle before coding: does `WardleyDemo` need a public, non-drag celebration method, or should Phase 1's celebration be a simpler effect (e.g. just the firework burst, no flow particles since there's no "snap" to anchor them to)? Decide based on what looks right when you try it, not in the abstract.

## Phase 2 — Evolution (not started; needs new abstractions)

Goal: a Wardley map backdrop appears behind the value chain; User floats above
it, Need + Capabilities sit on it; visitor drags each of Need/Capability-1/2/3
left-right along its evolution axis one at a time, sees live characteristics
+ animation feedback, confirms, repeats, celebrates.

This phase needs pieces that don't exist yet — don't assume they're hiding somewhere:
- **Map backdrop rendering.** Nothing in `engine/render.ts` draws map gridlines/axis-stage backdrop (Genesis/Custom-Built/Product/Commodity bands). New code, likely a new `render.ts` factory (e.g. `createMapBackdrop(viewBox)`) plus new CSS classes in `styles.ts`.
- **Evolution-axis constraint on drag.** `drag.ts`'s `attachDrag` currently snaps to one fixed `(x,y)` target point within `snapThreshold`. Phase 2 wants free horizontal movement along a stage axis with a *confirm* action rather than a snap-to-point — that's a different interaction mode, not a parameterization of the existing one. Plan for a second function in `drag.ts` (or a mode flag) rather than overloading `attachDrag`.
- **Evolutionary-characteristics data.** No data module for this yet. Needs a small domain module (e.g. `src/domain/evolution.ts`) mapping evolution-stage (continuous x-position, or a discretized stage enum) → characteristics text, probably split by `ComponentKind` (`need` vs `capability`) per the forecast ("characteristics relevant to capabilities instead of user needs").
- **Live-updating "instrument panel" Panel mode.** `panel.ts`'s `Panel` class needs a new method, e.g. `showInstrumentPanel(...)`, that re-renders characteristics text as drag position changes — `showField`'s one-shot promise resolution model doesn't fit a continuously-updating readout. This is the mode `panel.ts`'s own doc comment already flags as deferred.
- **Stage-dependent flow animation.** The "genesis sputters / commodity flows smoothly" requirement means `createFlowParticles` (`render.ts`) and its CSS (`styles.ts`) need parameters for particle count/speed/regularity driven by evolution stage, not just the fixed `FLOW_PARTICLE_COUNT`/timing constants `WardleyDemo.ts` uses today.

Don't start writing Phase 2 code until Phase 1 is done and merged — Phase 1 will likely surface whether the "step sequence" pattern needs to be formalized into a real reusable `Scenario` type, which Phase 2 (4 repeated drag-confirm steps) would also benefit from.

## Phase 3 — Thinking with the map (not started; needs new abstractions)

Goal: Toolbox becomes a Q&A panel. Three questions in sequence, each anchored
to a capability, each answer rendered as a map annotation near that capability.

New pieces needed, not yet present:
- **Q&A Panel mode.** Another new `Panel` method (e.g. `showQuestion(...)`), parallel to `showField` but for the question→annotate flow described in the forecast (bias-check question, build/buy/outsource question, then a repeatable "random question" picker).
- **Question bank module.** `src/domain/questionBank.ts` or similar, shaped like `needCatalog.ts`'s `{id, label}` pattern — the forecast explicitly anticipated reusing that shape here.
- **Map annotation rendering.** Nothing currently renders free text near a node on the map. New `render.ts` factory (e.g. `createAnnotation(node, text)`) plus placement logic to avoid overlapping the node/backdrop from Phase 2.
- **"Random question, re-roll until you like it" UI.** A button in the Q&A panel mode that re-picks before the visitor commits an answer — straightforward once the Q&A mode and question bank exist.

This phase is entirely downstream of Phase 2's map backdrop existing (annotations are positioned relative to it), so don't start scoping it precisely until Phase 2 lands.

## Finale

- [ ] Big celebration.
- [ ] "Next" control scrolls the visitor to the next section of the page.
