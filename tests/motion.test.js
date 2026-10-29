import test from 'node:test';
import assert from 'node:assert/strict';
import {
  presets,
  animate,
  enter,
  exit,
  cancel,
  stagger,
  replace,
} from '../src/index.js';

// Minimal DOM surface: validates controller semantics without a browser dependency.
class FakeStyle {
  map = new Map();
  setProperty(k, v, priority = '') {
    this.map.set(k, { value: String(v), priority });
  }
  getPropertyValue(k) {
    return this.map.get(k)?.value ?? '';
  }
  getPropertyPriority(k) {
    return this.map.get(k)?.priority ?? '';
  }
  removeProperty(k) {
    this.map.delete(k);
  }
}
class FakeElement extends EventTarget {
  style = new FakeStyle();
  attributes = new Map();
  classes = new Set();
  classList = {
    contains: (v) => this.classes.has(v),
    add: (v) => this.classes.add(v),
    remove: (v) => this.classes.delete(v),
  };
  dataset = new Proxy(
    {},
    {
      set: (_, key, value) => {
        const attr = key.replace(/[A-Z]/g, (x) => '-' + x.toLowerCase());
        this.setAttribute('data-' + attr, value);
        return true;
      },
    },
  );
  getAttribute(k) {
    return this.attributes.get(k) ?? null;
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
  }
  removeAttribute(k) {
    this.attributes.delete(k);
  }
  offsetWidth = 100;
}
if (!globalThis.CustomEvent)
  globalThis.CustomEvent = class extends Event {
    constructor(type, options) {
      super(type);
      this.detail = options?.detail;
    }
  };
const el = () => new FakeElement();
/** Dispatch a browser-shaped animation event for a controller test. */
function animationEvent(
  target,
  type = 'animationend',
  name,
  pseudoElement = '',
) {
  const preset = target.getAttribute('data-ms-preset');
  const phase = target.getAttribute('data-ms-phase');
  const direction = target.getAttribute('data-ms-direction');
  const expected =
    preset === 'slam' && phase === 'out'
      ? 'ms-boom-out'
      : `ms-${preset}-${phase}${preset === 'curtain' ? `-${direction}` : ''}`;
  const event = new Event(type);
  Object.assign(event, { animationName: name ?? expected, pseudoElement });
  return target.dispatchEvent(event);
}
const done = (target) => animationEvent(target);

test('ignores unrelated and pseudo-element animation events', async () => {
  const node = el();
  const result = exit(node, { preset: 'slam' });
  try {
    animationEvent(node, 'animationend', 'component-pulse');
    animationEvent(node, 'animationcancel', 'component-pulse');
    animationEvent(node, 'animationend', 'ms-boom-out', '::after');
    assert.equal(node.getAttribute('data-ms-phase'), 'out');
    done(node);
    assert.deepEqual(await result, { status: 'finished' });
    assert.equal(node.getAttribute('data-ms-exited'), 'true');
  } finally {
    cancel(node);
  }
});

test('exports ten distinct presets', () => {
  assert.equal(presets.length, 10);
  assert.equal(new Set(presets).size, 10);
});
test('rejects invalid options', () => {
  assert.throws(() => animate(el(), { preset: 'unknown' }), RangeError);
  assert.throws(() => animate(el(), { duration: -1 }), RangeError);
  assert.throws(() => animate(el(), { direction: 'northwest' }), RangeError);
  assert.throws(() => stagger([el()], { interval: -1 }), RangeError);
});
test('entry/exit run and restore element state', async () => {
  const node = el();
  node.style.setProperty('--ms-duration', '999ms');
  const p = enter(node, { preset: 'slide', duration: 200 });
  assert.equal(node.getAttribute('data-ms-preset'), 'slide');
  assert.equal(node.getAttribute('data-ms-phase'), 'in');
  done(node);
  assert.deepEqual(await p, { status: 'finished' });
  assert.equal(node.getAttribute('data-ms-phase'), null);
  assert.equal(node.style.getPropertyValue('--ms-duration'), '999ms');
  assert.equal(node.classes.has('ms-motion'), false);
  assert.throws(() => exit(node, { preset: 'boom' }), RangeError);
});
test('cancel running animation and interrupt with another', async () => {
  const node = el();
  const a = enter(node, { preset: 'form' });
  const b = exit(node, { preset: 'portal' });
  assert.equal((await a).status, 'cancelled');
  assert.equal(cancel(node), true);
  assert.equal((await b).status, 'cancelled');
  assert.equal(cancel(node), false);
});
test('zero duration does not add animation classes', async () => {
  const node = el();
  assert.equal((await enter(node, { duration: 0 })).status, 'skipped');
  assert.equal(node.classes.size, 0);
});
test('stagger sets progressive delays and resolves all', async () => {
  const nodes = [el(), el(), el()];
  const p = stagger(nodes, { preset: 'cascade', interval: 55, delay: 10 });
  assert.deepEqual(
    nodes.map((x) => x.style.getPropertyValue('--ms-delay')),
    ['10ms', '65ms', '120ms'],
  );
  nodes.forEach(done);
  assert.deepEqual(
    (await p).map((x) => x.status),
    ['finished', 'finished', 'finished'],
  );
});

test('stagger validates the entire batch before starting any element', () => {
  const node = el();
  try {
    assert.throws(() => stagger([node, null]), TypeError);
    assert.equal(node.classes.size, 0);
    assert.throws(
      () => stagger([node, el()], { delay: 60000, interval: 1 }),
      RangeError,
    );
    assert.equal(node.classes.size, 0);
    assert.throws(() => stagger([node, node]), TypeError);
    assert.equal(node.classes.size, 0);
    assert.throws(() => stagger([], { preset: 'unknown' }), RangeError);
  } finally {
    cancel(node);
  }
});
test('replace executes swap strictly between out and in', async () => {
  const node = el();
  const swapped = [];
  const p = replace(
    node,
    () => {
      swapped.push('swap');
    },
    { in: 'flip', out: 'form' },
  );
  assert.equal(node.getAttribute('data-ms-phase'), 'out');
  done(node);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(swapped, ['swap']);
  assert.equal(node.getAttribute('data-ms-phase'), 'in');
  done(node);
  assert.equal((await p).in.status, 'finished');
});

test('replace validates the entrance before hiding the outgoing view', async () => {
  const node = el();
  const result = replace(node, () => {}, { in: 'missing', duration: 0 });
  await assert.rejects(result, RangeError);
  assert.equal(node.getAttribute('data-ms-exited'), null);
});

test('replace cancellation during async swap prevents a stale entrance', async () => {
  const node = el();
  let release;
  let signal;
  const swapping = new Promise((resolve) => {
    signal = resolve;
  });
  const wait = new Promise((resolve) => {
    release = resolve;
  });
  const result = replace(
    node,
    () => {
      signal();
      return wait;
    },
    { duration: 0 },
  );
  await swapping;
  const cancelled = cancel(node);
  release();
  assert.equal((await result).in.status, 'cancelled');
  assert.equal(cancelled, true);
});

test('replace restores visibility when its swap callback rejects', async () => {
  const node = el();
  await assert.rejects(
    replace(
      node,
      () => {
        throw new Error('swap failed');
      },
      { duration: 0 },
    ),
    /swap failed/,
  );
  assert.equal(node.getAttribute('data-ms-exited'), null);
  assert.equal(cancel(node), false);
});

test('a reentrant finish listener keeps ownership of the newest animation', async () => {
  const node = el();
  const original = enter(node);
  let newest;
  node.addEventListener(
    'ms:finish',
    () => {
      newest = enter(node, { preset: 'portal' });
    },
    { once: true },
  );
  const superseded = exit(node);
  try {
    assert.equal(node.getAttribute('data-ms-preset'), 'portal');
    done(node);
    assert.equal((await original).status, 'cancelled');
    assert.equal((await superseded).status, 'cancelled');
    assert.equal((await newest).status, 'finished');
  } finally {
    cancel(node);
  }
});

test('invalid elements and easing fail before disturbing an active animation', async () => {
  const node = el();
  const running = enter(node);
  try {
    assert.throws(() => enter(node, { easing: 42 }), TypeError);
    assert.throws(() => enter(node, { easing: '  ' }), TypeError);
    assert.throws(
      () => enter({ addEventListener() {}, style: {}, dataset: {} }),
      TypeError,
    );
    assert.throws(() => cancel(null), TypeError);
    assert.equal(node.getAttribute('data-ms-phase'), 'in');
    done(node);
    assert.equal((await running).status, 'finished');
  } finally {
    cancel(node);
  }
});

test('cleanup preserves inline priorities, preexisting attributes, and caller classes', async () => {
  const node = el();
  node.style.setProperty('--ms-duration', '75ms', 'important');
  node.classList.add('ms-motion');
  node.setAttribute('data-ms-preset', 'curtain');
  node.setAttribute('data-ms-direction', 'up');
  const result = enter(node, { preset: 'flip' });
  cancel(node);
  assert.equal((await result).status, 'cancelled');
  assert.equal(node.style.getPropertyValue('--ms-duration'), '75ms');
  assert.equal(node.style.getPropertyPriority('--ms-duration'), 'important');
  assert.equal(node.classList.contains('ms-motion'), true);
  assert.equal(node.getAttribute('data-ms-preset'), 'curtain');
  assert.equal(node.getAttribute('data-ms-direction'), 'up');
});

test('fallback settles once and synchronous start cancellation leaves no stale timer', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const node = el();
  let finishes = 0;
  node.addEventListener('ms:finish', () => {
    finishes += 1;
  });
  const result = exit(node, { duration: 10, delay: 5 });
  t.mock.timers.tick(134);
  assert.equal(finishes, 0);
  t.mock.timers.tick(1);
  assert.equal((await result).status, 'finished');
  assert.equal(finishes, 1);
  node.addEventListener('ms:start', () => cancel(node), { once: true });
  assert.equal((await enter(node)).status, 'cancelled');
  t.mock.timers.tick(1000);
  assert.equal(finishes, 2);
});

test('reduced motion and events use the target document realm', async () => {
  const node = el();
  let eventCount = 0;
  class FrameEvent extends CustomEvent {
    constructor(...args) {
      super(...args);
      eventCount += 1;
    }
  }
  node.ownerDocument = {
    defaultView: {
      CustomEvent: FrameEvent,
      matchMedia: () => ({ matches: true }),
    },
  };
  assert.equal((await exit(node)).status, 'skipped');
  assert.equal(node.getAttribute('data-ms-exited'), 'true');
  assert.equal((await enter(node)).status, 'skipped');
  assert.equal(node.getAttribute('data-ms-exited'), null);
  const result = enter(node, { respectReducedMotion: false });
  done(node);
  assert.equal((await result).status, 'finished');
  assert.equal(eventCount, 2);
});
