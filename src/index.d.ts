/** HTML and SVG shells expose the inline styles required by the controller. */
export type MotionElement = HTMLElement | SVGElement;
export type Preset =
  | 'form'
  | 'slide'
  | 'swirl'
  | 'slam'
  | 'origami'
  | 'portal'
  | 'curtain'
  | 'elastic'
  | 'cascade'
  | 'flip';
export type Direction = 'left' | 'right' | 'up' | 'down';
export type Phase = 'in' | 'out';
export type MotionResult = { status: 'finished' | 'cancelled' | 'skipped' };
export interface MotionOptions {
  preset?: Preset;
  phase?: Phase;
  direction?: Direction;
  /** Milliseconds in the inclusive range 0?60000. Zero skips motion. */
  duration?: number;
  /** Milliseconds in the inclusive range 0?60000. */
  delay?: number;
  easing?: string;
  /** Skip JavaScript phases for reduced motion; CSS always honors the preference. */
  respectReducedMotion?: boolean;
}
export interface StaggerOptions extends MotionOptions {
  interval?: number;
}
export interface ReplaceOptions extends Omit<
  MotionOptions,
  'preset' | 'phase'
> {
  in?: Preset;
  out?: Preset;
}
export declare const presets: readonly Preset[];
export declare function animate(
  element: MotionElement,
  options?: MotionOptions,
): Promise<MotionResult>;
export declare function enter(
  element: MotionElement,
  options?: MotionOptions,
): Promise<MotionResult>;
export declare function exit(
  element: MotionElement,
  options?: MotionOptions,
): Promise<MotionResult>;
export declare function cancel(element: MotionElement): boolean;
export declare function stagger(
  elements: Iterable<MotionElement>,
  options?: StaggerOptions,
): Promise<MotionResult[]>;
export declare function replace(
  element: MotionElement,
  swap: () => unknown | Promise<unknown>,
  options?: ReplaceOptions,
): Promise<{ out: MotionResult; in: MotionResult }>;
