# 1.0.0 audit and local verification

Audit date: October 29, 2026. Starting point: an uncommitted 0.1.0 starter on `main`. Original project files were preserved in an ignored local baseline before repairs. Work was implemented inline without worktrees or subagents.

## Findings and causal closure

All findings below are confirmed by source inspection and the named focused checks. Each repair is implemented and locally verified.

| ID  | Contract and cause                                                                                                             | Repair boundary                                                                                    | Proving check                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| M01 | Any animation event on the target could end the motion phase, including unrelated component animations.                        | Filter the exact primary keyframe, target, and pseudo-element.                                     | `ignores unrelated and pseudo-element animation events`                                      |
| M02 | Stagger started earlier items before validating later elements or computed delays.                                             | Materialize and validate the entire unique iterable before starting phases.                        | `stagger validates the entire batch before starting any element`                             |
| M03 | Replacement validated its entrance only after exiting, leaving the view hidden for an invalid entrance.                        | Normalize both configurations before any mutation.                                                 | `replace validates the entrance before hiding the outgoing view`                             |
| M04 | Replacement lost cancellation ownership while awaiting its callback, allowing a stale entrance.                                | Track a replacement transaction across the callback.                                               | `replace cancellation during async swap prevents a stale entrance`                           |
| M05 | Callback rejection left the outgoing view hidden.                                                                              | Restore the original exit marker only while the replacement retains ownership.                     | `replace restores visibility when its swap callback rejects`                                 |
| M06 | Synchronous finish listeners could start a newer phase that the older caller then overwrote.                                   | Claim request identity before cancellation and retain the newest request.                          | `a reentrant finish listener keeps ownership of the newest animation`                        |
| M07 | Incomplete target validation and non-string easing could disturb a running phase before failure.                               | Validate the required DOM/style surface and easing before ownership changes.                       | `invalid elements and easing fail before disturbing an active animation`                     |
| M08 | The demo server exposed arbitrary project files and reported port zero for ephemeral listeners.                                | Explicit asset allowlist, canonical-path boundary, method restrictions, and actual listening port. | `demo serves public assets and refuses private paths`                                        |
| M09 | The root demo imported removed API names and CSS as JavaScript without a bundler; architecture docs described another project. | Consolidate HTML entry points on one app and align the architecture with actual exports.           | `playground initializes, switches targets, and stays accessible at narrow widths`            |
| M10 | Target changes could retain stale hidden state; controls could change during choreography.                                     | Reset preview markers on target changes and lock configuration during a phase.                     | Browser scenario plus manual group/page/component replay                                     |
| M11 | The scrollable code panel lacked keyboard access and the mobile preview footer overlapped content.                             | Focusable labelled code region and reserved footer clearance.                                      | axe serious/critical checks, overflow checks, and footer-clearance assertions at four widths |
| M12 | Default sparks and reduced-motion rules claimed component pseudo-elements.                                                     | Require explicit `data-ms-burst="true"` for decorative ownership and its reduced-motion override.  | CSS ownership test and browser component-pseudo-element check                                |
| M13 | Declaration targets accepted generic XML elements without the required CSS style surface.                                      | Public `MotionElement` type narrowed to HTML or SVG.                                               | TypeScript positive and expected-error consumer fixtures                                     |
| M14 | Package identity, generated references, lint/format gates, and packed-consumer proof were missing.                             | STE-scoped 1.0.0 metadata, lockfile, granular jsdoc2md references, and release scripts.            | `npm run check` and clean offline tarball consumer                                           |

## Coverage ledger

| Workflow group                     | Disposition                    | Evidence / limits                                                                                                                                        |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle and input validation     | Validated                      | Controller tests; real primary animation events in Chromium, Firefox, WebKit.                                                                            |
| Cancellation and state restoration | Validated                      | Reentrant requests, interrupted phases, inline priorities, caller attributes/classes, synchronous start cancellation, watchdog timing.                   |
| Choreography                       | Validated                      | Progressive delays, whole-batch validation, group preview and restored controls.                                                                         |
| Replacement                        | Validated                      | Out/swap/in order, invalid entrance preflight, cancellation across async swap, callback rejection recovery.                                              |
| CSS and accessibility              | Validated for stated scenarios | Ten presets, all slide/curtain directions, reduced motion, opt-in pseudo-elements, iframe event realm. No device GPU/frame-rate guarantee.               |
| Playground and local server        | Validated                      | Target switching, copy feedback, private-path refusal, responsive layouts and keyboard-accessible code panel.                                            |
| Package, declarations, and docs    | Validated locally              | Seven public-export references plus generated types; zero runtime dependencies; actual tarball with 17 allowed files; clean consumer JS/CSS/type checks. |

Seventeen controller cases were exercised individually, without running the whole test suite. The server and CSS checks were run separately. Browser checks used sequential named scenarios. Each engine exercised 32 preset/direction/phase combinations, rapid repeat, cancellation, and reduced motion. Responsive assertions and axe serious/critical checks covered 320, 390, 768, and 1440 pixels. Passing axe checks do not establish complete accessibility compliance.

## Visual and manual evidence

The actual local Chrome session was used to select group choreography, play exit/entrance, observe disabled controls and completion, exit a whole page, switch back to a visible single component, and observe successful copy feedback. Its final preview is local only. Screenshots are retained under ignored `output/playwright/` and were visually inspected for desktop and mobile spacing. No video was recorded.

The first manual replay still used the pre-repair Node process; restarting that process aligned it with the tested server and resolved the stale entry-point mismatch. Separately, Chromium startup delayed the first rendered frame; the deterministic fixture waits for two animation frames before requiring native animation events. The production watchdog remains documented as best-effort lifecycle settlement.

Native desktop control was disabled in the available tool surface. Browser Use cloud testing was inapplicable to the loopback-only target; no public demo deployment was created. These limits are separate from the verified local Chrome interactions and deterministic browser assertions.

## Documentation and publication boundaries

The API Documentation Checker returned no extracted items for the TypeScript interfaces and marked coverage `not_evaluated`. Its empty comparison is not proof of compatibility or complete documentation. Source review, generated references, declaration fixtures, and packed consumers provide the actual contract evidence.

`npm run check` passed lint, formatting, TypeScript, generated-document drift, version/CSS consistency, publint, and the actual packed-consumer check. The tarball identity/integrity is retained in ignored `.tmp/package-proof/proof.json`. No known local release blocker remains for the audited scope; this is not a claim that all possible defects are absent.

GitHub repository/tag/release verification and npm registry publication are separate release actions. npm sign-in and publication were deferred by the user after the session returned HTTP 401. No registry availability, scope publishing permission, remote CI, production deployment, STE-USK-React integration, stesystems.com integration, or Notion readback is implied by the local checks. See [release procedure](RELEASING.md) and [integration contract](INTEGRATION.md).
