import { presets, enter, exit, stagger, cancel } from '../src/index.js';
const $ = (s) => document.querySelector(s);
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
};
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
  target: document.querySelector('input[name=target]:checked').value,
});
let locked = false;
let snippet = '';
/** Refresh preview selection and the copyable public-package example. */
function update() {
  const s = state();
  $('#duration-label').textContent = s.duration + 'ms';
  $('#stagger-label').textContent = s.interval + 'ms';
  $('#preview-card').hidden = s.target === 'group';
  $('#preview-group').hidden = s.target !== 'group';
  const selector =
    s.target === 'group'
      ? '.tile'
      : s.target === 'page'
        ? '#mock-page'
        : '#preview-card';
  snippet =
    `import { ${s.target === 'group' ? 'stagger' : 'enter, exit'} } from '@sanderson-technology-enterprises/motion-style-css';
import '@sanderson-technology-enterprises/motion-style-css/styles.css';

const target = document.querySelector${s.target === 'group' ? 'All' : ''}('${selector}');
` +
    (s.target === 'group'
      ? `await stagger(target, { phase: 'out', preset: '${s.presetOut}', duration: ${s.duration}, interval: ${s.interval}, direction: '${s.direction}' });
await stagger(target, { phase: 'in', preset: '${s.presetIn}', duration: ${s.duration}, interval: ${s.interval}, direction: '${s.direction}' });`
      : `await exit(target, { preset: '${s.presetOut}', duration: ${s.duration}, direction: '${s.direction}' });
await enter(target, { preset: '${s.presetIn}', duration: ${s.duration}, direction: '${s.direction}' });`);
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
    '.controls select, .controls input, .actions button',
  );
  for (const control of controls) control.disabled = true;
  const s = state();
  const opts = { duration: s.duration, direction: s.direction };
  const target =
    s.target === 'group'
      ? document.querySelectorAll('.tile')
      : s.target === 'page'
        ? $('#mock-page')
        : $('#preview-card');
  try {
    for (const step of phase === 'both' ? ['out', 'in'] : [phase]) {
      $('#status').textContent = step === 'in' ? 'ENTERING' : 'EXITING';
      const preset = step === 'in' ? s.presetIn : s.presetOut;
      if (s.target === 'group')
        await stagger(target, {
          ...opts,
          preset,
          phase: step,
          interval: s.interval,
        });
      else await (step === 'in' ? enter : exit)(target, { ...opts, preset });
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
for (const control of document.querySelectorAll('select,input'))
  control.addEventListener('change', update);
for (const control of document.querySelectorAll('input[name=target]')) {
  control.addEventListener('change', () => {
    for (const node of document.querySelectorAll(
      '#mock-page, #preview-card, .tile',
    )) {
      cancel(node);
      node.removeAttribute('data-ms-exited');
    }
    $('#status').textContent = 'READY';
  });
}
for (const control of document.querySelectorAll('input[type=range]'))
  control.addEventListener('input', update);
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
