/**
 * Interactive demonstration and snippet builder for Motion Style CSS.
 *
 * The playground reads native form controls, applies the selected visual tuning
 * as public CSS custom properties, and delegates lifecycle ownership to the
 * package's `enter`, `exit`, `stagger`, and `cancel` functions. To use it:
 *
 * 1. Choose independent entrance and exit presets.
 * 2. Tune direction, timing, distance, blur, rotation, and transform origin.
 * 3. Choose a component, group, or page target. Stagger timing affects only the
 *    group target; the other targets use one `enter` or `exit` operation.
 * 4. Play either phase or the complete exit/entrance sequence, then copy the
 *    generated package example.
 * 5. Optionally load a starter recipe. A recipe replaces every control value and
 *    remains selected only until a control is edited.
 *
 * The distance control also derives safe values for gravity travel, pixel block
 * size, and glitch displacement. Blur, rotation, and transform origin are public
 * CSS tuning values, so presets that do not consume a value safely ignore it.
 * Reduced-motion behavior remains owned by the library and is honored
 * automatically. Both HTML entry points scope `ui-style-kit-icons` to the Neo Noir
 * family and Midnight Gold dark paint. The published Neo Noir visual preset
 * supplies square panels, transport controls, native inputs, and film texture;
 * layout-style-css supplies the responsive workspace and recipe grid. Playback
 * controls use the icon package's theme-aware custom element and public `size`
 * attribute instead of text glyphs. Interactive Surface owns the outer button,
 * while a separate inner span preserves Neo Noir's decorative button face.
 * Navigation, playback, preview chrome, clipboard, footer, and select chevrons
 * all use 24px icons. Selects retain native keyboard and form behavior; their
 * decorative library chevrons ignore pointer events so clicks reach the select.
 *
 * @module PlaygroundDemo
 */

/**
 * A paired entrance/exit animation family exposed by Motion Style CSS.
 * @typedef {'form'|'slide'|'swirl'|'slam'|'origami'|'portal'|'curtain'|'elastic'|'cascade'|'flip'|'scanline'|'blueprint'|'hinge'|'gravity'|'pixelate'|'glitch'|'transmission'} PlaygroundPreset
 */

/**
 * A supported directional orientation.
 * @typedef {'left'|'right'|'up'|'down'} PlaygroundDirection
 */

/**
 * A transform-origin value offered by the playground.
 * @typedef {'center'|'top left'|'top center'|'top right'|'center left'|'center right'|'bottom left'|'bottom center'|'bottom right'} PlaygroundOrigin
 */

/**
 * The preview surface controlled by a motion operation.
 * @typedef {'component'|'group'|'page'} PlaygroundTarget
 */

/**
 * Editable values read from the playground controls.
 * @typedef {object} PlaygroundConfiguration
 * @property {PlaygroundPreset} [presetIn='slide'] - Entrance preset; used only by entrance phases.
 * @property {PlaygroundPreset} [presetOut='form'] - Exit preset; used only by exit phases.
 * @property {PlaygroundDirection} [direction='left'] - Shared orientation for both phases; presets without directional keyframes may ignore it.
 * @property {number} [duration=750] - Duration of each phase in milliseconds, from 150 through 1800 in 50ms increments.
 * @property {number} [interval=90] - Delay in milliseconds between group items, from 0 through 250 in 10ms increments; ignored for component and page targets.
 * @property {number} [offset=58] - Base travel distance in pixels, from 16 through 140 in 2px increments; also derives gravity distance, pixel size, and glitch shift.
 * @property {number} [blur=12] - Maximum blur in pixels, from 0 through 24; consumed only by presets whose CSS references `--ms-blur`.
 * @property {number} [rotate=225] - Rotation in degrees, from 0 through 360 in 5-degree increments; consumed only by rotational presets.
 * @property {PlaygroundOrigin} [origin='center'] - CSS transform origin shared by preview shells.
 * @property {PlaygroundTarget} [target='component'] - Operation surface; `group` switches playback and snippets from `enter`/`exit` to `stagger`.
 */

/**
 * A complete starter configuration displayed by the recipe picker.
 * @typedef {object} PlaygroundRecipe
 * @property {string} id - Stable identifier stored on the recipe button.
 * @property {string} name - Human-readable recipe name.
 * @property {string} note - Concise description of the intended motion sequence.
 * @property {PlaygroundPreset} presetIn - Entrance preset loaded into the control room.
 * @property {PlaygroundPreset} presetOut - Exit preset loaded into the control room.
 * @property {PlaygroundDirection} direction - Shared entrance and exit orientation.
 * @property {number} duration - Per-phase duration in milliseconds.
 * @property {number} interval - Group stagger interval in milliseconds; retained but inactive for component and page targets.
 * @property {number} offset - Base travel distance and source for derived gravity, pixel, and glitch tuning.
 * @property {number} blur - Blur radius in pixels for compatible presets.
 * @property {number} rotate - Rotation in degrees for compatible presets.
 * @property {PlaygroundOrigin} origin - CSS transform origin.
 * @property {PlaygroundTarget} target - Preview and generated-snippet operation surface.
 */

/**
 * DOM controls that make up the playground's public configuration surface.
 * @typedef {object} PlaygroundControls
 * @property {HTMLSelectElement} presetIn - `#preset-in`; accepts a `PlaygroundPreset`, defaults to `slide`, and affects entrance phases only.
 * @property {HTMLSelectElement} presetOut - `#preset-out`; accepts a `PlaygroundPreset`, defaults to `form`, and affects exit phases only.
 * @property {HTMLSelectElement} direction - `#direction`; accepts a `PlaygroundDirection`, defaults to `left`, and is shared by both phases.
 * @property {HTMLInputElement} duration - `#duration`; numeric 150-1800ms range, default `750`, applied independently to every phase.
 * @property {HTMLInputElement} interval - `#stagger`; numeric 0-250ms range, default `90`, active only when target is `group`.
 * @property {HTMLInputElement} offset - `#offset`; numeric 16-140px range, default `58`, and the source for several derived preset variables.
 * @property {HTMLInputElement} blur - `#blur`; numeric 0-24px range, default `12`, used only by compatible preset CSS.
 * @property {HTMLInputElement} rotate - `#rotate`; numeric 0-360-degree range, default `225`, used only by compatible preset CSS.
 * @property {HTMLSelectElement} origin - `#origin`; accepts a `PlaygroundOrigin`, defaults to `center`, and is applied to every preview shell.
 * @property {NodeListOf<HTMLInputElement>} target - `input[name=target]`; component, group, or page radio group defaulting to `component`.
 * @property {HTMLButtonElement} play - `#play`; runs the configured exit and then entrance.
 * @property {HTMLButtonElement} enter - `#in`; runs only the configured entrance.
 * @property {HTMLButtonElement} exit - `#out`; runs only the configured exit.
 * @property {HTMLButtonElement} copy - `#copy`; writes the current generated snippet to the clipboard.
 */
import { presets, enter, exit, stagger, cancel } from '../src/index.js';

/**
 * Select the first document element matching a CSS selector.
 * @param {string} selector - Valid CSS selector for a required playground element.
 * @returns {Element | null} Matching element, or `null` when the markup contract is broken.
 */
function $(selector) {
  return document.querySelector(selector);
}

/** Entrance-preset select; defaults to `slide` after preset options are loaded. */
const inSelect = $('#preset-in');

/** Exit-preset select; defaults to `form` after preset options are loaded. */
const outSelect = $('#preset-out');

/**
 * User-facing labels for every package preset.
 *
 * - `form`: softly form or dissolve the target.
 * - `slide`: travel from or retreat toward the selected direction.
 * - `swirl`: combine rotation with depth and blur.
 * - `slam`: enter with impact and exit with an explosive boom.
 * - `origami`: fold the target through a transform-origin-aware plane.
 * - `portal`: pass through a scaled, blurred depth transition.
 * - `curtain`: reveal or conceal along the selected direction.
 * - `elastic`: overshoot on entry and recoil on exit.
 * - `cascade`: layer translated and rotated movement.
 * - `flip`: turn the target like a card deck.
 * - `scanline`: scan in or clear along the selected direction.
 * - `blueprint`: draw construction lines or erase the target.
 * - `hinge`: swing around the configured transform origin and drop away.
 * - `gravity`: land with weight or drift out in zero gravity.
 * - `pixelate`: resolve from or break into blocks derived from distance.
 * - `glitch`: assemble or lose the signal using distance-derived shifts.
 * - `transmission`: reveal or cut the target in horizontal data bands.
 *
 * @type {Record<PlaygroundPreset, string>}
 */
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

/**
 * Tuned starter recipes. Every recipe supplies all `PlaygroundConfiguration`
 * fields, so loading one replaces the complete current configuration.
 *
 * | Recipe | In / out | Direction | Duration / interval | Offset / blur / rotation | Origin | Target |
 * | --- | --- | --- | --- | --- | --- | --- |
 * | Blueprint Draft | blueprint / blueprint | left | 1100ms / 90ms | 58px / 3px / 20deg | top left | component |
 * | Terminal Scan | scanline / scanline | up | 700ms / 70ms | 52px / 2px / 0deg | center | page |
 * | Drop Hinge | hinge / hinge | left | 950ms / 90ms | 72px / 8px / 35deg | top left | component |
 * | Heavy / Zero-G | gravity / gravity | down | 900ms / 85ms | 64px / 8px / 24deg | center | component |
 * | Pixel Boot | pixelate / pixelate | left | 760ms / 65ms | 64px / 5px / 0deg | center | component |
 * | Glitch / Signal Lost | glitch / glitch | left | 720ms / 55ms | 62px / 7px / 0deg | center | component |
 * | Transmission Feed | transmission / transmission | down | 820ms / 55ms | 58px / 4px / 0deg | center | page |
 * | Terminal Failure | transmission / glitch | down | 800ms / 45ms | 70px / 8px / 0deg | center | page |
 *
 * `interval` remains part of component and page recipes so switching the target
 * to `group` immediately produces the recipe's intended choreography.
 *
 * @type {ReadonlyArray<PlaygroundRecipe>}
 */
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

/**
 * Read and normalize the current configuration from native form controls.
 * @returns {PlaygroundConfiguration} Complete configuration using the defaults
 * declared by the playground markup or the most recently loaded recipe.
 */
function state() {
  return {
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
  };
}

/** Whether a preview sequence currently owns the controls. */
let locked = false;

/** Latest package usage example rendered from the current configuration. */
let snippet = '';

/**
 * Return every preview shell that can receive public motion tuning properties.
 * @returns {NodeListOf<HTMLElement>} Page, component, and group preview shells.
 */
function previewNodes() {
  return document.querySelectorAll('#mock-page, #preview-card, .tile');
}

/**
 * Apply public custom-property tuning without changing runtime ownership.
 * Gravity distance is at least 80px, pixel size is at least 12px, and glitch
 * shift is at least 4px; all three scale from `config.offset`.
 * @param {PlaygroundConfiguration} config - Current control values.
 * @returns {void}
 */
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

/**
 * Remove exact-recipe selection once the user starts tuning loaded values.
 * @returns {void}
 */
function clearRecipeSelection() {
  for (const button of document.querySelectorAll('.recipe-button'))
    button.setAttribute('aria-pressed', 'false');
}

/**
 * Refresh visible output values, preview selection, tuning, and the copyable
 * public-package example. Group targets produce `stagger` calls; component and
 * page targets produce paired `enter` and `exit` calls.
 * Range-track fills follow the native control values through Neo Noir's public
 * `--noir-value` percentage hook; changing the visual preset does not alter motion.
 * @returns {void}
 */
function update() {
  const config = state();
  applyTuning(config);
  for (const input of document.querySelectorAll('input[type="range"]')) {
    /** Native range position expressed as a percentage from 0 to 100. @type {number} */
    const percentage =
      ((Number(input.value) - Number(input.min)) /
        (Number(input.max) - Number(input.min))) *
      100;
    input.style.setProperty('--noir-value', `${percentage}%`);
  }
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

/**
 * Reset target visibility and cancel any in-flight preview work.
 * @returns {void}
 */
function resetPreview() {
  for (const node of previewNodes()) {
    cancel(node);
    node.removeAttribute('data-ms-exited');
  }
  $('#status').textContent = 'READY';
}

/**
 * Load a recipe into the same editable controls used by manual configuration.
 * All configuration fields are replaced together, after which target visibility,
 * the preview snippet, and pressed-button state are synchronized.
 * @param {PlaygroundRecipe} recipe - Complete starter configuration to load.
 * @returns {void}
 */
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

/**
 * Play the recipe represented by a recipe-button activation.
 * @param {MouseEvent} event - Click event whose current target stores a recipe ID.
 * @returns {Promise<void>} Resolves when the recipe's exit/entrance sequence settles.
 */
async function activateRecipe(event) {
  if (locked) return;
  const recipe = recipes.find(
    (candidate) => candidate.id === event.currentTarget.dataset.recipe,
  );
  if (!recipe) return;
  loadRecipe(recipe);
  await perform('both');
}

/**
 * Build an accessible button for a complete starter recipe.
 * @param {PlaygroundRecipe} recipe - Recipe represented by the new button.
 * @returns {HTMLButtonElement} Button ready to insert into the recipe grid.
 */
function createRecipeButton(recipe) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'recipe-button interactive-surface';
  button.dataset.surfaceLevel = '1';
  button.dataset.recipe = recipe.id;
  button.setAttribute('aria-pressed', 'false');
  button.innerHTML = `<strong>${recipe.name}</strong><span>${recipe.note}</span>`;
  button.addEventListener('click', activateRecipe);
  return button;
}

/**
 * Re-render configuration-dependent output after a form edit.
 * @returns {void}
 */
function handleConfigurationChange() {
  clearRecipeSelection();
  update();
}

/**
 * Run the configured exit followed by its entrance.
 * @returns {Promise<void>} Resolves when both phases settle.
 */
function playSequence() {
  return perform('both');
}

/**
 * Run only the configured entrance.
 * @returns {Promise<void>} Resolves when the entrance settles.
 */
function playEntrance() {
  return perform('in');
}

/**
 * Run only the configured exit.
 * @returns {Promise<void>} Resolves when the exit settles.
 */
function playExit() {
  return perform('out');
}

/**
 * Restore the clipboard action's default label after transient feedback.
 * @returns {void}
 */
function restoreCopyLabel() {
  $('#copy-label').textContent = 'Copy snippet';
}

/**
 * Copy the latest generated package example and report clipboard availability.
 * @returns {Promise<void>} Resolves after feedback is displayed and reset is scheduled.
 */
async function copySnippet() {
  try {
    await navigator.clipboard.writeText(snippet);
    $('#copy-label').textContent = 'Copied ✓';
  } catch {
    $('#copy-label').textContent = 'Select code to copy';
  }
  setTimeout(restoreCopyLabel, 1200);
}

for (const recipe of recipes) {
  $('#recipes').append(createRecipeButton(recipe));
}

for (const control of document.querySelectorAll(
  '.controls select, .controls input',
))
  control.addEventListener('change', handleConfigurationChange);

for (const control of document.querySelectorAll('input[name=target]')) {
  control.addEventListener('change', resetPreview);
}

for (const control of document.querySelectorAll('input[type=range]'))
  control.addEventListener('input', handleConfigurationChange);

$('#play').addEventListener('click', playSequence);
$('#in').addEventListener('click', playEntrance);
$('#out').addEventListener('click', playExit);
$('#copy').addEventListener('click', copySnippet);

update();
