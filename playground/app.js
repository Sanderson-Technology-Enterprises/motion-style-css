import { presets, enter, exit, stagger, cancel } from '../src/index.js';

const $ = (selector) => document.querySelector(selector);
const inSelect = $('#preset-in');
const outSelect = $('#preset-out');

const labels = {
  form: 'Form & Dissolve',
  slide: 'Slide & Retreat',
  swirl: 'Swirl & Unwind',
  slam: 'Slam & Boom',
  origami: 'Origami',
  portal: 'Portal',
  curtain: 'Curtain',
  elastic: 'Elastic',
  cascade: 'Cascade',
  flip: 'Flip Deck',
  scanline: 'Scanline & Clear',
  blueprint: 'Blueprint Draw & Erase',
  hinge: 'Hinge & Drop Hinge',
  gravity: 'Gravity & Zero-G',
  pixelate: 'Pixelate & Depixelate',
  glitch: 'Glitch Assemble & Signal Lost',
  transmission: 'Transmission & Cut',
};

const recipes = [
  {
    id: 'blueprint-draft',
    name: 'Blueprint Draft',
    note: 'Construct in, then rub away from the top-left.',
    presetIn: 'blueprint',
    presetOut: 'blueprint',
    direction: 'left',
    duration: 1100,
    interval: 90,
    offset: 58,
    blur: 3,
    rotate: 20,
    origin: 'top left',
    target: 'component',
  },
  {
    id: 'terminal-scan',
    name: 'Terminal Scan',
    note: 'Directional scanline reveal with a clean sweep out.',
    presetIn: 'scanline',
    presetOut: 'scanline',
    direction: 'up',
    duration: 700,
    interval: 70,
    offset: 52,
    blur: 2,
    rotate: 0,
    origin: 'center',
    target: 'page',
  },
  {
    id: 'drop-hinge',
    name: 'Drop Hinge',
    note: 'Swing open, lose the corner, then fall into the void.',
    presetIn: 'hinge',
    presetOut: 'hinge',
    direction: 'left',
    duration: 950,
    interval: 90,
    offset: 72,
    blur: 8,
    rotate: 35,
    origin: 'top left',
    target: 'component',
  },
  {
    id: 'heavy-zero-g',
    name: 'Heavy / Zero-G',
    note: 'Weighted impact in, slow weightless drift out.',
    presetIn: 'gravity',
    presetOut: 'gravity',
    direction: 'down',
    duration: 900,
    interval: 85,
    offset: 64,
    blur: 8,
    rotate: 24,
    origin: 'center',
    target: 'component',
  },
  {
    id: 'pixel-boot',
    name: 'Pixel Boot',
    note: 'Resolve from coarse digital blocks, then break apart.',
    presetIn: 'pixelate',
    presetOut: 'pixelate',
    direction: 'left',
    duration: 760,
    interval: 65,
    offset: 64,
    blur: 5,
    rotate: 0,
    origin: 'center',
    target: 'component',
  },
  {
    id: 'glitch-signal-lost',
    name: 'Glitch / Signal Lost',
    note: 'Assemble from fixed glitch fragments, lose signal on exit.',
    presetIn: 'glitch',
    presetOut: 'glitch',
    direction: 'left',
    duration: 720,
    interval: 55,
    offset: 62,
    blur: 7,
    rotate: 0,
    origin: 'center',
    target: 'component',
  },
  {
    id: 'transmission-feed',
    name: 'Transmission Feed',
    note: 'Receive the interface in horizontal data bands.',
    presetIn: 'transmission',
    presetOut: 'transmission',
    direction: 'down',
    duration: 820,
    interval: 55,
    offset: 58,
    blur: 4,
    rotate: 0,
    origin: 'center',
    target: 'page',
  },
  {
    id: 'terminal-failure',
    name: 'Terminal Failure',
    note: 'Transmission arrives cleanly, then the signal tears apart.',
    presetIn: 'transmission',
    presetOut: 'glitch',
    direction: 'down',
    duration: 800,
    interval: 45,
    offset: 70,
    blur: 8,
    rotate: 0,
    origin: 'center',
    target: 'page',
  },
];

for (const preset of presets) {
  for (const select of [inSelect, outSelect])
    select.add(new Option(labels[preset], preset));
}

inSelect.value = 'slide';
outSelect.value = 'form';

/** Read the current configuration from the studio controls. */
const state = () => ({
  presetIn: inSelect.value,
  presetOut: outSelect.value,
  direction: $('#direction').value,
  duration: +$('#duration').value,
  interval: +$('#stagger').value,
  offset: +$('#offset').value,
  blur: +$('#blur').value,
  rotate: +$('#rotate').value,
  origin: $('#origin').value,
  target: document.querySelector('input[name=target]:checked').value,
});

let locked = false;
let snippet = '';

/** Return every preview shell that can receive public motion tuning properties. */
function previewNodes() {
  return document.querySelectorAll('#mock-page, #preview-card, .tile');
}

/** Apply public custom-property tuning without changing runtime ownership. */
function applyTuning(config) {
  for (const node of previewNodes()) {
    node.style.setProperty('--ms-offset', `${config.offset}px`);
    node.style.setProperty('--ms-blur', `${config.blur}px`);
    node.style.setProperty('--ms-rotate', `${config.rotate}deg`);
    node.style.setProperty('--ms-origin', config.origin);
    node.style.setProperty(
      '--ms-gravity-distance',
      `${Math.max(80, config.offset * 2)}px`,
    );
    node.style.setProperty(
      '--ms-pixel-size',
      `${Math.max(12, Math.round(config.offset / 2))}px`,
    );
    node.style.setProperty(
      '--ms-glitch-shift',
      `${Math.max(4, Math.round(config.offset / 5))}px`,
    );
  }
}

/** Remove exact-recipe selection once the user starts tuning the loaded values. */
function clearRecipeSelection() {
  for (const button of document.querySelectorAll('.recipe-button'))
    button.setAttribute('aria-pressed', 'false');
}

/** Refresh preview selection and the copyable public-package example. */
function update() {
  const config = state();
  applyTuning(config);
  $('#duration-label').textContent = config.duration + 'ms';
  $('#stagger-label').textContent = config.interval + 'ms';
  $('#offset-label').textContent = config.offset + 'px';
  $('#blur-label').textContent = config.blur + 'px';
  $('#rotate-label').textContent = config.rotate + '°';
  $('#preview-card').hidden = config.target === 'group';
  $('#preview-group').hidden = config.target !== 'group';

  const selector =
    config.target === 'group'
      ? '.tile'
      : config.target === 'page'
        ? '#mock-page'
        : '#preview-card';
  const plural = config.target === 'group';
  const tuning = `const tuning = {
  '--ms-offset': '${config.offset}px',
  '--ms-blur': '${config.blur}px',
  '--ms-rotate': '${config.rotate}deg',
  '--ms-origin': '${config.origin}',
};`;
  snippet =
    `import { ${plural ? 'stagger' : 'enter, exit'} } from '@sanderson-technology-enterprises/motion-style-css';
import '@sanderson-technology-enterprises/motion-style-css/styles.css';

const target = document.querySelector${plural ? 'All' : ''}('${selector}');
${tuning}
for (const node of ${plural ? 'target' : '[target]'}) {
  for (const [property, value] of Object.entries(tuning))
    node.style.setProperty(property, value);
}
` +
    (plural
      ? `await stagger(target, { phase: 'out', preset: '${config.presetOut}', duration: ${config.duration}, interval: ${config.interval}, direction: '${config.direction}' });
await stagger(target, { phase: 'in', preset: '${config.presetIn}', duration: ${config.duration}, interval: ${config.interval}, direction: '${config.direction}' });`
      : `await exit(target, { preset: '${config.presetOut}', duration: ${config.duration}, direction: '${config.direction}' });
await enter(target, { preset: '${config.presetIn}', duration: ${config.duration}, direction: '${config.direction}' });`);
  $('#snippet').textContent = snippet;
}

/**
 * Play a phase or sequence while keeping the configuration stable until settlement.
 * @param {'in' | 'out' | 'both'} phase - Requested preview action.
 * @returns {Promise<void>} Resolves after updating the status and restoring controls.
 */
async function perform(phase) {
  if (locked) return;
  locked = true;
  const controls = document.querySelectorAll(
    '.controls select, .controls input, .actions button, .recipe-button',
  );
  for (const control of controls) control.disabled = true;
  const config = state();
  const opts = { duration: config.duration, direction: config.direction };
  const target =
    config.target === 'group'
      ? document.querySelectorAll('.tile')
      : config.target === 'page'
        ? $('#mock-page')
        : $('#preview-card');

  try {
    for (const step of phase === 'both' ? ['out', 'in'] : [phase]) {
      $('#status').textContent = step === 'in' ? 'ENTERING' : 'EXITING';
      const preset = step === 'in' ? config.presetIn : config.presetOut;
      if (config.target === 'group')
        await stagger(target, {
          ...opts,
          preset,
          phase: step,
          interval: config.interval,
        });
      else
        await (step === 'in' ? enter : exit)(target, {
          ...opts,
          preset,
        });
    }
    $('#status').textContent = 'COMPLETE';
  } catch (error) {
    $('#status').textContent = 'ERROR — reset the target and try again';
    console.error(error);
  } finally {
    locked = false;
    for (const control of controls) control.disabled = false;
  }
}

/** Reset target visibility and cancel any in-flight preview work. */
function resetPreview() {
  for (const node of previewNodes()) {
    cancel(node);
    node.removeAttribute('data-ms-exited');
  }
  $('#status').textContent = 'READY';
}

/** Load a named recipe into the same editable controls used by manual configuration. */
function loadRecipe(recipe) {
  inSelect.value = recipe.presetIn;
  outSelect.value = recipe.presetOut;
  $('#direction').value = recipe.direction;
  $('#duration').value = String(recipe.duration);
  $('#stagger').value = String(recipe.interval);
  $('#offset').value = String(recipe.offset);
  $('#blur').value = String(recipe.blur);
  $('#rotate').value = String(recipe.rotate);
  $('#origin').value = recipe.origin;
  document.querySelector(
    `input[name=target][value="${recipe.target}"]`,
  ).checked = true;

  for (const button of document.querySelectorAll('.recipe-button'))
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.recipe === recipe.id),
    );

  resetPreview();
  update();
  $('#status').textContent = `${recipe.name.toUpperCase()} LOADED`;
}

for (const recipe of recipes) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'recipe-button';
  button.dataset.recipe = recipe.id;
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `<strong>${recipe.name}</strong><span>${recipe.note}</span>`;
  button.addEventListener('click', async () => {
    if (locked) return;
    loadRecipe(recipe);
    await perform('both');
  });
  $('#recipes').append(button);
}

for (const control of document.querySelectorAll(
  '.controls select, .controls input',
))
  control.addEventListener('change', () => {
    clearRecipeSelection();
    update();
  });

for (const control of document.querySelectorAll('input[name=target]')) {
  control.addEventListener('change', resetPreview);
}

for (const control of document.querySelectorAll('input[type=range]'))
  control.addEventListener('input', () => {
    clearRecipeSelection();
    update();
  });

$('#play').addEventListener('click', () => perform('both'));
$('#in').addEventListener('click', () => perform('in'));
$('#out').addEventListener('click', () => perform('out'));
$('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(snippet);
    $('#copy').textContent = 'Copied ✓';
  } catch {
    $('#copy').textContent = 'Select code to copy';
  }
  setTimeout(() => {
    $('#copy').textContent = 'Copy snippet';
  }, 1200);
});

update();
