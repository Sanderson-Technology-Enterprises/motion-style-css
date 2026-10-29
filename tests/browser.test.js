import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createPlaygroundServer } from '../playground/serve.js';

/** Run one isolated browser scenario against the real stylesheet and controller. */
async function withPage(engine, run) {
  const server = createPlaygroundServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let browser;
  try {
    browser = await engine.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await run(page);
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('playground initializes, switches targets, and stays accessible at narrow widths', async () => {
  await withPage(chromium, async (page) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.reload();
    await page.waitForFunction(
      () => document.querySelector('#preset-in')?.options.length === 10,
      undefined,
      { timeout: 3000 },
    );
    await page.getByRole('radio', { name: 'Choreographed group' }).check();
    await page.getByRole('button', { name: 'Play sequence' }).click();
    await page.waitForFunction(
      () => document.querySelector('#status').textContent === 'COMPLETE',
    );
    await page.getByRole('radio', { name: 'Entire page' }).check();
    assert.equal(
      await page.locator('#mock-page').getAttribute('data-ms-exited'),
      null,
    );
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1100 });
      assert.ok(
        await page.evaluate(
          () =>
            document.querySelector('.stage-foot').getBoundingClientRect().top -
              document.querySelector('#mock-page').getBoundingClientRect()
                .bottom >=
            8,
        ),
        `${width}px preview footer clearance`,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${width}px overflow`,
      );
      const results = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(
        results.violations.filter((item) =>
          ['serious', 'critical'].includes(item.impact),
        ),
        [],
        `${width}px accessibility`,
      );
    }
    await mkdir('output/playwright', { recursive: true });
    await page.screenshot({
      path: 'output/playwright/studio-desktop.png',
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: 'output/playwright/studio-mobile.png',
      fullPage: true,
    });
    assert.deepEqual(errors, []);
  });
});

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  test(`${name} runs every preset and direction with real animation events`, async () => {
    await withPage(engine, async (page) => {
      const failures = await page.evaluate(async () => {
        const { presets, enter, exit, cancel } = await import('/src/index.js');
        const node = document.createElement('div');
        node.textContent = 'Motion contract';
        document.body.append(node);
        const problems = [];
        for (const preset of presets) {
          for (const direction of ['slide', 'curtain'].includes(preset)
            ? ['left', 'right', 'up', 'down']
            : ['left']) {
            for (const [phase, action] of [
              ['in', enter],
              ['out', exit],
            ]) {
              let ended = false;
              node.addEventListener(
                'animationend',
                () => {
                  ended = true;
                },
                { once: true },
              );
              const result = await action(node, {
                preset,
                direction,
                duration: 40,
              });
              if (result.status !== 'finished' || !ended)
                problems.push(
                  `${preset}/${direction}/${phase}: missing real end`,
                );
              if (
                phase === 'out' &&
                getComputedStyle(node).visibility !== 'hidden'
              )
                problems.push(`${preset}: exit visible`);
              if (node.classList.contains('ms-motion'))
                problems.push(`${preset}: leaked class`);
            }
          }
        }
        const first = enter(node, { preset: 'slide', duration: 200 });
        const second = enter(node, { preset: 'slide', duration: 40 });
        if (
          (await first).status !== 'cancelled' ||
          (await second).status !== 'finished'
        )
          problems.push('rapid repeat');
        const interrupted = exit(node);
        cancel(node);
        if ((await interrupted).status !== 'cancelled') problems.push('cancel');
        node.remove();
        return problems;
      });
      assert.deepEqual(failures, []);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.deepEqual(
        await page.evaluate(async () => {
          const { enter, exit } = await import('/src/index.js');
          const node = document.querySelector('#preview-card');
          const out = await exit(node);
          const hidden = getComputedStyle(node).visibility;
          const inside = await enter(node);
          return [
            out.status,
            hidden,
            inside.status,
            getComputedStyle(node).visibility,
          ];
        }),
        ['skipped', 'hidden', 'skipped', 'visible'],
      );
    });
  });
}

test('CSS reduced motion preserves component pseudo-elements and iframe realm events', async () => {
  await withPage(chromium, async (page) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(
      await page.evaluate(async () => {
        const style = document.createElement('style');
        style.textContent = '.component-probe::after { content: "component"; }';
        document.head.append(style);
        const node = document.createElement('div');
        node.className = 'ms-motion component-probe';
        node.dataset.msPreset = 'slide';
        node.dataset.msPhase = 'in';
        document.body.append(node);
        const content = getComputedStyle(node, '::after').content;
        node.remove();
        style.remove();
        return content;
      }),
      '"component"',
    );
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.deepEqual(
      await page.evaluate(async () => {
        const { enter } = await import('/src/index.js');
        const frame = document.createElement('iframe');
        document.body.append(frame);
        const view = frame.contentWindow;
        const node = view.document.createElement('div');
        view.document.body.append(node);
        const events = [];
        node.addEventListener('ms:start', (event) =>
          events.push(event instanceof view.CustomEvent),
        );
        node.addEventListener('ms:finish', (event) =>
          events.push(event instanceof view.CustomEvent),
        );
        const result = await enter(node, { duration: 1 });
        frame.remove();
        return [result.status, events];
      }),
      ['finished', [true, true]],
    );
  });
});

test('studio uses supplied artwork and the STE Midnight Gold palette', async () => {
  await withPage(chromium, async (page) => {
    const branding = await page.evaluate(() => ({
      background: getComputedStyle(document.documentElement).backgroundColor,
      accent: getComputedStyle(document.querySelector('h1 em')).color,
      art: [...document.querySelectorAll('.brand-icon, .brand-art')].map(
        (image) => ({
          loaded: image.complete && image.naturalWidth > 0,
          source: image.getAttribute('src'),
        }),
      ),
      favicon: document.querySelector('link[rel="icon"]').getAttribute('href'),
    }));
    assert.equal(branding.background, 'rgb(7, 17, 31)');
    assert.equal(branding.accent, 'rgb(243, 210, 122)');
    assert.equal(branding.art.length, 2);
    assert.ok(branding.art.every((image) => image.loaded));
    assert.ok(
      branding.art.some((image) =>
        image.source.endsWith('motion-style-css-logo.png'),
      ),
    );
    assert.ok(
      branding.art.some((image) =>
        image.source.endsWith('motion-style-css-icon.png'),
      ),
    );
    assert.ok(branding.favicon.endsWith('motion-style-css-icon.png'));
    await page.goto(new URL('/playground/', page.url()).href);
    assert.equal(
      await page
        .locator('.brand-art')
        .evaluate((image) => image.complete && image.naturalWidth > 0),
      true,
    );
  });
});
