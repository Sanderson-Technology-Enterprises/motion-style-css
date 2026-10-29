import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'css-tree';
import { presets } from '../src/index.js';

/** Validate version-bearing metadata and the CSS/controller preset contract. */
async function checkRelease() {
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
  assert.equal(lock.version, manifest.version);
  assert.equal(lock.name, manifest.name);
  assert.equal(lock.packages[''].version, manifest.version);
  assert.equal(lock.packages[''].name, manifest.name);
  assert.equal(
    manifest.name,
    '@sanderson-technology-enterprises/motion-style-css',
  );
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  for (const file of ['index.html', 'playground/index.html', 'CHANGELOG.md']) {
    assert.ok(
      (await readFile(file, 'utf8')).includes(manifest.version),
      `${file}: missing current version`,
    );
  }
  const css = await readFile('src/motion.css', 'utf8');
  parse(css, {
    onParseError: (error) => {
      throw error;
    },
  });
  for (const preset of presets) {
    for (const phase of ['in', 'out']) {
      const name =
        preset === 'slam' && phase === 'out'
          ? 'ms-boom-out'
          : `ms-${preset}-${phase}${preset === 'curtain' ? '-left' : ''}`;
      assert.ok(
        css.includes(`@keyframes ${name} `),
        `Missing keyframes: ${name}`,
      );
    }
  }
  assert.equal(
    Object.keys(manifest.dependencies ?? {}).length,
    0,
    'runtime must remain dependency-free',
  );
  console.log(
    `Release metadata and stylesheet contracts agree at ${manifest.version}`,
  );
}

await checkRelease();
