/**
 * Typed error classes for `@graphorin/tools`.
 *
 * Every error carries a lowercase `kind` discriminator and (where
 * relevant) a human-readable `hint` field surfaced in CLI output. Never
 * throw plain `Error` from framework code - the runtime depends on the
 * `kind` discriminator to drive recovery / replay logic.
 *
 * @packageDocumentation
 */

/**
 * Common base for every `@graphorin/tools` error.
 *
 * @stable
 */
export class GraphorinToolsError extends Error {
  public readonly kind: string;
  public readonly hint?: string;
  public override readonly cause?: unknown;
  constructor(
    kind: string,
    message: string,
    opts: { readonly hint?: string; readonly cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'GraphorinToolsError';
    this.kind = kind;
    if (opts.hint !== undefined) this.hint = opts.hint;
    if (opts.cause !== undefined) this.cause = opts.cause;
  }
}

/**
 * Thrown when two registrations collide on the no-arguments
 * `ToolRegistry.assertNoDuplicates()` signature. First-party / inline
 * `tool({...})` collisions are programming errors that fail-fast.
 *
 * @stable
 */
export class DuplicateToolNameError extends GraphorinToolsError {
  public readonly toolName: string;
  constructor(toolName: string) {
    super(
      'duplicate-tool-name',
      `Duplicate tool name "${toolName}" registered. First-party tool collisions are programming errors and must be resolved before runtime.`,
      {
        hint: 'Rename one of the tools or use the strategy-aware ToolRegistry.assertNoDuplicates(strategy, ctx) overload for cross-source registrations (skill / MCP / web-search).',
      },
    );
    this.name = 'DuplicateToolNameError';
    this.toolName = toolName;
  }
}

/**
 * Thrown when an `examples` entry fails the registration-time Zod
 * validation against the tool's `inputSchema` / `outputSchema`.
 *
 * @stable
 */
export class InvalidExampleError extends GraphorinToolsError {
  public readonly toolName: string;
  public readonly exampleIndex: number;
  public readonly field: 'input' | 'output';
  public readonly validationError: unknown;
  constructor(opts: {
    readonly toolName: string;
    readonly exampleIndex: number;
    readonly field: 'input' | 'output';
    readonly validationError: unknown;
  }) {
    const fieldPath =
      typeof opts.validationError === 'object' &&
      opts.validationError !== null &&
      'message' in opts.validationError
        ? String((opts.validationError as { message: unknown }).message)
        : 'see validationError';
    super(
      'invalid-example',
      `Tool "${opts.toolName}" example #${opts.exampleIndex} failed ${opts.field}-schema validation: ${fieldPath}`,
      {
        hint: `Fix the example payload to match the tool's ${opts.field}Schema, then rebuild.`,
        cause: opts.validationError,
      },
    );
    this.name = 'InvalidExampleError';
    this.toolName = opts.toolName;
    this.exampleIndex = opts.exampleIndex;
    this.field = opts.field;
    this.validationError = opts.validationError;
  }
}

/**
 * Thrown when a tool's `preferredModel` field does not parse as a
 * `ModelHint` literal OR a structurally-valid `ModelSpec`.
 *
 * @stable
 */
export class InvalidPreferredModelError extends GraphorinToolsError {
  public readonly toolName: string;
  public readonly value: unknown;
  constructor(opts: { readonly toolName: string; readonly value: unknown }) {
    super(
      'invalid-preferred-model',
      `Tool "${opts.toolName}" declared preferredModel: ${describe(opts.value)}, which is neither a ModelHint literal ('fast' | 'balanced' | 'smart') nor a structurally-valid ModelSpec.`,
      {
        hint: "Use one of 'fast' | 'balanced' | 'smart' OR an explicit { provider, model } shape.",
      },
    );
    this.name = 'InvalidPreferredModelError';
    this.toolName = opts.toolName;
    this.value = opts.value;
  }
}

/**
 * Thrown when a tool declares a `sideEffectClass` value outside the
 * canonical four-value union. The TypeScript type system catches this
 * at compile time; the runtime check is the second line of defence
 * for projects that bypass type-checking.
 *
 * @stable
 */
export class InvalidSideEffectClassError extends GraphorinToolsError {
  public readonly toolName: string;
  public readonly value: unknown;
  constructor(opts: { readonly toolName: string; readonly value: unknown }) {
    super(
      'invalid-side-effect-class',
      `Tool "${opts.toolName}" declared sideEffectClass: ${describe(opts.value)}, which is not one of 'pure' | 'read-only' | 'side-effecting' | 'external-stateful'.`,
      {
        hint: 'Pick the most accurate side-effect classification per the canonical four-value union.',
      },
    );
    this.name = 'InvalidSideEffectClassError';
    this.toolName = opts.toolName;
    this.value = opts.value;
  }
}

/**
 * Thrown when an aggregate parallel batch fails. Carries every
 * per-tool failure for observability + structured retry.
 *
 * @stable
 */
export class ToolExecutionAggregateError extends GraphorinToolsError {
  public readonly failures: ReadonlyArray<{
    readonly toolCallId: string;
    readonly toolName: string;
    readonly error: unknown;
  }>;
  constructor(failures: ReadonlyArray<{ toolCallId: string; toolName: string; error: unknown }>) {
    super(
      'tool-execution-aggregate',
      `${failures.length} tool execution(s) failed in the parallel batch: ${failures
        .map((f) => `${f.toolName}#${f.toolCallId}`)
        .join(', ')}`,
    );
    this.name = 'ToolExecutionAggregateError';
    this.failures = Object.freeze(failures.map((f) => Object.freeze({ ...f })));
  }
}

/**
 * Thrown by the strategy-aware `ToolRegistry.assertNoDuplicates(...)`
 * overload when the operator selected the `'manual'` strategy and the
 * dispatcher has no automatic resolution path.
 *
 * @stable
 */
export class ToolCollisionError extends GraphorinToolsError {
  public readonly toolName: string;
  public readonly conflictingSources: ReadonlyArray<string>;
  public readonly strategyAttempted: string;
  constructor(opts: {
    readonly toolName: string;
    readonly conflictingSources: ReadonlyArray<string>;
    readonly strategyAttempted: string;
    readonly resolutionOptions: ReadonlyArray<string>;
  }) {
    super(
      'tool-collision',
      `Tool name "${opts.toolName}" is registered by ${opts.conflictingSources.length} sources (${opts.conflictingSources.join(', ')}) under strategy '${opts.strategyAttempted}', which has no automatic resolution path.`,
      {
        hint: `Choose one of: ${opts.resolutionOptions.join(', ')}.`,
      },
    );
    this.name = 'ToolCollisionError';
    this.toolName = opts.toolName;
    this.conflictingSources = Object.freeze([...opts.conflictingSources]);
    this.strategyAttempted = opts.strategyAttempted;
  }
}

function describe(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}
