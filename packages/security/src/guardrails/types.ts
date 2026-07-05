/**
 * Public types for the guardrails subsystem of `@graphorin/security`.
 *
 * Guardrails are deterministic, composable check functions that run
 * before / after the agent loop. The **action** discriminator returned
 * on failure tells the runtime whether to refuse the run, downgrade
 * to a warning, or rewrite the input / output before continuing.
 *
 * Reference: the project's security architecture, § Guardrails.
 *
 * @packageDocumentation
 */

/**
 * Stage of the run a guardrail applies to.
 *
 * @stable
 */
export type GuardrailStage = 'input' | 'output';

/**
 * Action requested by a failing guardrail.
 *
 * - `'block'` - the runtime refuses to proceed and surfaces the
 *   failure as a structured error.
 * - `'warn'` - the runtime continues but records a WARN-level event;
 *   suitable for telemetry-only rules.
 * - `'rewrite'` - the runtime substitutes the supplied `rewrite`
 *   value before continuing (e.g. PII redaction with a masked output).
 *
 * @stable
 */
export type GuardrailAction = 'block' | 'warn' | 'rewrite';

/**
 * Per-call context handed to every guardrail. The runtime injects
 * the structured logger, optional locale hint, and any additional
 * fields a guardrail may want to read. The shape is intentionally
 * tiny so guardrails are easy to test without booting the full
 * runtime.
 *
 * @stable
 */
export interface GuardrailContext {
  /** Stage at which the guardrail is running. */
  readonly stage: GuardrailStage;
  /** Optional run / session bookkeeping. */
  readonly runId?: string;
  readonly sessionId?: string;
  readonly agentId?: string;
  /** Locale hint used by language-aware guardrails. */
  readonly locale?: string;
  /** Optional logger handle. */
  readonly warn?: (message: string) => void;
}

/**
 * Result of a single guardrail check.
 *
 * @stable
 */
export type GuardrailResult<TValue = unknown> =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly action: GuardrailAction;
      readonly message: string;
      readonly rewrite?: TValue;
      readonly metadata?: Readonly<Record<string, unknown>>;
    };

/**
 * Definition of a single guardrail. The `kind` discriminator lets
 * downstream code tell input from output guardrails without juggling
 * separate registries.
 *
 * @stable
 */
export interface GuardrailDefinition<TValue = unknown> {
  readonly kind: 'input' | 'output';
  readonly name: string;
  readonly check: (
    value: TValue,
    ctx: GuardrailContext,
  ) => GuardrailResult<TValue> | Promise<GuardrailResult<TValue>>;
}

/**
 * Input guardrail discriminator.
 *
 * @stable
 */
export type InputGuardrail<TValue = unknown> = GuardrailDefinition<TValue> & {
  readonly kind: 'input';
};

/**
 * Output guardrail discriminator.
 *
 * @stable
 */
export type OutputGuardrail<TValue = unknown> = GuardrailDefinition<TValue> & {
  readonly kind: 'output';
};

/**
 * Result of running a sequence of guardrails through `composeGuardrails(...)`.
 *
 * @stable
 */
export type ComposedGuardrailResult<TValue = unknown> =
  | { readonly ok: true; readonly value: TValue }
  | {
      readonly ok: false;
      readonly action: GuardrailAction;
      readonly name: string;
      readonly message: string;
      readonly value: TValue;
      readonly warnings: ReadonlyArray<{ readonly name: string; readonly message: string }>;
    };
