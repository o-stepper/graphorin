/**
 * `promptInjectionHeuristics` — input guardrail with a small
 * regex-only pattern catalogue that catches the canonical 2026
 * trivial-injection reproductions (the "ignore previous
 * instructions" / "you must" / "system prompt:" pattern family).
 *
 * The catalogue is intentionally conservative; sophisticated
 * injection attacks demand LLM-based moderation (the `llmModeration`
 * guardrail) and an outbound-prompt redaction middleware (Phase 06).
 * The defaults here are defence in depth — they raise the cost of
 * trivial reproductions without claiming full immunity. The richer
 * inbound-sanitization middleware that consumes these patterns
 * sandbox-side ships in Phase 06 / Phase 12 per the inbound-trust
 * contract called out in the threat-model boundary § Network egress
 * (LLM01 / OWASP Agentic ASI01).
 *
 * Reference: the project's security architecture, § Guardrails.
 *
 * @packageDocumentation
 */

import { defineInputGuardrail } from '../builders.js';
import type { GuardrailResult, InputGuardrail } from '../types.js';

/**
 * Default catalogue of injection patterns. The patterns are
 * case-insensitive and match common phrasings of the canonical
 * inbound-prompt-injection family. Operators can extend the
 * catalogue via `extraPatterns`.
 *
 * @stable
 */
export const DEFAULT_INJECTION_PATTERNS: ReadonlyArray<RegExp> = Object.freeze([
  /\bignore\s+(all|previous|prior|earlier)\s+(instructions?|directives?|rules?|prompts?)\b/i,
  /\b(disregard|forget|override)\s+(the|your)\s+(system\s+)?prompt\b/i,
  /\bsystem\s+prompt\s*:/i,
  /\bact\s+as\s+(an?\s+)?(jailbroken|different|unrestricted)\s+/i,
  /\byou\s+(must|should|will|are\s+required\s+to)\s+(now\s+)?(disregard|ignore|override|reveal|leak)\b/i,
  /\bnew\s+(instructions?|rules?|directives?):\b/i,
  /<<<\s*system\s*>>>/i,
]);

/**
 * Options for `promptInjectionHeuristics(...)`.
 *
 * @stable
 */
export interface PromptInjectionHeuristicsOptions {
  /** Additional patterns merged with the default catalogue. */
  readonly extraPatterns?: ReadonlyArray<RegExp>;
  /** Replace the default catalogue entirely. */
  readonly patterns?: ReadonlyArray<RegExp>;
  /** Action to take on a match. Defaults to `'block'`. */
  readonly action?: 'block' | 'warn';
  /** Override guardrail name (helpful when multiple are registered). */
  readonly name?: string;
}

/**
 * Construct the heuristics input guardrail.
 *
 * @stable
 */
export function promptInjectionHeuristics<TValue = unknown>(
  opts: PromptInjectionHeuristicsOptions = {},
): InputGuardrail<TValue> {
  const patterns = Object.freeze([
    ...(opts.patterns ?? DEFAULT_INJECTION_PATTERNS),
    ...(opts.extraPatterns ?? []),
  ]);
  const action = opts.action ?? 'block';
  const name = opts.name ?? 'promptInjectionHeuristics';

  return defineInputGuardrail<TValue>({
    name,
    check: (value: TValue): GuardrailResult<TValue> => {
      const text = textOf(value);
      const matched: string[] = [];
      for (const pattern of patterns) {
        if (pattern.test(text)) matched.push(pattern.source);
      }
      if (matched.length === 0) return { ok: true };
      return {
        ok: false,
        action,
        message: `inbound text matched ${matched.length} prompt-injection pattern(s)`,
        metadata: Object.freeze({ matched }),
      };
    },
  });
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((v) => textOf(v)).join('\n');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
