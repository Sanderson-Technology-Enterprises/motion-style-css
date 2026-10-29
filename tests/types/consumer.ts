import {
  animate,
  enter,
  exit,
  cancel,
  stagger,
  replace,
  presets,
  type MotionOptions,
  type MotionResult,
} from '@sanderson-technology-enterprises/motion-style-css';

const html = document.createElement('div');
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const options: MotionOptions = {
  preset: presets[0],
  direction: 'left',
  duration: 400,
};
const result: Promise<MotionResult> = animate(html, options);
void result;
void enter(svg);
void exit(html);
void cancel(svg);
void stagger(document.querySelectorAll<HTMLElement>('.tile'));
void replace(html, async () => {}, { in: 'slide', out: 'curtain' });
// @ts-expect-error Unknown presets must fail at the consumer boundary.
void enter(html, { preset: 'unknown' });
// @ts-expect-error Only HTML and SVG elements expose the required style surface.
void enter(document.createTextNode('text'));
// @ts-expect-error Generic XML elements do not supply CSS inline-style methods.
void enter(document.createElementNS('urn:example', 'node'));
// @ts-expect-error Duration uses milliseconds as a number.
void exit(html, { duration: '400ms' });
