# Motion Style CSS

An optional, dependency-free motion layer for the STE interface system. Ten paired entrance and exit presets work with plain HTML, SVG shells, and JavaScript applications. The ESM controller adds cancellation, staggered choreography, replacement sequencing, and reduced-motion handling.

## Install

```sh
npm install @sanderson-technology-enterprises/motion-style-css
```

```js
import {
  enter,
  exit,
} from '@sanderson-technology-enterprises/motion-style-css';
import '@sanderson-technology-enterprises/motion-style-css/styles.css';

const shell = document.querySelector('#motion-shell');
await enter(shell, { preset: 'slide', direction: 'left', duration: 400 });
await exit(shell, { preset: 'form', duration: 250 });
```

Import the stylesheet once at the application boundary. Browser consumers need no Node runtime. Development tooling requires Node.js 22.14 or newer. The JavaScript entry is safe to import during server rendering; call DOM operations after the element mounts.

## Presets

| Preset    | Entrance                    | Exit                             |
| --------- | --------------------------- | -------------------------------- |
| `form`    | Fade and focus              | Dissolve into blur               |
| `slide`   | Directional slide and focus | Retreat toward the selected side |
| `swirl`   | Spiral into focus           | Unwind outward                   |
| `slam`    | Rise and land               | Compress and burst outward       |
| `origami` | Fold open in 3D             | Fold shut                        |
| `portal`  | Grow from a point           | Collapse into a point            |
| `curtain` | Directional clipping reveal | Directional conceal              |
| `elastic` | Spring into place           | Compress and implode             |
| `cascade` | Soft rising reveal          | Scatter away                     |
| `flip`    | Deal a 3D card              | Flip and discard                 |

`slide` and `curtain` accept `left`, `right`, `up`, and `down`. Other families accept the direction option without directional variation. Blur, clipping, and 3D effects can be expensive; there is no frame-rate guarantee.

## Controller

All phase methods return a promise containing `{ status: 'finished' | 'cancelled' | 'skipped' }`. Default options are `preset: 'form'`, `phase: 'in'`, `direction: 'left'`, `duration: 600`, `delay: 0`, and `easing: 'cubic-bezier(.2,.8,.2,1)'`. Timing values are finite numbers in milliseconds from 0 through 60000. Easing must be a non-empty CSS timing-function string; the browser interprets its CSS syntax.

- `animate(element, options)` runs the requested phase.
- `enter(element, options)` forces the entrance phase and clears the exit marker.
- `exit(element, options)` forces the exit phase and retains `data-ms-exited="true"` after success or a skipped phase.
- `cancel(element)` returns whether it cancelled an active animation or replacement. It resolves active phases as `cancelled` and restores motion-owned styles and attributes. A cancelled entrance remains revealed; a cancelled exit does not add an exit marker.
- `stagger(elements, options)` accepts a unique iterable and returns results in input order. Its default `interval` is 85ms. Each delay is `delay + index * interval`; every element and computed delay is validated before any phase starts. Empty valid iterables resolve to `[]`.
- `replace(element, swap, options)` validates both phases, exits, awaits the callback, and enters. Its `in` and `out` presets both default to `form`. Cancellation or a newer operation prevents the old entrance. An already-running callback is still awaited and must manage its own side effects. Callback rejection propagates and restores the original exit marker while the replacement still owns the shell.

```js
import {
  replace,
  stagger,
} from '@sanderson-technology-enterprises/motion-style-css';

await replace(
  shell,
  async () => {
    shell.textContent = 'Next view';
  },
  { out: 'form', in: 'slide', duration: 300 },
);

await stagger(document.querySelectorAll('.motion-tile'), {
  preset: 'cascade',
  phase: 'in',
  interval: 70,
  duration: 350,
});
```

The controller restores the prior inline `--ms-duration`, `--ms-delay`, and `--ms-ease` values and priorities, the motion class, and preset/phase/direction attributes. Keep these properties under one owner during an operation. It ignores descendant, pseudo-element, and unrelated animation events. If animation events never arrive, a `duration + delay + 120ms` watchdog finishes the phase; a `finished` result alone does not prove that an animation rendered.

Running phases dispatch non-bubbling `ms:start` events with `{ preset, phase }` and `ms:finish` events with `{ status, preset, phase }` in `event.detail`. Skipped phases dispatch neither event. Zero duration and the default reduced-motion policy skip JavaScript animation. `respectReducedMotion: false` disables that JavaScript skip only; the stylesheet always honors the accessibility preference.

See the [generated API references](docs/api/README.md) and [option types](docs/api/types.md).

## CSS-only use

Load the package stylesheet, then add a class and state attributes:

```html
<article
  class="ms-motion"
  data-ms-preset="slide"
  data-ms-phase="in"
  data-ms-direction="left"
  style="--ms-duration:400ms;--ms-offset:48px"
>
  Hello, motion.
</article>
```

Custom properties include `--ms-duration`, `--ms-delay`, `--ms-ease`, `--ms-offset`, `--ms-blur`, `--ms-rotate`, and `--ms-origin`. Presets may override the transform origin. CSS-only exits retain their last frame; they do not remove nodes or manage accessibility state. For the optional decorative `slam` exit sparks, add `data-ms-burst="true"` to a dedicated shell. That opt-in owns the shell's positioning and `::after`; ordinary motion leaves component pseudo-elements untouched.

## Accessibility and STE integration

Reduced motion is honored in CSS and enabled by default in JavaScript. A successful controller exit uses `visibility: hidden`. The host application manages focus before hiding focused content, DOM removal, routing, loading, ARIA state, and callback cancellation.

Use a wrapper around components with their own transforms or animations. Motion Style CSS owns the shell's motion; Layout Style CSS owns layout, UI Style Kit owns paint/theme, and Interactive Surface owns interaction feedback. No other STE package is a required dependency. [Integration guidance](docs/INTEGRATION.md) records the boundaries and future STE-USK-React/stesystems.com work; this release does not install itself into either consumer.

## Development

```sh
npm ci
npm run demo
# Open http://localhost:4173; set PORT to choose another loopback port.
npm exec playwright install chromium firefox webkit
```

Run focused tests with `node --test --test-name-pattern="test name" tests/motion.test.js` or `tests/browser.test.js`. Server and CSS checks have separate files. `npm run test` is the controller-only suite; `npm run test:browser` runs the browser scenarios sequentially. Keep broad checks for the final release gate.

```sh
npm run format
npm run lint
npm run typecheck
npm run docs
npm run check
```

`npm run check` verifies formatting, lint, declarations, generated-doc drift, version/CSS consistency, and an actual tarball installed in a clean offline consumer. Its package proof checks public exports and TypeScript declarations without application source or development dependencies in the tarball. [Release instructions](docs/RELEASING.md) cover the separate GitHub and npm publication steps.

MIT licensed. Copyright Sanderson Technology Enterprises LLC and contributors.
