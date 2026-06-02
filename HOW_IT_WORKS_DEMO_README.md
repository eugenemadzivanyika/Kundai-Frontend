# Building a Scroll-Triggered "How It Works" Demo

This guide explains how to build an animated **"How it works"** section: a self-playing
product story that starts when the user scrolls to it, narrates itself step by step, and
loops forever with no user input. Think of a mini product film embedded in a landing page
— a UI reacts to an event, a fake cursor clicks through it, one device morphs into
another, a chat types itself out — all in sync with a list of captions.

The whole thing can be built with **React + plain CSS keyframes + `setTimeout`**. No
animation library is required. Keeping it dependency-free means it all lives in one
component file and there's nothing to learn beyond the browser primitives you already
know.

---

## The mental model

Treat it like a **film**. Everything you build maps to one of five roles:

| Role | What it does |
|------|--------------|
| **Trigger** | Starts the film when the section scrolls into view |
| **Director** | A timeline that advances a single "scene" value on a clock |
| **Actors / set** | Presentational components that render *based on* the current scene |
| **Camera cuts** | A switch that shows/hides the right actors for each scene |
| **Subtitles** | A caption list, synced so the active line matches the active scene |

The single most important rule:

> **There is one source of truth — a single `scene` string.** Every visual is a pure
> function of that string. Nothing animates itself on its own internal clock. The director
> changes `scene` on a schedule, components re-render, and CSS handles the motion.

This is what makes the demo predictable, loopable, and rewindable. If each piece ran its
own timers, keeping them in sync would be impossible.

---

## Recipe: build your own in 7 steps

### 1. Write the script as a list of scenes

List every distinct visual state as a string. Keep them granular — each one is a "frame"
you can cut to. For example: `idle`, `dashboard`, `alert-popup`, `cursor-clicks`,
`detail-panel`, `device-swap`, `chat`, `outcome`, `fading`.

Always include an `idle` state (nothing playing yet) and a `fading` state at the end that
you can loop back from.

### 2. Trigger on scroll, exactly once

Don't autoplay on page load — wait until the user actually scrolls to the section. Use an
`IntersectionObserver`: when ~15% of the section is on screen, set a `visible` flag and
then **disconnect the observer** so it never fires again. From that point the demo's own
internal loop takes over.

```jsx
const [visible, setVisible] = useState(false);
useEffect(() => {
  const obs = new IntersectionObserver(
    ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
    { threshold: 0.15 },
  );
  if (sectionRef.current) obs.observe(sectionRef.current);
  return () => obs.disconnect();
}, []);
```

### 3. Build the director: a timeline of timed transitions

This is the heart of it. A custom hook owns the `scene` state and schedules every
transition with `setTimeout`. Two details make it robust:

- **Track every timer in an array** so you can cancel them all at once. This is
  non-negotiable for a looping demo — untracked timers fire after a reset and corrupt the
  sequence.
- **Use absolute offsets from t=0**, not chained delays. Writing `at(3000)`, `at(4200)`,
  `at(5500)` reads like a storyboard and lets you retime one beat without disturbing the
  others.

```jsx
function useSequencer(visible) {
  const [scene, setScene] = useState('idle');
  const timers = useRef([]);

  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const at = (ms, fn) => { timers.current.push(setTimeout(fn, ms)); };

  const run = useCallback(() => {
    clearAll();
    setScene('dashboard');
    at(3000, () => setScene('alert-popup'));
    at(4200, () => setScene('cursor-clicks'));
    at(5500, () => setScene('detail-panel'));
    // ...each beat at its own absolute time from the start
  }, []);

  // start once, when scrolled into view
  const started = useRef(false);
  useEffect(() => {
    if (visible && !started.current) { started.current = true; at(400, run); }
  }, [visible]);

  // always clean up timers on unmount
  useEffect(() => () => clearAll(), []);

  return scene;
}
```

### 4. Make every actor a pure function of the scene

Each visual component takes props and renders markup — **no timers, no data fetching, no
self-driven state inside them**. A central "screen" component reads the current scene and
decides what to show. Mounting a component (because the scene just changed) is what kicks
off its entrance animation.

```jsx
function Screen({ scene }) {
  return (
    <>
      <Dashboard highlightCard={scene === 'detail-panel'} alertOn={scene === 'alert-popup'} />
      {scene === 'alert-popup'  && <AlertModal />}
      {scene === 'detail-panel' && <DetailPanel />}
      {scene === 'chat'         && <ChatMockup />}
    </>
  );
}
```

### 5. Put ALL motion in CSS keyframes, injected once

Keep a single string of CSS keyframes and inject it with a plain `<style>` tag at the top
of the section. Prefix every keyframe name (e.g. `demo-`) so it can't collide with the
rest of the app's styles.

```jsx
const CSS = `
  @keyframes demo-slideDown { from { opacity:0; transform:translateY(-20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes demo-pop       { from { opacity:0; transform:scale(.93) }        to { opacity:1; transform:scale(1) } }
`;
// ...later, inside the section:
<style>{CSS}</style>
```

The division of labor is the key idea: **JavaScript decides *when* things happen
(sequencing); CSS decides *how* they move (motion).** CSS runs the interpolation on the
compositor, so it's smooth and cheap, and your JS stays a simple list of timed scene
changes. Even elaborate effects — a device folding shut in 3D — are just multi-phase
keyframes using `transform-style: preserve-3d` and `rotate` on a chosen origin. A simple
cross-fade or scale between two mockups works just as well if you don't need the drama.

### 6. Use a fixed-size stage for pixel-perfect cursors and overlays

If you animate a fake cursor that "clicks" buttons, it moves by hardcoded pixel
coordinates. For those targets to stay accurate, give the animation area a **fixed width
and height** (e.g. 680×500) and position everything inside it absolutely. Then a cursor
keyframe that ends at a specific `(x, y)` always lands on the same button.

The cursor itself is just an SVG with a keyframe that translates it across the stage and
triggers a little "click flash" at a set percentage of the animation — timed to land while
the matching scene is active. If you need responsiveness, wrap the whole fixed stage in a
container and `transform: scale()` it, rather than making the internal layout fluid (fluid
layouts drift your click targets).

### 7. Sync captions, allow rewind, and loop

Give each caption the **set of scenes it covers**, then highlight whichever caption owns
the current scene. Past captions dim, the active one stands out, future ones stay faint.

```jsx
const STEPS = [
  { text: 'Submissions are graded automatically', scenes: new Set(['dashboard', 'alert-popup']) },
  { text: 'The system detects the gaps',          scenes: new Set(['detail-panel']) },
  { text: 'It builds a plan',                      scenes: new Set(['device-swap']) },
  { text: 'The student is coached on their phone', scenes: new Set(['chat', 'outcome']) },
];
const activeIndex = STEPS.findIndex(s => s.scenes.has(scene));
```

Make captions clickable to **rewind**: clear all timers and re-run the timeline starting
from that beat. The **loop** is the same move — when the last scene finishes, fade out,
reset to `idle`, and call `run()` again.

---

## Two set-pieces worth explaining

**Morphing one device into another (e.g. laptop → phone).** Run a *second* state in
parallel with `scene` — something like `swap: 'none' | 'folding' | 'done'`. At the climax,
flip it to `folding` to play a fold/shrink keyframe; a timer then flips it to `done`, which
unmounts the first device and mounts the second. The parent just picks which device to show
with two booleans. Keeping the swap as its own state keeps your main scene timeline clean.

**A self-typing chat.** Store the conversation as plain data — an array of messages, each
with the text and who it's from. Reveal them one at a time, and for each one append a
character to a "typed so far" string on a short interval to get the typing effect. Add a
typing-indicator bubble between messages for realism. Because it's just data, you change the
entire conversation by editing that array — no logic changes.

---

## Adapting it to your own product

The engine stays the same; **most of what makes the demo *yours* is data, not code.** Swap
these and you have a completely different story:

| Edit this | To change |
|-----------|-----------|
| The scene list + the timeline | The sequence of beats and their timing |
| The captions array | The narration on the side |
| The mock data arrays (rows, stats, names) | What the fake UI shows |
| The chat-messages array | The conversation |
| The CSS keyframes | The look and feel of each transition |

### Pitfalls (the things that bite you)

- **Always cancel your timers.** Untracked `setTimeout`s fire after the component unmounts
  or after a rewind and quietly corrupt the scene. The "push every timer into an array,
  clear them all together" pattern is essential.
- **Don't let actors animate on their own clocks.** One director, one timeline. If every
  component self-animates, rewind and loop fall out of sync.
- **Fixed stage for cursors.** Fluid layouts drift your hardcoded click coordinates.
- **Prefix your keyframes** so the global `<style>` block can't clash with app styles.
- **Respect `prefers-reduced-motion`.** A perpetual animation should be gated behind a
  reduced-motion check — pause it or show a static frame for users who opt out.

---

## Minimal skeleton to start from

Everything above distilled into ~40 lines. Grow it scene by scene and you arrive at the
full demo.

```jsx
import { useState, useRef, useEffect, useCallback } from 'react';

function useSequencer(visible) {
  const [scene, setScene] = useState('idle');
  const timers = useRef([]);
  const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const run = useCallback(() => {
    clearAll();
    setScene('a');
    at(2000, () => setScene('b'));
    at(4000, () => setScene('c'));
    at(6000, () => { setScene('idle'); at(300, run); }); // loop
  }, []);

  const started = useRef(false);
  useEffect(() => { if (visible && !started.current) { started.current = true; at(300, run); } }, [visible]);
  useEffect(() => () => clearAll(), []);
  return scene;
}

export function Demo() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); o.disconnect(); } },
      { threshold: 0.15 },
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);

  const scene = useSequencer(visible);

  return (
    <section ref={ref}>
      <style>{`@keyframes pop { from { opacity:0; transform:scale(.95) } to { opacity:1; transform:scale(1) } }`}</style>
      {scene === 'a' && <div style={{ animation: 'pop .4s' }}>Step A</div>}
      {scene === 'b' && <div style={{ animation: 'pop .4s' }}>Step B</div>}
      {scene === 'c' && <div style={{ animation: 'pop .4s' }}>Step C</div>}
    </section>
  );
}
```
