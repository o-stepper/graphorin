/**
 * Workflow dynamic-task primitive. A node returns one or more
 * `Dispatch(nodeName, args)` values to schedule additional tasks in the
 * next execution step.
 *
 * The class is intentionally tiny - the engine inspects only the public
 * `nodeName` and `args` fields. The shape is **Graphorin's own design**
 * (the name `Dispatch` is part of the public API).
 *
 * @stable
 */
export class Dispatch<TArgs = unknown> {
  /**
   * Cross-realm brand: the engine's structural fallback
   * requires this marker so a plain state object that happens to carry
   * `nodeName` + `args` keys is treated as channel WRITES, never
   * silently swallowed as a dispatch. A plain own property (not a
   * symbol) so it survives `structuredClone` across worker boundaries.
   */
  readonly __graphorinDispatch: true = true;
  readonly nodeName: string;
  readonly args: TArgs;

  constructor(nodeName: string, args: TArgs) {
    this.nodeName = nodeName;
    this.args = args;
  }
}

/**
 * Convenience factory equivalent to `new Dispatch(nodeName, args)`.
 *
 * @stable
 */
export function dispatch<TArgs>(nodeName: string, args: TArgs): Dispatch<TArgs> {
  return new Dispatch(nodeName, args);
}
