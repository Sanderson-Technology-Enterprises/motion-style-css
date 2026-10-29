/**
 * @typedef {'form'|'slide'|'swirl'|'slam'|'origami'|'portal'|'curtain'|'elastic'|'cascade'|'flip'} Preset
 */
/**
 * @typedef {object} MotionResult
 * @property {'finished'|'cancelled'|'skipped'} status - Phase outcome.
 */
/**
 * @typedef {object} MotionOptions
 * @property {Preset} [preset='form'] - Paired animation family.
 * @property {'in'|'out'} [phase='in'] - Animation phase.
 * @property {'left'|'right'|'up'|'down'} [direction='left'] - Slide or curtain direction.
 * @property {number} [duration=600] - Duration in milliseconds, from 0 through 60000.
 * @property {number} [delay=0] - Delay in milliseconds, from 0 through 60000.
 * @property {string} [easing='cubic-bezier(.2,.8,.2,1)'] - CSS timing function.
 * @property {boolean} [respectReducedMotion=true] - Skip JS phases when the preference is reduced; CSS always honors that preference.
 */
/**
 * @typedef {object} StaggerOptions
 * @property {number} [interval=85] - Delay between elements, from 0 through 60000ms.
 * @property {Preset} [preset='form'] - Paired animation family.
 * @property {'in'|'out'} [phase='in'] - Shared phase.
 * @property {'left'|'right'|'up'|'down'} [direction='left'] - Shared direction.
 * @property {number} [duration=600] - Shared duration in milliseconds.
 * @property {number} [delay=0] - Initial delay in milliseconds.
 * @property {string} [easing] - CSS timing function.
 * @property {boolean} [respectReducedMotion=true] - Skip JS phases when reduced motion is preferred.
 */
/**
 * @typedef {object} ReplaceOptions
 * @property {Preset} [in='form'] - Entrance preset.
 * @property {Preset} [out='form'] - Exit preset.
 * @property {'left'|'right'|'up'|'down'} [direction='left'] - Shared direction.
 * @property {number} [duration=600] - Each phase duration in milliseconds.
 * @property {number} [delay=0] - Each phase delay in milliseconds.
 * @property {string} [easing] - CSS timing function.
 * @property {boolean} [respectReducedMotion=true] - Skip JS phases when reduced motion is preferred.
 */
/**
 * @typedef {object} ReplaceResult
 * @property {MotionResult} out - Exit result.
 * @property {MotionResult} in - Entrance result.
 */

/**
 * Supported paired entrance and exit presets. The array is immutable.
 * @type {ReadonlyArray<Preset>}
 */
export const presets = Object.freeze([
  'form',
  'slide',
  'swirl',
  'slam',
  'origami',
  'portal',
  'curtain',
  'elastic',
  'cascade',
  'flip',
]);
const directions = new Set(['left', 'right', 'up', 'down']);
const active = new WeakMap();
const replacements = new WeakMap();
const requests = new WeakMap();

/**
 * Validate the DOM surface before cancellation or any element mutation.
 * @param {HTMLElement | SVGElement} element - Candidate motion shell.
 * @returns {void}
 * @throws {TypeError} When required DOM methods are missing.
 * @private
 */
function assertElement(element) {
  if (
    !element ||
    !element.dataset ||
    ![
      'addEventListener',
      'removeEventListener',
      'dispatchEvent',
      'getAttribute',
      'setAttribute',
      'removeAttribute',
    ].every((key) => typeof element[key] === 'function') ||
    ![
      'setProperty',
      'getPropertyValue',
      'getPropertyPriority',
      'removeProperty',
    ].every((key) => typeof element.style?.[key] === 'function') ||
    !['add', 'remove', 'contains'].every(
      (key) => typeof element.classList?.[key] === 'function',
    )
  ) {
    throw new TypeError('Expected a DOM element');
  }
}

/**
 * Validate options and fill deterministic defaults without modifying the element.
 * @param {MotionOptions} [options={}] - Requested phase options.
 * @returns {object} Normalized options.
 * @throws {TypeError} When easing is not a non-empty string.
 * @throws {RangeError} When a preset, phase, direction, or timing is invalid.
 * @private
 */
function normalize(options = {}) {
  const preset = options.preset ?? 'form';
  const phase = options.phase ?? 'in';
  const direction = options.direction ?? 'left';
  const duration = options.duration ?? 600;
  const delay = options.delay ?? 0;
  const easing = options.easing ?? 'cubic-bezier(.2,.8,.2,1)';
  if (typeof easing !== 'string' || !easing.trim())
    throw new TypeError('easing must be a non-empty CSS timing function');
  if (!presets.includes(preset))
    throw new RangeError(`Unknown motion preset: ${preset}`);
  if (phase !== 'in' && phase !== 'out')
    throw new RangeError(`Unknown phase: ${phase}`);
  if (!directions.has(direction))
    throw new RangeError(`Unknown direction: ${direction}`);
  if (!Number.isFinite(duration) || duration < 0 || duration > 60000)
    throw new RangeError('duration must be 0–60000 ms');
  if (!Number.isFinite(delay) || delay < 0 || delay > 60000)
    throw new RangeError('delay must be 0–60000 ms');
  return {
    preset,
    phase,
    direction,
    duration,
    delay,
    easing,
    respectReducedMotion: options.respectReducedMotion !== false,
  };
}

/**
 * Read motion preference from the target document, including iframe consumers.
 * @param {HTMLElement | SVGElement} element - Motion shell.
 * @returns {boolean} Whether its document requests reduced motion.
 * @private
 */
function reduced(element) {
  const view =
    element.ownerDocument?.defaultView ??
    (typeof window === 'undefined' ? undefined : window);
  return Boolean(
    view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
}

/**
 * Resolve the primary keyframe name, excluding component and decorative animations.
 * @param {object} config - Normalized motion options.
 * @returns {string} The keyframe name owned by this operation.
 * @private
 */
function animationName(config) {
  if (config.preset === 'slam' && config.phase === 'out') return 'ms-boom-out';
  return `ms-${config.preset}-${config.phase}${config.preset === 'curtain' ? `-${config.direction}` : ''}`;
}

/**
 * Cancel an animation or pending replacement. An already-running swap callback
 * cannot be aborted; its eventual completion will not start a stale entrance.
 * @param {HTMLElement | SVGElement} element - Motion shell.
 * @returns {boolean} Whether an animation or replacement was cancelled.
 * @throws {TypeError} When the target is not a supported element.
 */
export function cancel(element) {
  assertElement(element);
  requests.set(element, {});
  return cancelCurrent(element);
}

/**
 * Cancel the current owner while allowing lifecycle listeners to make a newer request.
 * @param {HTMLElement | SVGElement} element - The motion shell.
 * @returns {boolean} Whether an operation was cancelled.
 * @private
 */
function cancelCurrent(element) {
  const task = active.get(element);
  const replacement = replacements.get(element);
  if (replacement) {
    replacement.cancelled = true;
    replacements.delete(element);
  }
  if (task) task.finish('cancelled');
  return Boolean(task || replacement);
}

/**
 * Claim an element before cancellation events can invoke another public operation.
 * @param {HTMLElement | SVGElement} element - The validated motion shell.
 * @returns {boolean} Whether this request still owns the element after cancellation.
 * @private
 */
function claim(element) {
  const request = {};
  requests.set(element, request);
  cancelCurrent(element);
  return requests.get(element) === request;
}

/**
 * Animate an existing shell, restoring its inline motion properties, attributes,
 * and class on completion or cancellation. Exit retains data-ms-exited="true";
 * entry clears it. Missing styles or suppressed animation use a timing fallback.
 * Running phases emit ms:start and ms:finish; skipped phases emit neither event.
 * @param {HTMLElement | SVGElement} element - Target shell; wrap component transforms.
 * @param {MotionOptions} [options={}] - Preset, phase, direction, timing, and easing.
 * @returns {Promise<MotionResult>} Finished, cancelled, or skipped status.
 * @throws {TypeError} When the target or easing is invalid.
 * @throws {RangeError} When a preset, direction, phase, duration, or delay is invalid.
 */
export function animate(element, options = {}) {
  assertElement(element);
  const config = normalize(options);
  if (!claim(element)) return Promise.resolve({ status: 'cancelled' });
  return runMotion(element, config);
}

/**
 * Run one validated phase without cancelling its owning replacement operation.
 * @param {HTMLElement | SVGElement} element - The motion shell.
 * @param {object} config - Validated options for this phase.
 * @returns {Promise<object>} Completion status.
 * @private
 */
function runMotion(element, config) {
  if (
    (config.respectReducedMotion && reduced(element)) ||
    config.duration === 0
  ) {
    if (config.phase === 'out') element.setAttribute('data-ms-exited', 'true');
    else element.removeAttribute('data-ms-exited');
    return Promise.resolve({ status: 'skipped' });
  }

  return new Promise((resolve) => {
    const owned = ['--ms-duration', '--ms-delay', '--ms-ease'];
    const originals = owned.map((k) => [
      k,
      element.style.getPropertyValue(k),
      element.style.getPropertyPriority(k),
    ]);
    const originalClass = element.classList.contains('ms-motion');
    const original = {
      preset: element.getAttribute('data-ms-preset'),
      phase: element.getAttribute('data-ms-phase'),
      direction: element.getAttribute('data-ms-direction'),
    };
    let timeout;
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      element.removeEventListener('animationend', onEnd);
      element.removeEventListener('animationcancel', onCancel);
      for (const [key, value, priority] of originals) {
        if (value) element.style.setProperty(key, value, priority);
        else element.style.removeProperty(key);
      }
      for (const [key, value] of Object.entries(original)) {
        if (value === null) element.removeAttribute(`data-ms-${key}`);
        else element.setAttribute(`data-ms-${key}`, value);
      }
      if (!originalClass) element.classList.remove('ms-motion');
    };
    const finish = (status) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (status === 'finished') {
        if (config.phase === 'out')
          element.setAttribute('data-ms-exited', 'true');
        else element.removeAttribute('data-ms-exited');
      }
      if (active.get(element)?.finish === finish) active.delete(element);
      const EventClass =
        element.ownerDocument?.defaultView?.CustomEvent ?? CustomEvent;
      element.dispatchEvent(
        new EventClass('ms:finish', {
          detail: { status, preset: config.preset, phase: config.phase },
        }),
      );
      resolve({ status });
    };
    const ownsEvent = (event) =>
      event.target === element &&
      !event.pseudoElement &&
      event.animationName === animationName(config);
    const onEnd = (event) => {
      if (ownsEvent(event)) finish('finished');
    };
    const onCancel = (event) => {
      if (ownsEvent(event)) finish('cancelled');
    };
    active.set(element, { finish });
    if (config.phase === 'in') element.removeAttribute('data-ms-exited');
    element.classList.add('ms-motion');
    element.style.setProperty('--ms-duration', `${config.duration}ms`);
    element.style.setProperty('--ms-delay', `${config.delay}ms`);
    element.style.setProperty('--ms-ease', config.easing);
    /** Flush the previous phase so identical consecutive requests restart. */
    element.removeAttribute('data-ms-phase');
    void element.offsetWidth;
    element.dataset.msPreset = config.preset;
    element.dataset.msDirection = config.direction;
    element.dataset.msPhase = config.phase;
    element.addEventListener('animationend', onEnd);
    element.addEventListener('animationcancel', onCancel);
    /** Assign before dispatch: a synchronous start listener may cancel immediately. */
    timeout = setTimeout(
      () => finish('finished'),
      config.duration + config.delay + 120,
    );
    const EventClass =
      element.ownerDocument?.defaultView?.CustomEvent ?? CustomEvent;
    element.dispatchEvent(
      new EventClass('ms:start', {
        detail: { preset: config.preset, phase: config.phase },
      }),
    );
  });
}

/**
 * Reveal a shell with an entrance phase; options.phase is ignored.
 * @param {HTMLElement | SVGElement} element - Target shell.
 * @param {MotionOptions} [options={}] - Motion configuration.
 * @returns {Promise<MotionResult>} Phase status.
 */
export function enter(element, options = {}) {
  return animate(element, { ...options, phase: 'in' });
}
/**
 * Exit a shell and retain visibility:hidden through data-ms-exited on success.
 * Does not remove nodes, navigate, or manage focus.
 * @param {HTMLElement | SVGElement} element - Target shell.
 * @param {MotionOptions} [options={}] - Motion configuration.
 * @returns {Promise<MotionResult>} Phase status.
 */
export function exit(element, options = {}) {
  return animate(element, { ...options, phase: 'out' });
}

/**
 * Animate a unique iterable of shells with delay + index * interval timing.
 * Validate all elements and computed delays before starting the first phase.
 * @param {Iterable<HTMLElement | SVGElement>} elements - Unique target shells.
 * @param {StaggerOptions} [options={}] - Motion options and interval (85ms by default).
 * @returns {Promise<Array<MotionResult>>} Statuses in input order.
 * @throws {TypeError} When the iterable contains invalid or duplicate elements.
 * @throws {RangeError} When any timing, including a computed delay, is outside 0–60000ms.
 */
export function stagger(elements, options = {}) {
  const { interval = 85, ...rest } = options;
  if (!Number.isFinite(interval) || interval < 0 || interval > 60000)
    throw new RangeError('interval must be 0–60000 ms');
  if (!elements || typeof elements[Symbol.iterator] !== 'function')
    throw new TypeError('elements must be iterable');
  const nodes = Array.from(elements);
  if (new Set(nodes).size !== nodes.length)
    throw new TypeError('elements must be unique');
  const config = normalize(rest);
  const configs = nodes.map((element, index) => {
    assertElement(element);
    return normalize({ ...config, delay: config.delay + index * interval });
  });
  return Promise.all(
    nodes.map((element, index) => animate(element, configs[index])),
  );
}

/**
 * Exit, await a content swap, then enter. Validate both phases before mutation.
 * Cancel or supersede a pending swap to prevent its stale entrance. Callback
 * rejection restores the original exit marker only while this operation owns it.
 * The host application retains responsibility for callback side effects and focus.
 * @param {HTMLElement | SVGElement} element - Persistent shell around swapped content.
 * @param {function(): (unknown | Promise<unknown>)} swap - Synchronous or asynchronous content callback.
 * @param {ReplaceOptions} [options={}] - Entrance/exit presets and shared options.
 * @returns {Promise<ReplaceResult>} Both phase statuses.
 * @throws {TypeError} When the shell or callback is invalid.
 * @throws {Error} Propagates callback errors after visibility recovery.
 */
export async function replace(element, swap, options = {}) {
  if (typeof swap !== 'function')
    throw new TypeError('swap must be a function');
  const { in: inPreset = 'form', out: outPreset = 'form', ...rest } = options;
  const outConfig = normalize({ ...rest, preset: outPreset, phase: 'out' });
  const inConfig = normalize({ ...rest, preset: inPreset, phase: 'in' });
  assertElement(element);
  if (!claim(element))
    return { out: { status: 'cancelled' }, in: { status: 'cancelled' } };
  const operation = { cancelled: false };
  const originalExited = element.getAttribute('data-ms-exited');
  replacements.set(element, operation);
  try {
    const out = await runMotion(element, outConfig);
    if (out.status === 'cancelled' || operation.cancelled)
      return { out, in: { status: 'cancelled' } };
    await swap();
    if (operation.cancelled) return { out, in: { status: 'cancelled' } };
    const inside = await runMotion(element, inConfig);
    return { out, in: inside };
  } catch (error) {
    if (replacements.get(element) === operation) {
      if (originalExited === null) element.removeAttribute('data-ms-exited');
      else element.setAttribute('data-ms-exited', originalExited);
    }
    throw error;
  } finally {
    if (replacements.get(element) === operation) replacements.delete(element);
  }
}
