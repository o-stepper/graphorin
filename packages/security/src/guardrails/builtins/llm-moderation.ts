/**
 * `llmModeration` and `outputModeration` - guardrails that delegate
 * the actual moderation decision to a caller-supplied callback. The
 * security package does **not** import any provider here; the
 * callback receives the value and returns a structured decision.
 *
 * The agent runtime (Phase 12) wires a real provider - the default
 * factory accepts a generic moderation provider (operator-injected
 * OpenAI moderation, Anthropic safety, locally-hosted moderation
 * model, etc.) - without forcing the security package to depend on
 * `@graphorin/provider`.
 *
 * Reference: the project's security architecture, § Guardrails.
 *
 * @packageDocumentation
 */

import { defineInputGuardrail, defineOutputGuardrail } from '../builders.js';
import type {
  GuardrailDefinition,
  GuardrailResult,
  InputGuardrail,
  OutputGuardrail,
} from '../types.js';

/**
 * Decision returned by a moderation provider. Designed to mirror the
 * common shape exposed by mainstream moderation endpoints.
 *
 * @stable
 */
export interface ModerationDecision {
  readonly flagged: boolean;
  readonly categories?: ReadonlyArray<string>;
  readonly score?: number;
  readonly reason?: string;
}

/**
 * Provider callback. The runtime injects an async function that
 * forwards the value to a moderation service and returns the
 * decision.
 *
 * @stable
 */
export type ModerationProvider = (
  value: string,
) => Promise<ModerationDecision> | ModerationDecision;

/**
 * Options for `llmModeration(...)` (input) and `outputModeration(...)`
 * (output).
 *
 * @stable
 */
export interface ModerationGuardrailOptions {
  readonly provider: ModerationProvider;
  /** Confidence threshold; values above the threshold are flagged. */
  readonly threshold?: number;
  /** Action to take on a flagged decision. Defaults to `'block'`. */
  readonly action?: 'block' | 'warn';
  /** Override the guardrail name. */
  readonly name?: string;
  /** Categories that always trigger a block, even if the score is below threshold. */
  readonly blockCategories?: ReadonlyArray<string>;
}

/**
 * Construct an input-side moderation guardrail.
 *
 * @stable
 */
export function llmModeration<TValue = unknown>(
  opts: ModerationGuardrailOptions,
): InputGuardrail<TValue> {
  return defineInputGuardrail<TValue>(buildSpec(opts, 'llmModeration')) as InputGuardrail<TValue>;
}

/**
 * Construct an output-side moderation guardrail.
 *
 * @stable
 */
export function outputModeration<TValue = unknown>(
  opts: ModerationGuardrailOptions,
): OutputGuardrail<TValue> {
  return defineOutputGuardrail<TValue>(
    buildSpec(opts, 'outputModeration'),
  ) as OutputGuardrail<TValue>;
}

function buildSpec<TValue>(
  opts: ModerationGuardrailOptions,
  defaultName: string,
): Omit<GuardrailDefinition<TValue>, 'kind'> {
  const action = opts.action ?? 'block';
  const blockCategories = new Set(opts.blockCategories ?? []);
  return {
    name: opts.name ?? defaultName,
    check: async (value: TValue): Promise<GuardrailResult<TValue>> => {
      const text = textOf(value);
      if (text.length === 0) return { ok: true };
      const decision = await opts.provider(text);
      if (!decision.flagged) {
        if (opts.threshold !== undefined && (decision.score ?? 0) > opts.threshold) {
          return {
            ok: false,
            action,
            message: `moderation score ${decision.score} exceeds threshold ${opts.threshold}`,
            metadata: Object.freeze({ ...decision }),
          };
        }
        return { ok: true };
      }
      const flaggedCategoryHit = (decision.categories ?? []).some((c) => blockCategories.has(c));
      const finalAction = flaggedCategoryHit ? 'block' : action;
      return {
        ok: false,
        action: finalAction,
        message:
          decision.reason ??
          `moderation flagged${decision.categories ? ` (${decision.categories.join(', ')})` : ''}`,
        metadata: Object.freeze({ ...decision }),
      };
    },
  };
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(textOf).join('\n');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
