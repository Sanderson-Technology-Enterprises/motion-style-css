# STE integration contract

Motion Style CSS is an optional effect layer. Consumers can add it without installing React or changing existing CSS ownership.

| Layer                   | Responsibility                                    | Motion integration                                             |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| Layout Style CSS        | Geometry, spacing, responsive structure           | Keep layout on the outer layout container.                     |
| UI Style Kit CSS        | Component paint, typography, theme                | Keep component classes on an inner element.                    |
| Interactive Surface CSS | Interaction and feedback states                   | Keep state transforms separate from the motion shell.          |
| Motion Style CSS        | Entrance, exit, choreography on a dedicated shell | Import the stylesheet once; explicitly call lifecycle methods. |
| STE-USK-React           | React semantics, composition, state, ARIA         | Future adapter; cancel shell animations during effect cleanup. |

## Available

The package exports `presets`, `animate`, `enter`, `exit`, `cancel`, `stagger`, and `replace`, plus `styles.css` and package metadata. It supports HTML and SVG style-bearing shells, reduced-motion defaults, DOM state restoration, and server-safe imports. CSS-only use is available separately from the controller.

## Composable

Wrap a component with a dedicated element and animate the wrapper. Keep existing component transforms, interaction states, and pseudo-elements on the component. Place page-shell motion inside the application's layout region. Any focus currently inside a disappearing shell must be moved by the host before exit.

```html
<div id="motion-shell">
  <!-- Existing STE component markup stays here. -->
</div>
```

Decorative slam sparks are opt-in through `data-ms-burst="true"`; use a shell without component-owned pseudo-elements. The ordinary stylesheet does not paint or suppress component pseudo-elements.

## Candidate: STE-USK-React adapter

Future work should verify that consumer's then-current public exports and peer versions, add an optional adapter without forcing motion into every component, retain one stylesheet import, and call `cancel(ref.current)` on cleanup. Effects must run only after mount. Strict Mode, rapid prop changes, unmount, reduced motion, and focus transfer need consumer-specific tests. No React export or adapter is part of this package today.

## Candidate: stesystems.com

After npm publication is independently verified, pin the released package in the actual site repository, add an interactive specimen with direction/preset controls, honor reduced motion, and validate narrow and wide layouts against its installed STE libraries. No site dependency, build, deployment, or live page was changed by this release preparation.

## Absent / unknown

Router bindings, navigation interception, focus trapping, particle renderers, and automatic ARIA management are absent. Compatibility with future STE-USK-React and site versions is unknown until those consumers are tested. Existing sibling manifests are context, not proof that this package is installed or integrated there.
