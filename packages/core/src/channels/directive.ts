/**
 * Workflow control-flow primitive: a single value handed to
 * `Workflow.resume(threadId, directive?)` (or returned from a node's
 * `pause(...)` resolution) carrying any combination of:
 *
 * - `goto`   — jump to a named node, bypassing the edge graph.
 *   **Destructive (workflow-09):** the restored frontier is discarded —
 *   surviving dynamic tasks, completed-but-unwalked nodes, and every
 *   pending pause record (including already-delivered pause answers)
 *   are dropped in favour of the single goto task. Use it as an
 *   operator escape hatch, not routine control flow.
 * - `resume` — value supplied to the `pause(value)` call that suspended.
 * - `update` — additional channel writes applied before the next step.
 *
 * The shape is **Graphorin's own design** (the name `Directive` is part
 * of the public API).
 *
 * @stable
 */
export class Directive<TUpdate = Record<string, unknown>, TResume = unknown> {
  readonly goto?: string;
  readonly resume?: TResume;
  readonly update?: TUpdate;

  constructor(opts: DirectiveOptions<TUpdate, TResume>) {
    if (opts.goto !== undefined) this.goto = opts.goto;
    if ('resume' in opts && opts.resume !== undefined) this.resume = opts.resume;
    if (opts.update !== undefined) this.update = opts.update;
  }
}

/**
 * Constructor parameters for `Directive`.
 *
 * @stable
 */
export interface DirectiveOptions<TUpdate = Record<string, unknown>, TResume = unknown> {
  readonly goto?: string;
  readonly resume?: TResume;
  readonly update?: TUpdate;
}
