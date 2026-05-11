/**
 * Public types for the per-locale heuristic packs consumed by the
 * Stage 3 (regex) and Stage 4 (subject/predicate) stages of the
 * multi-stage conflict resolution pipeline (DEC-117 / ADR-018 ext).
 *
 * @packageDocumentation
 */

/**
 * Categorisation of a supersede marker. Surfaced on the audit row so
 * downstream tooling can group conflicts by lifecycle event
 * (relocation / job / preference / relationship / health / generic).
 *
 * @stable
 */
export type LocaleSupersedeKind =
  | 'location'
  | 'job'
  | 'preference'
  | 'relationship'
  | 'health'
  | 'generic';

/**
 * Single regex pattern bundled inside a `LocalePack`. The pipeline
 * applies the regex to the fact body in case-insensitive mode unless
 * the pattern was constructed with explicit flags.
 *
 * @stable
 */
export interface LocalePatternEntry {
  readonly regex: RegExp;
  readonly kind?: LocaleSupersedeKind;
  /**
   * Optional confidence ∈ `[0, 1]` surfaced through the audit row's
   * `reason` field. Defaults to `0.8`.
   */
  readonly confidence?: number;
}

/**
 * A `LocalePack` defines the regex sets Stage 3 and the predicate
 * verb set Stage 4 use to evaluate a candidate fact pair against the
 * existing conflicts.
 *
 * The bundled English pack (`enLocalePack`) covers the most common
 * personal-assistant change signals (relocation / job change /
 * preference flip / relationship / health). Additional locales are
 * registered through {@link defineLocalePack}.
 *
 * @stable
 */
export interface LocalePack {
  /** Stable lowercase identifier (`'en'`, `'fr'`, …). */
  readonly id: string;
  /** Patterns that explicitly mark the candidate as superseding the existing fact. */
  readonly supersedeMarkers: ReadonlyArray<LocalePatternEntry>;
  /** Patterns that negate the existing fact (treated as supersede in Stage 3). */
  readonly negationMarkers: ReadonlyArray<LocalePatternEntry>;
  /**
   * Verbs (or verb particles) Stage 4 strips while normalising a
   * predicate so e.g. `'lives in'` and `'living in'` collapse to the
   * same key. Lowercase tokens.
   */
  readonly predicateNormalisers: ReadonlyArray<string>;
  /** Tokens dropped from the subject before comparison (`'a'`, `'the'`, …). */
  readonly subjectStopWords: ReadonlyArray<string>;
}

/**
 * Outcome of a single locale-pack regex evaluation. Returned by
 * `evaluateMarkers(...)` so the pipeline can propagate the matched
 * marker into the audit row's `reason` field.
 *
 * @stable
 */
export interface LocaleMatch {
  readonly matched: boolean;
  readonly kind?: LocaleSupersedeKind;
  readonly confidence?: number;
  readonly excerpt?: string;
}

/**
 * Builder used by application code that wants to ship a custom pack:
 *
 * ```ts
 * const ru = defineLocalePack({
 *   id: 'ru',
 *   supersedeMarkers: [{ regex: /\bпереехал\b/iu, kind: 'location' }],
 *   negationMarkers: [{ regex: /\bне\b/iu }],
 *   predicateNormalisers: ['жив', 'жил', 'живёт'],
 *   subjectStopWords: ['я', 'ты'],
 * });
 * ```
 *
 * The builder freezes every input so the pack can be safely reused
 * across multiple `Memory` instances without accidental mutation.
 *
 * @stable
 */
export function defineLocalePack(input: LocalePack): LocalePack {
  return Object.freeze({
    id: input.id,
    supersedeMarkers: Object.freeze([...input.supersedeMarkers]),
    negationMarkers: Object.freeze([...input.negationMarkers]),
    predicateNormalisers: Object.freeze([...input.predicateNormalisers]),
    subjectStopWords: Object.freeze([...input.subjectStopWords]),
  }) as LocalePack;
}

/**
 * Apply a list of patterns to the supplied text and return the
 * highest-confidence match (first match wins on ties). Surfaced for
 * unit tests; the pipeline calls this internally.
 *
 * @stable
 */
export function evaluateMarkers(
  text: string,
  patterns: ReadonlyArray<LocalePatternEntry>,
): LocaleMatch {
  let best: LocaleMatch = { matched: false };
  for (const pattern of patterns) {
    const m = pattern.regex.exec(text);
    if (m === null) continue;
    const confidence = pattern.confidence ?? 0.8;
    if (best.matched && (best.confidence ?? 0) >= confidence) continue;
    const candidate: LocaleMatch = {
      matched: true,
      ...(pattern.kind !== undefined ? { kind: pattern.kind } : {}),
      confidence,
      excerpt: m[0],
    };
    best = candidate;
  }
  return best;
}
