/**
 * Builders for `defineInputGuardrail(...)` and
 * `defineOutputGuardrail(...)` plus `composeGuardrails(...)` -
 * the helper that runs a sequence of guardrails with the
 * documented short-circuit semantics on `'block'`.
 *
 * Reference: the project's security architecture, § Guardrails.
 *
 * @packageDocumentation
 */

import type {
  ComposedGuardrailResult,
  GuardrailContext,
  GuardrailDefinition,
  GuardrailResult,
  InputGuardrail,
  OutputGuardrail,
} from './types.js';

/**
 * Create a typed input guardrail. Thin wrapper around the
 * declarative shape - the helper exists so call-sites stay
 * declarative.
 *
 * @stable
 */
export function defineInputGuardrail<TValue = unknown>(
  spec: Omit<InputGuardrail<TValue>, 'kind'>,
): InputGuardrail<TValue> {
  return Object.freeze({ kind: 'input' as const, ...spec });
}

/**
 * Create a typed output guardrail. Thin wrapper around the
 * declarative shape.
 *
 * @stable
 */
export function defineOutputGuardrail<TValue = unknown>(
  spec: Omit<OutputGuardrail<TValue>, 'kind'>,
): OutputGuardrail<TValue> {
  return Object.freeze({ kind: 'output' as const, ...spec });
}

/**
 * Compose a sequence of guardrails into a single check that runs
 * them in order. The first `'block'` short-circuits; `'warn'` is
 * accumulated; `'rewrite'` mutates the in-flight value and continues
 * forward.
 *
 * The composer never throws: every error path returns
 * `ComposedGuardrailResult` so the caller can surface structured
 * results without exception handling.
 *
 * @stable
 */
export async function composeGuardrails<TValue = unknown>(
  guardrails: ReadonlyArray<GuardrailDefinition<TValue>>,
  value: TValue,
  ctx: GuardrailContext,
): Promise<ComposedGuardrailResult<TValue>> {
  const warnings: Array<{ name: string; message: string }> = [];
  let current = value;

  for (const guard of guardrails) {
    const result: GuardrailResult<TValue> = await guard.check(current, ctx);
    if (result.ok) continue;

    if (result.action === 'block') {
      return Object.freeze({
        ok: false as const,
        action: 'block' as const,
        name: guard.name,
        message: result.message,
        value: current,
        warnings: Object.freeze([...warnings]),
      });
    }
    if (result.action === 'warn') {
      warnings.push({ name: guard.name, message: result.message });
      ctx.warn?.(`[guardrail:${guard.name}] ${result.message}`);
      continue;
    }
    if (result.action === 'rewrite') {
      if (result.rewrite !== undefined) current = result.rewrite;
      warnings.push({ name: guard.name, message: result.message });
      continue;
    }
    // Exhaustiveness guard.
    const exhaustive: never = result.action;
    return Object.freeze({
      ok: false as const,
      action: 'block' as const,
      name: guard.name,
      message: `unknown action ${exhaustive as string}`,
      value: current,
      warnings: Object.freeze([...warnings]),
    });
  }

  return Object.freeze({ ok: true as const, value: current });
}
