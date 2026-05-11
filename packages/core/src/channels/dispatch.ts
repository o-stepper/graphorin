/**
 * Workflow dynamic-task primitive. A node returns one or more
 * `Dispatch(nodeName, args)` values to schedule additional tasks in the
 * next execution step.
 *
 * The class is intentionally tiny — the engine inspects only the public
 * `nodeName` and `args` fields. The shape is **Graphorin's own design**
 * (the name `Dispatch` is part of the public API).
 *
 * @stable
 */
export class Dispatch<TArgs = unknown> {
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
