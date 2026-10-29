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
