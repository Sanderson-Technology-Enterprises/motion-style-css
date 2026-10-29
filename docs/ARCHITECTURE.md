# Motion Style CSS architecture

## Boundaries

- `src/motion.css`: paired keyframes, motion selectors, reduced-motion overrides, and opt-in decorative sparks. The `ms-` class/keyframe prefix and `--ms-` properties keep this optional layer separate from STE component styling.
- `src/index.js`: validation, element ownership, lifecycle events, restoration, cancellation, staggering, and replacement. No runtime dependencies or top-level browser access.
- `src/index.d.ts`: the ESM TypeScript contract for HTML/SVG shells.
- `playground/`: independent browser demo and a Node HTTP server with an explicit public-asset allowlist. Both HTML entry points run the same controller. No bundler is required.
- `scripts/`: granular jsdoc2md generation, version/CSS checks, and clean tarball consumer proof.
- `tests/`: focused Node controller/server/CSS tests, real-browser checks, and a TypeScript consumer fixture.

## Operation ownership

Weak maps track active animation tasks, replacement transactions, and the latest public request per element. A new valid request claims ownership before cancellation events run. If a cancellation listener starts a newer request, the older caller settles as cancelled instead of overwriting it.

A replacement retains ownership across the asynchronous content callback. Cancellation prevents its subsequent entrance; the callback itself cannot be aborted by this library. Callback failure restores the original visibility marker only if another operation has not superseded it.

Each phase snapshots inline motion custom properties including priorities, the motion class, and data attributes. Cleanup removes listeners and timers and restores that state. Only the expected primary keyframe can finish or cancel a phase; decorative and unrelated animations are ignored. The timing watchdog handles missing styles, hidden elements, and suppressed events, so completion status is a lifecycle result rather than a rendering guarantee.

## Add a preset

1. Extend `presets`, the `Preset` declaration, and its JSDoc type.
2. Add paired `.ms-motion[data-ms-preset][data-ms-phase]` rules and `ms-` keyframes.
3. Add the playground label and README table entry.
4. Update the keyframe-name resolver for any nonstandard name.
5. Write a focused regression before implementation. Exercise entry/exit, repeat, cancellation, directions where supported, reduced motion, and ownership cleanup.
6. Regenerate references and pass the release metadata, lint, declaration, and packed-consumer checks before publication.

The optional React adapter, router adapters, native View Transition integration, and stesystems.com demonstrations remain future consumer work.
