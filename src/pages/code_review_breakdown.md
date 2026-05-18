# Code Review: StoryDemo Refactor Plan

Reviewing `StoryDemo.refactor-plan.md` against the actual source (`StoryDemo.tsx`, 2439 lines).

---

## Bugs / Inaccuracies

### 1. `WaMessage` interface is wrong (types.ts — section 1)

**Plan says:**
```ts
export interface WaMessage { id: number; from: 'ai' | 'student'; text: string; typed: boolean; done: boolean; }
```

**Actual code (line 1281–1286):**
```ts
interface WaMessage {
  id: number; from: 'kundai' | 'tapiwa';
  text: string; time: string;
  typed: string; done: boolean;
  partial?: boolean;
}
```

Three fields are wrong:
- `from` is `'kundai' | 'tapiwa'`, not `'ai' | 'student'`
- `typed` is `string` (the partially-typed draft text), not `boolean`
- `time: string` and `partial?: boolean` are missing entirely

Copy from source, do not paraphrase.

---

### 2. `Backdrop` description is incorrect (section 8)

**Plan says:** "subtle dot-grid backdrop"

**Actual component (line 953–965):**
```tsx
const Backdrop: React.FC = () => (
  <div
    className="sd-backdrop-blur"
    style={{
      position: 'absolute', inset: 0, zIndex: 10,
      backdropFilter: 'blur(4px)',
      background: 'rgba(15,23,42,0.35)',
    }}
  />
);
```

`Backdrop` is a **dark semi-transparent modal overlay with a blur**, not a dot-grid. The dot-grid is the `aria-hidden` decorative div in `StoryDemo.tsx` main layout (lines 2279–2281) — that one never gets extracted as a component.

Rename the description to: "dark blur overlay behind modal panels".

---

### 3. `Backdrop` is in the wrong directory (section 8)

The plan places it at `dashboard/Backdrop.tsx` but it is used by three scene components:
- `SceneNotification` (line 972)
- `ScenePerfPanel` (line 1029)
- `SceneTwinPanel` (line 1108)

If `Backdrop` lives at `dashboard/` and scenes live at `dashboard/scenes/`, each scene file has to import via `'../Backdrop'`. That's a relative path going up a level, which is fine, but `Backdrop` is exclusively a scene-layer concern. **Move it to `dashboard/scenes/Backdrop.tsx`** so the scenes import `'./Backdrop'` instead.

`SceneOutcome` does **not** use `Backdrop` — it replaces the entire screen with white, so don't add an import there.

---

### 4. Cursor overlays: 5 files is over-engineered (section 13)

The plan splits the 5 cursor items into 5 separate files. The 4 overlay components are 6–9 lines each; `CursorSVG` is 4 lines. Every overlay imports `CursorSVG` from the same directory, making this:

```
dashboard/overlays/
├── CursorSVG.tsx           (4 lines)
├── CursorOverlay.tsx       (7 lines, imports CursorSVG)
├── CursorViewOverlay.tsx   (7 lines, imports CursorSVG)
├── CursorPerfRowOverlay.tsx(7 lines, imports CursorSVG)
└── CursorActivateOverlay.tsx(9 lines, imports CursorSVG)
```

Collectively ~37 lines across 5 files — each file is mostly boilerplate imports.

**Fix:** Consolidate into one `dashboard/overlays/Cursors.tsx` file (~37 lines). All four consumers already import from the same location, so `ScreenContent.tsx` just does:

```ts
import { CursorOverlay, CursorViewOverlay, CursorPerfRowOverlay, CursorActivateOverlay } from '../overlays/Cursors';
```

---

### 5. `FloatingToast` has a redundant `show` prop (section 20)

**Plan proposes:**
```tsx
interface FloatingToastProps {
  show: boolean;
  absorbing: boolean;
  left: number;
  top: number;
  width: number;
}
```

The component will be conditionally rendered at the call site with `{showFloatingToast && <FloatingToast ...>}`, so `show` is redundant — remove it. The rendered component is always visible when it exists in the tree. Having a `show` prop that's always `true` is noise.

**Revised interface:**
```tsx
interface FloatingToastProps {
  absorbing: boolean;
  left: number;
  top: number;
  width: number;
}
```

---

### 6. `findKeyCoords` is missing from `phone.utils.ts` (section 15)

The plan moves `findEmojiCoords` and `isEmojiLike` to `phone/phone.utils.ts`. However, there is a third utility — `findKeyCoords` — defined as a closure inside `PhoneMockup` (line 1356–1361):

```ts
const findKeyCoords = (ch: string): { row: number; col: number; key: string } | null => {
  const lower = ch.toLowerCase();
  for (let r = 0; r < KB_ROWS.length; r++) {
    const idx = KB_ROWS[r].indexOf(lower);
    if (idx >= 0) return { row: r, col: idx, key: KB_ROWS[r][idx] };
  }
  return null;
};
```

It uses only `KB_ROWS` (no component state), so it belongs in `phone.utils.ts` alongside the others. Move it out of the component and add it to the utils file.

---

## Structural Concerns

### 7. `NarrationPanel` is an opportunity missed

The narration strip (lines 2295–2331, ~37 lines) is left inline in `StoryDemo.tsx`. Given the stated goal of a ~90-line root component, this inline block takes up 37 of those lines. Extract it:

```tsx
// narration/NarrationPanel.tsx
interface NarrationPanelProps {
  steps: { text: string; scenes: Set<Scene> }[];
  activeIdx: number;
}
export const NarrationPanel: React.FC<NarrationPanelProps> = ({ steps, activeIdx }) => { ... }
```

`StoryDemo.tsx` then becomes:
```tsx
<NarrationPanel steps={NARRATION_STEPS} activeIdx={activeNarrationIdx} />
```

This keeps the root under 90 lines comfortably.

---

### 8. `constants.ts` needs to import `Scene` type

`NARRATION_STEPS` uses `Set<Scene>`:
```ts
const NARRATION_STEPS: { text: string; scenes: Set<Scene> }[] = [...]
```

The plan does not mention that `constants.ts` needs `import type { Scene } from './types'`. Add this to avoid a compile error.

---

### 9. `index.tsx` default re-export requires the new `StoryDemo.tsx` to keep its default export

The original file has both:
```ts
export const StoryDemo: React.FC = () => { ... }  // line 2246
export default StoryDemo;                          // line 2440
```

The new slim `StoryDemo.tsx` must preserve `export default StoryDemo` or the `index.tsx` re-export `export { default } from './StoryDemo'` will fail at runtime. Add a reminder to the implementation notes.

---

## Minor Corrections

| Item | Plan says | Correct |
|---|---|---|
| `FlashBurst` line range | "~60 lines" | 55 lines (1990–2044) |
| `PhoneMockup` description | "~530 lines" | 527 lines (1341–1867) |
| `useSequencer` imports | `Scene, SwapPhase from '../types'` | Also needs `useState, useRef, useCallback, useEffect` from React (obvious but worth noting) |
| `Dashboard.tsx` imports | "lucide-react icons" | Specifically `CheckCircle, ChevronRight, TrendingUp, AlertTriangle` — same as root file |

---

## What the Plan Gets Right

- Bottom-up implementation order (leaves before roots) correctly avoids broken imports at each step.
- Keeping `LaptopShell` constants (`W`, `BASE_D`, etc.) local — nothing else uses them.
- Keeping `PERF_ROWS` and `TAPIWA_ATTRS` local to their scene files — correct.
- `STORY_CSS` in its own file is correct; the `<style>` tag stays in the root.
- `useSequencer` boundary is clean — all animation state in one hook.
- `ScreenContent` as a thin composition layer is the right call.

---

## Summary of Required Changes to Plan

| # | Change |
|---|---|
| 1 | Fix `WaMessage` fields: `from`, `typed`, add `time` and `partial` |
| 2 | Fix `Backdrop` description: modal blur overlay, not dot-grid |
| 3 | Move `Backdrop` to `dashboard/scenes/Backdrop.tsx` |
| 4 | Merge 5 cursor files into one `dashboard/overlays/Cursors.tsx` |
| 5 | Remove `show` prop from `FloatingToastProps` |
| 6 | Add `findKeyCoords` to `phone/phone.utils.ts` |
| 7 | Add `narration/NarrationPanel.tsx` to directory structure |
| 8 | Note `import type { Scene }` required in `constants.ts` |
| 9 | Note that slim `StoryDemo.tsx` must keep `export default StoryDemo` |
