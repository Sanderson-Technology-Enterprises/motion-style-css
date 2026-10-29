# Release procedure

## Local gate

Use Node.js 22.14 or newer with the committed npm lockfile. Preserve user work and keep evidence in ignored `output/` or `.tmp/` directories. Never publish those directories.

1. Implement each behavior change after its focused regression is written. Run one selected test at a time. Keep a record of passing checks and rerun them only after related changes or a required final check.
2. Verify the affected controller, server, CSS, browser, and TypeScript contracts. The browser fixture waits for a rendered frame before asserting native animation events; lifecycle watchdog completion alone is not visual proof.
3. Set the candidate version consistently in `package.json`, the lockfile, both HTML entry points, and the changelog. Run `npm run format`, `npm run lint`, `npm run typecheck`, and `npm run docs`.
4. Freeze the changes and run `npm run check` as the final static/package gate. It checks generated-doc drift, versions, CSS parsing/preset presence, publint, a real tarball allowlist, and clean offline consumer JavaScript/CSS/type exports. Inspect `.tmp/package-proof/proof.json` and the exact Git diff before committing.
5. Capture final local browser evidence. Report browser, viewport, exercised flows, and limits separately from deterministic assertions. Do not claim device performance or deployed-site proof from local screenshots.

The runtime tests are intentionally separate from `npm run check` so already-green focused tests do not run again on each lint or packaging correction. Remote validation is manual by default to avoid duplicate paid CI runs. Invoke it only for the frozen revision.

## GitHub

The intended public target is `Sanderson-Technology-Enterprises/motion-style-css`. Check that the repository does not already exist before creating it. Confirm the authenticated organization and ensure no unrelated files or private audit artifacts are staged.

After the local gate passes, create the initial commit, create the public organization repository if absent, and push `main` without force. Verify the remote default-branch SHA. Create an annotated `v1.0.0` tag only for the verified candidate, and attach the checked tarball to the corresponding GitHub Release. A GitHub repository, tag, release, Actions result, and npm publication are distinct outcomes.

## npm

Publication requires a valid user session with permission for `@sanderson-technology-enterprises` and any organization-required MFA. The first public scoped publication uses `--access public`; see [npm's scoped-package instructions](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/).

If authentication is deferred, retain the checked candidate and its integrity record. Do not infer npm authentication or scope publishing permission from GitHub organization membership.

After authentication is restored, verify `npm whoami`, recheck the exact package/version on the registry, confirm the local candidate is unchanged, and regenerate docs before any new commit/push. Publish the already-verified tarball:

```sh
npm publish .tmp/package-proof/sanderson-technology-enterprises-motion-style-css-1.0.0.tgz --access public
npm view @sanderson-technology-enterprises/motion-style-css@1.0.0 version dist.integrity dist-tags --json
```

Compare registry integrity with the local proof, then install the registry version into a fresh consumer and repeat its import/CSS/type checks. Publication is immutable; if a published version needs repair, use a new version. Do not unpublish or change spending limits as a retry strategy.

## Consumer rollout

STE-USK-React and stesystems.com integration are separate future changes. Start from their current installed contracts and dedicated consumer tests; see [integration guidance](INTEGRATION.md). No production deployment is part of the library release itself. No project Notion destination is established here; remote documentation is not a release prerequisite.
