/**
 * `createRedactionValidator(...)` — the building block for the
 * mandatory `withValidation()` wrapper applied to every exporter.
 *
 * @packageDocumentation
 */

import { SENSITIVITY_ORDER, type Sensitivity } from '@graphorin/core';

import { RedactionValidationError } from './errors.js';
import { BUILT_IN_PATTERNS, type RedactionPattern } from './patterns.js';
import type {
  RedactionCounters,
  RedactionInput,
  RedactionOutput,
  RedactionValidator,
  RedactionValidatorInstance,
  RedactionValidatorOptions,
  RedactionViolation,
} from './types.js';

const TIER_INDEX = new Map<Sensitivity, number>(
  SENSITIVITY_ORDER.map((tier, idx) => [tier, idx] as const),
);

function rank(tier: Sensitivity): number {
  const idx = TIER_INDEX.get(tier);
  return idx ?? 0;
}

interface CountersInternal {
  droppedTotal: number;
  droppedByReason: Map<string, number>;
  matchesByPattern: Map<string, number>;
}

function makeCounters(): CountersInternal {
  return {
    droppedTotal: 0,
    droppedByReason: new Map(),
    matchesByPattern: new Map(),
  };
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function freezeCounters(c: CountersInternal): RedactionCounters {
  return {
    droppedTotal: c.droppedTotal,
    droppedByReason: Object.freeze(Object.fromEntries(c.droppedByReason)),
    matchesByPattern: Object.freeze(Object.fromEntries(c.matchesByPattern)),
  };
}

function selectPatterns(
  patterns: ReadonlyArray<RedactionPattern>,
  enabled?: ReadonlyArray<string>,
  disabled?: ReadonlyArray<string>,
): RedactionPattern[] {
  const enabledSet = enabled === undefined ? null : new Set(enabled);
  const disabledSet = new Set(disabled ?? []);
  const out: RedactionPattern[] = [];
  for (const p of patterns) {
    if (enabledSet !== null && !enabledSet.has(p.name)) continue;
    if (disabledSet.has(p.name)) continue;
    out.push(p);
  }
  return out;
}

/**
 * Walk every string discovered in `value` and apply `fn`. Returns
 * `{ output, matched }` where `output` is the rewritten payload and
 * `matched` is the de-duplicated list of pattern names that fired.
 *
 * The walker handles strings, plain objects, and arrays. Other JS
 * primitives are passed through untouched. Cycles are detected via a
 * `WeakSet` and broken with `'[Circular]'`.
 */
function walk(
  value: unknown,
  fn: (s: string, matched: Set<string>) => string,
  matched: Set<string>,
  seen: WeakSet<object>,
): unknown {
  if (typeof value === 'string') return fn(value, matched);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value as object)) return '[Circular]';
  seen.add(value as object);

  if (Array.isArray(value)) {
    const out = new Array<unknown>(value.length);
    for (let i = 0; i < value.length; i++) {
      out[i] = walk(value[i], fn, matched, seen);
    }
    return out;
  }

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    out[key] = walk(obj[key], fn, matched, seen);
  }
  return out;
}

/**
 * Apply every active pattern to `s`. Mutates `matched` with the names
 * that fired and returns the rewritten string.
 */
function applyPatterns(
  s: string,
  patterns: ReadonlyArray<RedactionPattern>,
  matched: Set<string>,
): string {
  let out = s;
  for (const p of patterns) {
    p.regex.lastIndex = 0;
    if (p.regex.test(out)) {
      matched.add(p.name);
      p.regex.lastIndex = 0;
      out = out.replace(p.regex, p.mask ?? `[REDACTED ${p.name}]`);
    }
  }
  return out;
}

function violationFor(
  reason: RedactionViolation['reason'],
  input: RedactionInput,
  patterns?: ReadonlyArray<string>,
): RedactionViolation {
  const baseContext = input.context;
  const base: RedactionViolation = {
    reason,
    declaredTier: input.tier,
    ...(baseContext?.attribute === undefined ? {} : { attribute: baseContext.attribute }),
    ...(baseContext?.spanType === undefined ? {} : { spanType: baseContext.spanType }),
    ...(baseContext?.origin === undefined ? {} : { origin: baseContext.origin }),
    ...(patterns === undefined || patterns.length === 0 ? {} : { patterns }),
  };
  return base;
}

/**
 * Create a {@link RedactionValidator} configured against the supplied
 * options. The result implements both the `RedactionValidator`
 * contract from `@graphorin/core` and the
 * {@link RedactionValidatorInstance} extension surface (counters +
 * reset).
 *
 * @stable
 */
export function createRedactionValidator(
  opts: RedactionValidatorOptions = {},
): RedactionValidatorInstance {
  const id = opts.id ?? 'default';
  const minTier: Sensitivity = opts.minTier ?? 'public';
  const failOnUnredacted = opts.failOnUnredactedSensitive === true;
  const patterns = selectPatterns(
    opts.patterns ?? BUILT_IN_PATTERNS,
    opts.enabledPatterns,
    opts.disabledPatterns,
  );
  const onViolation = opts.onViolation;
  const custom = opts.customValidator;

  let counters = makeCounters();

  function recordViolation(violation: RedactionViolation): void {
    counters.droppedTotal += 1;
    bump(counters.droppedByReason, violation.reason);
    for (const name of violation.patterns ?? []) {
      bump(counters.matchesByPattern, name);
    }
    if (onViolation !== undefined) {
      try {
        onViolation(violation);
      } catch {
        // Listener errors must never break the exporter.
      }
    }
  }

  function dropOrThrow(_input: RedactionInput, violation: RedactionViolation): null {
    recordViolation(violation);
    if (failOnUnredacted) {
      throw new RedactionValidationError(
        `RedactionValidator dropped value (${violation.reason}) — set ` +
          'failOnUnredactedSensitive: false in production to keep the ' +
          'pipeline running.',
        violation,
      );
    }
    return null;
  }

  const validator: RedactionValidator = {
    id,
    minTier,
    validate(input: RedactionInput): RedactionOutput | null {
      if (input === null || input === undefined || typeof input !== 'object') {
        return dropOrThrow(
          input as RedactionInput,
          violationFor('invalid-input', input as RedactionInput),
        );
      }

      const declared = input.tier ?? 'internal';

      if (rank(declared) > rank(minTier)) {
        return dropOrThrow(input, violationFor('sensitivity-tier-exceeded', input));
      }

      const matched = new Set<string>();
      const rewritten = walk(
        input.value,
        (s, m) => applyPatterns(s, patterns, m),
        matched,
        new WeakSet(),
      );

      if (matched.size > 0) {
        const matchedList = [...matched];
        for (const name of matchedList) {
          bump(counters.matchesByPattern, name);
        }
        const containsSecret = matchedList.some(
          (name) => patterns.find((p) => p.name === name)?.category === 'secret',
        );

        if (containsSecret) {
          if (failOnUnredacted) {
            const violation = violationFor('secret-pattern-match', input, matchedList);
            counters.droppedTotal += 1;
            bump(counters.droppedByReason, violation.reason);
            if (onViolation !== undefined) {
              try {
                onViolation(violation);
              } catch {
                /* listener errors swallowed */
              }
            }
            throw new RedactionValidationError(
              `RedactionValidator detected secret pattern(s) in attribute (${matchedList.join(', ')}).`,
              violation,
            );
          }
        }
      }

      const out: RedactionOutput =
        matched.size === 0
          ? { value: rewritten, tier: declared }
          : { value: rewritten, tier: declared, matched: [...matched] };

      if (custom !== undefined) {
        return custom({ ...input, value: rewritten });
      }

      return out;
    },
  };

  const instance: RedactionValidatorInstance = {
    ...validator,
    counters: () => freezeCounters(counters),
    resetCounters: () => {
      counters = makeCounters();
    },
  };

  return instance;
}

/**
 * Quickly compute the relative ordering of two sensitivity tiers.
 * Exposed because the tracer + replay layers need it without taking a
 * full dependency on the validator implementation.
 *
 * @stable
 */
export function compareSensitivityTiers(a: Sensitivity, b: Sensitivity): number {
  return rank(a) - rank(b);
}
