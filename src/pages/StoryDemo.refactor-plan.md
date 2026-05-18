# StoryDemo Refactor Plan

`StoryDemo.tsx` is currently **2439 lines** in a single file. This plan breaks it into focused
modules grouped under `src/pages/StoryDemo/`.

---

## Target directory structure

```
src/pages/StoryDemo/
├── index.tsx                        ← re-exports StoryDemo (keeps existing import paths working)
├── StoryDemo.tsx                    ← slim root component (~90 lines)
├── storydemo.css.ts                 ← STORY_CSS string (~500 lines of keyframes)
├── types.ts                         ← all shared types and interfaces
├── constants.ts                     ← stage-level constants + NARRATION_STEPS
│
├── hooks/
│   └── useSequencer.ts              ← animation sequencer hook (~90 lines)
│
├── laptop/
│   ├── LaptopShell.tsx              ← 3D laptop box + lid animation (~270 lines)
│   └── ScreenContent.tsx            ← composes Dashboard + scene overlays (~20 lines)
│
├── dashboard/
│   ├── Dashboard.tsx                ← laptop screen UI (~130 lines)
│   ├── scenes/
│   │   ├── Backdrop.tsx             ← dark blur overlay behind modal panels (~15 lines)
│   │   ├── SceneNotification.tsx    ← notification flyout (~43 lines)
│   │   ├── ScenePerfPanel.tsx       ← performance panel slide-in (~70 lines)
│   │   ├── SceneTwinPanel.tsx       ← digital-twin approval panel (~130 lines)
│   │   └── SceneOutcome.tsx         ← outcome/result card (~50 lines)
│   └── overlays/
│       └── Cursors.tsx              ← CursorSVG (local) + 4 exported overlay components (~37 lines)
│
├── narration/
│   └── NarrationPanel.tsx           ← step-indicator strip on the left panel (~37 lines)
│
├── phone/
│   ├── PhoneMockup.tsx              ← full phone component with tilt + WA chat (~527 lines)
│   ├── IOSKeyboard.tsx              ← rendered QWERTY / emoji keyboard (~95 lines)
│   ├── KeyCap.tsx                   ← single key cap primitive (~26 lines)
│   ├── phone.constants.ts           ← WA_MESSAGES, KB_ROWS, EMOJI_GRID, TILT_* constants
│   └── phone.utils.ts               ← findEmojiCoords, isEmojiLike, findKeyCoords helpers
│
└── stage/
    ├── FlashBurst.tsx               ← camera-flash burst overlay (~55 lines)
    └── FloatingToast.tsx            ← morphing plan→WA toast overlay (~55 lines)
```

---

## File-by-file breakdown

### 1. `types.ts`
Move all shared types here so every module can import from one place without circular deps.

```ts
// Source lines: 502–515, 510, 1281–1286, 1316, 2067
export type Scene = 'idle' | 'dashboard' | 'bell-ping' | 'cursor-to-bell'
  | 'notification' | 'perf-glow' | 'perf-panel' | 'twin-panel'
  | 'phone' | 'outcome' | 'fading';

export type FoldPhase  = 'idle' | 'folding' | 'exit';
export type SwapPhase  = 'none' | 'folding' | 'exit' | 'flash' | 'phone-in';
export type KbMode     = 'abc' | 'emoji';

export interface LaptopShellProps { children: React.ReactNode; foldPhase?: FoldPhase; }
export interface DashboardProps   { perfGlowing?: boolean; twinGlowing?: boolean; twinCardHidden?: boolean; perfCardHidden?: boolean; bellActive?: boolean; bellHiddenInHeader?: boolean; }
export interface WaMessage        { id: number; from: 'kundai' | 'tapiwa'; text: string; time: string; typed: string; done: boolean; partial?: boolean; }
export interface KeyPress         { row: number; col: number; key: string; ts: number; }
```

---

### 2. `storydemo.css.ts`
Extract the entire `STORY_CSS` template literal (lines 7–501) into its own file.

```ts
// storydemo.css.ts
export const STORY_CSS = `...`; // ~495 lines unchanged
```

Imported by `StoryDemo.tsx` only.

---

### 3. `constants.ts`
All non-component constants that are used across multiple files.

Source lines to move:
- `ST_W`, `ST_H`, `PHONE_TOP`, `_PHONE_W`, `_PHONE_FR`, `_STATUS_H`, `TOAST_L`, `TOAST_T`, `TOAST_W` (2050–2060)
- `NARRATION_STEPS` (2224–2241)

Requires: `import type { Scene } from './types'` — `NARRATION_STEPS` uses `Set<Scene>` in its
type annotation and will fail to compile without it.

---

### 4. `hooks/useSequencer.ts`
Move the `useSequencer` function (lines 2069–2157) untouched. It owns all the timeout-driven
animation state: `scene`, `swapPhase`, `phoneStarted`, `restartKey`, `twinApproved`,
`showFloatingToast`, `toastAbsorbing`, `preWakePhone`, `handlePhoneComplete`.

Imports needed: `Scene`, `SwapPhase` from `../types`.

---

### 5. `laptop/LaptopShell.tsx`
Move lines 517–786. Includes the inline constants `W`, `BASE_D`, `BASE_H`, `LID_H`, `LID_D`,
`STAGE_W`, `STAGE_H` — keep them local to this file since nothing else uses them.

Imports: `LaptopShellProps`, `FoldPhase` from `../../types`.

---

### 6. `laptop/ScreenContent.tsx`
Move lines 2200–2219. Thin composition layer that picks which scene component to render inside
the laptop screen.

Imports: `Scene` from `../../types`, all scene components, `Dashboard`,
`{ CursorOverlay, CursorViewOverlay, CursorPerfRowOverlay, CursorActivateOverlay }` from
`../overlays/Cursors`.

---

### 7. `dashboard/Dashboard.tsx`
Move lines 787–952 plus its data constants `NAV_TABS`, `STAFF`, `PERF_STUDENTS`, `TWIN_ATTRS`,
`CAL_DAYS` (lines 787–821). Keep data constants in the same file — they are only used here.

Imports: `DashboardProps` from `../../types`, lucide-react icons.

---

### 8. `dashboard/scenes/Backdrop.tsx`
Move lines 953–969. Dark semi-transparent blur overlay (`rgba(15,23,42,0.35)`) that sits behind
all modal panels. Consumed only by scene components, so it lives inside `scenes/` — imports
within that directory use `'./Backdrop'` rather than `'../Backdrop'`.

Note: `SceneOutcome` does **not** use `Backdrop` (it replaces the full screen with white) —
do not add an import there.

---

### 9. `dashboard/scenes/SceneNotification.tsx`
Move lines 970–1012.

---

### 10. `dashboard/scenes/ScenePerfPanel.tsx`
Move lines 1013–1095 including the `PERF_ROWS` constant (local only).

---

### 11. `dashboard/scenes/SceneTwinPanel.tsx`
Move lines 1096–1234 including the `TAPIWA_ATTRS` constant (local only).

---

### 12. `dashboard/scenes/SceneOutcome.tsx`
Move lines 1235–1280.

---

### 13. `dashboard/overlays/Cursors.tsx`
Move lines 2159–2198 into a **single file** (~37 lines total). The five cursor items
(`CursorSVG` + 4 overlay components) are each 4–9 lines; splitting them across 5 files
adds import boilerplate with no benefit.

Export all four overlay components as named exports:

```ts
export const CursorOverlay: React.FC = ...
export const CursorViewOverlay: React.FC = ...
export const CursorPerfRowOverlay: React.FC = ...
export const CursorActivateOverlay: React.FC = ...
// CursorSVG stays local (used only within this file)
```

`ScreenContent.tsx` imports:
```ts
import { CursorOverlay, CursorViewOverlay, CursorPerfRowOverlay, CursorActivateOverlay }
  from '../overlays/Cursors';
```

---

### 14. `phone/phone.constants.ts`
Move:
- `WA_MESSAGES` (lines 1288–1303)
- `KB_ROWS` (lines 1304–1310)
- `EMOJI_GRID` (lines 1319–1325)
- `TILT_RY_MAX`, `TILT_RX_MAX` (lines 1311–1312)

---

### 15. `phone/phone.utils.ts`
Move:
- `findEmojiCoords` (lines 1327–1335)
- `isEmojiLike` (lines 1336–1339)
- `findKeyCoords` — currently a closure inside `PhoneMockup` (line 1356–1361); uses only
  `KB_ROWS` (no component state), so extract it as a standalone exported function here

---

### 16. `phone/KeyCap.tsx`
Move lines 1964–1989.

---

### 17. `phone/IOSKeyboard.tsx`
Move lines 1868–1963.

Imports: `KeyCap`, `KbMode`, `KeyPress` from local/types.

---

### 18. `phone/PhoneMockup.tsx`
Move lines 1341–1867. This is the largest single component (~527 lines); it has internal
state and its own geometry constants (`PHONE_W`, `PHONE_H`, etc.) — keep those local.

Imports: `WaMessage`, `KbMode`, `KeyPress` from `../../types`, `IOSKeyboard`,
`WA_MESSAGES`, `KB_ROWS`, `EMOJI_GRID`, `TILT_RY_MAX`, `TILT_RX_MAX` from `./phone.constants`,
`findEmojiCoords`, `isEmojiLike`, `findKeyCoords` from `./phone.utils`.

---

### 19. `stage/FlashBurst.tsx`
Move lines 1990–2049.

---

### 20. `stage/FloatingToast.tsx`
Extract the floating toast JSX block from `StoryDemo.tsx` (lines 2379–2431) into a component.

```tsx
interface FloatingToastProps {
  absorbing: boolean;
  left: number;
  top: number;
  width: number;
}
export const FloatingToast: React.FC<FloatingToastProps> = ({ absorbing, left, top, width }) => { ... }
```

---

### 21. `narration/NarrationPanel.tsx`
Extract the narration strip (lines 2295–2331, ~37 lines) from `StoryDemo.tsx` into a component.
Without this extraction the "~90-line root" goal is not achievable.

```tsx
import type { Scene } from '../types';

interface NarrationPanelProps {
  steps: { text: string; scenes: Set<Scene> }[];
  activeIdx: number;
}
export const NarrationPanel: React.FC<NarrationPanelProps> = ({ steps, activeIdx }) => { ... }
```

`StoryDemo.tsx` call site:
```tsx
<NarrationPanel steps={NARRATION_STEPS} activeIdx={activeNarrationIdx} />
```

---

### 22. `StoryDemo.tsx` (slim root)
After extraction this file contains only:
- Intersection-observer visibility hook
- `useSequencer` call
- Derived boolean flags (`showLaptopHtml`, `showPhone`)
- Layout JSX: section > dot-grid bg + 3-col grid > `NarrationPanel` + Stage (laptop / flash / phone / toast)

Should be ~90 lines.

**Important:** preserve `export default StoryDemo` at the bottom of this file. The `index.tsx`
re-export `export { default } from './StoryDemo'` depends on it.

---

### 23. `index.tsx`
```ts
export { StoryDemo } from './StoryDemo';
export { default } from './StoryDemo';
```
Keeps `import { StoryDemo } from '../pages/StoryDemo'` working without touching callers.

---

## Implementation order

Work bottom-up (leaves first, root last) to avoid import errors at each step.

1. Create `StoryDemo/` directory
2. `types.ts`
3. `storydemo.css.ts`
4. `phone/phone.constants.ts` + `phone/phone.utils.ts`
5. `phone/KeyCap.tsx`
6. `phone/IOSKeyboard.tsx`
7. `phone/PhoneMockup.tsx`
8. `stage/FlashBurst.tsx`
9. `stage/FloatingToast.tsx`
10. `dashboard/scenes/Backdrop.tsx`
11. `dashboard/scenes/SceneNotification.tsx`
12. `dashboard/scenes/ScenePerfPanel.tsx`
13. `dashboard/scenes/SceneTwinPanel.tsx`
14. `dashboard/scenes/SceneOutcome.tsx`
15. `dashboard/overlays/Cursors.tsx`
16. `dashboard/Dashboard.tsx`
17. `laptop/LaptopShell.tsx`
18. `laptop/ScreenContent.tsx`
19. `hooks/useSequencer.ts`
20. `constants.ts`
21. `narration/NarrationPanel.tsx`
22. `StoryDemo.tsx` (trimmed root)
23. `index.tsx`
24. Delete the original `src/pages/StoryDemo.tsx`

---

## What does NOT change

- No logic, no styling, no animation timing — pure extraction.
- The `<style>{STORY_CSS}</style>` tag stays in the root `StoryDemo.tsx` (only one mount point).
- All existing import paths from callers (`LandingPage.tsx`, etc.) continue to work via `index.tsx`.
