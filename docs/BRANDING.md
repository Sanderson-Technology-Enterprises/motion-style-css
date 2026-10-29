# Motion Style CSS demo branding

The project owner supplied the original library artwork on October 29, 2026. The files are preserved without image edits:

| Demo asset                                    | Supplied file                                   | Use                                             |
| --------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `playground/assets/motion-style-css-logo.png` | `ChatGPT Image Oct 29, 2026, 04_26_22 AM-1.png` | Introduction artwork with the library wordmark. |
| `playground/assets/motion-style-css-icon.png` | `ChatGPT Image Oct 29, 2026, 04_26_23 AM-2.png` | Header, favicon, and animated preview card.     |

The standalone demo uses local `--demo-*` variables aligned with the inspected UI Style Kit CSS 2.6.0 Midnight Gold dark tokens: navy background `#07111f`, surfaces `#101b2d` and `#17243a`, gold `#d6a84f`, highlight `#f3d27a`, and muted silver `#b9c0cc`. Electric blue echoes the supplied artwork. These are explicit demo customization values; no shared palette package or upstream STE source was modified.

## Capability decision

| Need                       | Owner                    | State and evidence                                                                                                                  | Implementation / proof                                                                                                                |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Library identity           | Demo assets              | Available: owner-supplied original PNG files.                                                                                       | Explicit-size image elements, meaningful logo alternative text, decorative icon alternatives, and PNG routes on the server allowlist. |
| STE color branding         | Demo paint               | Composable: inspected Midnight Gold palette from the existing STE CSS ecosystem. This demo has no theme-library runtime dependency. | Local semantic color variables, scoped to the studio stylesheet; computed-color and axe checks.                                       |
| Motion behavior            | Motion Style CSS runtime | Available: current controller and styles.                                                                                           | Existing controls and lifecycle API retained; affected group/target scenario verified.                                                |
| React/Core/SDK integration | Future consumers         | Candidate or not applicable to this standalone static demo.                                                                         | No React migration, runtime infrastructure, or changes to STE-USK-React/stesystems.com.                                               |

The imagery, markup, and brand CSS belong to the demo. `src/motion.css` remains theme-independent, and the verified npm tarball excludes the playground. This follow-up commit does not move the existing `v1.0.0` tag or replace its release asset.

Responsive checks cover 320, 390, 768, and 1440 pixels, with explicit preview-footer clearance and no horizontal page overflow. The branded scenario verifies asset loading and exact navy/highlight colors. Local screenshots are retained in ignored `output/playwright/`; they do not represent a public demo deployment.
