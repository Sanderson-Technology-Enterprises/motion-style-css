import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse, walk, generate } from 'css-tree';

/** Component pseudo-elements must remain owned by their components unless a burst is requested. */
test('decorative pseudo-element ownership is explicitly opt-in, including reduced motion', async () => {
  const ast = parse(await readFile('src/motion.css', 'utf8'));
  const selectors = [];
  walk(ast, (node) => {
    if (node.type === 'Rule') {
      const selector = generate(node.prelude);
      if (selector.includes('::after')) selectors.push(selector);
    }
  });
  assert.ok(selectors.length >= 2);
  for (const selector of selectors)
    assert.match(selector, /\[data-ms-burst=(?:"true"|true)\]/);
});

test('expanded preset families and blueprint erasure remain in the stylesheet contract', async () => {
  const css = await readFile('src/motion.css', 'utf8');
  for (const name of [
    'ms-scanline-in-left',
    'ms-blueprint-in',
    'ms-blueprint-out',
    'ms-hinge-in',
    'ms-hinge-out',
    'ms-gravity-in',
    'ms-gravity-out',
    'ms-pixelate-in',
    'ms-pixelate-out',
    'ms-glitch-in',
    'ms-glitch-out',
    'ms-transmission-in',
    'ms-transmission-out',
  ])
    assert.ok(css.includes(`@keyframes ${name}`), name);
  const blueprint = css.slice(
    css.indexOf('@keyframes ms-blueprint-out'),
    css.indexOf('/* Hinge:'),
  );
  assert.ok((blueprint.match(/clip-path:/g) ?? []).length >= 7);
  assert.match(blueprint, /99% 0/);
  assert.match(css, /mask-image: none !important/);
});
