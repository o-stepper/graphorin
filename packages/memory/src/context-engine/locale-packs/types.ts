/**
 * Public types for the per-locale assets the
 * {@link ContextEngine} consumes when assembling the layered system
 * prompt. The framework ships an English default ({@link enLocalePack});
 * additional locales are supplied by application code via
 * {@link defineContextLocalePack}.
 *
 * The framework is locale-agnostic — no language is privileged in
 * core. Every consumer-facing string is reachable through this
 * surface so consumers can swap them without forking the framework.
 *
 * @packageDocumentation
 */

/**
 * Trigger mode used by the auto-recall heuristic. The framework ships
 * regex patterns for the bundled locale; consumers may extend or
 * replace them via {@link defineContextLocalePack}.
 *
 * @stable
 */
export interface AutoRecallTriggers {
  /**
   * Case-insensitive regex set evaluated against the last user
   * message. A match indicates the model would benefit from the
   * top-K facts being injected into Layer 6.
   */
  readonly factTriggers: ReadonlyArray<RegExp>;
}

/**
 * Layer 1 template fragments. The {@link composeTemplate} function
 * picks the right fragment based on `memoryBaseMode`.
 *
 * @stable
 */
export interface BaseTemplateFragments {
  /** Full educational template (~250-350 tokens). */
  readonly full: string;
  /** Minimal template for high-end models (~80-120 tokens). */
  readonly minimal: string;
}

/**
 * D4 inbound-sanitization preamble fragment. Injected after the
 * cache breakpoint (Layer 5/6 territory) on steps containing
 * untrusted tool output.
 *
 * @stable
 */
export interface InboundSanitizationPreamble {
  /** Verbatim text appended to the system message when fired. */
  readonly text: string;
}

/**
 * Structured 9-section summary template fragments used by the
 * auto-compaction summarizer (RB-46). Section order is fixed; only
 * the per-section header / preamble text is locale-extensible.
 *
 * Each entry is the human-readable header for the corresponding
 * section. Section indices are 1-based to match the documented
 * 9-section layout in the architecture doc.
 *
 * @stable
 */
export interface CompactionSummaryTemplate {
  /** Preamble injected at the top of the summarizer prompt. */
  readonly preamble: string;
  /** 9 section headers. */
  readonly sections: readonly [
    string, // 1: Session goal and current task
    string, // 2: Decisions made and rationale
    string, // 3: Key facts established
    string, // 4: Open questions and ambiguities
    string, // 5: Tools used and their outcomes
    string, // 6: Files / artifacts referenced
    string, // 7: Persona / preferences / project rules surfaced
    string, // 8: Recent turns preserved verbatim
    string, // 9: Compaction metadata
  ];
}

/**
 * A `LocalePack` collects every consumer-facing string the
 * ContextEngine renders. Consumers register additional locales via
 * {@link defineContextLocalePack}. The framework is locale-agnostic
 * — no language is privileged in core.
 *
 * @stable
 */
export interface ContextLocalePack {
  /** Stable lowercase identifier (`'en'`, `'de'`, `'fr'`, …). */
  readonly id: string;
  /** Layer 1 base template fragments. */
  readonly baseTemplate: BaseTemplateFragments;
  /** Auto-recall trigger regex set. */
  readonly autoRecallTriggers: AutoRecallTriggers;
  /** Inbound-sanitization preamble (D4 — RB-43). */
  readonly inboundSanitizationPreamble: InboundSanitizationPreamble;
  /** 9-section compaction summary template (RB-46). */
  readonly compactionSummaryTemplate: CompactionSummaryTemplate;
}

/**
 * Builder used by application code that wants to ship a custom
 * locale pack. The builder freezes every input so the pack can be
 * safely reused across multiple `Memory` instances without
 * accidental mutation.
 *
 * Partial packs are accepted: any field omitted falls back to the
 * English default at compose time, with a one-time WARN per locale
 * per missing surface (the safety guarantee is preserved even when
 * an operator installs a partial locale pack).
 *
 * @stable
 */
export interface PartialContextLocalePack {
  readonly id: string;
  readonly baseTemplate?: Partial<BaseTemplateFragments>;
  readonly autoRecallTriggers?: Partial<AutoRecallTriggers>;
  readonly inboundSanitizationPreamble?: Partial<InboundSanitizationPreamble>;
  readonly compactionSummaryTemplate?: Partial<CompactionSummaryTemplate>;
}

/**
 * Build a {@link ContextLocalePack} from a partial input. Missing
 * fields fall back to the English default at compose time.
 *
 * @stable
 */
export function defineContextLocalePack(input: PartialContextLocalePack): PartialContextLocalePack {
  if (typeof input.id !== 'string' || input.id.length === 0) {
    throw new TypeError(
      '[graphorin/memory] defineContextLocalePack: `id` must be a non-empty lowercase string.',
    );
  }
  return Object.freeze({
    id: input.id,
    ...(input.baseTemplate !== undefined
      ? { baseTemplate: Object.freeze({ ...input.baseTemplate }) }
      : {}),
    ...(input.autoRecallTriggers !== undefined
      ? {
          autoRecallTriggers: Object.freeze({
            ...(input.autoRecallTriggers.factTriggers !== undefined
              ? { factTriggers: Object.freeze([...input.autoRecallTriggers.factTriggers]) }
              : {}),
          }) as Partial<AutoRecallTriggers>,
        }
      : {}),
    ...(input.inboundSanitizationPreamble !== undefined
      ? {
          inboundSanitizationPreamble: Object.freeze({ ...input.inboundSanitizationPreamble }),
        }
      : {}),
    ...(input.compactionSummaryTemplate !== undefined
      ? {
          compactionSummaryTemplate: Object.freeze({
            ...(input.compactionSummaryTemplate.preamble !== undefined
              ? { preamble: input.compactionSummaryTemplate.preamble }
              : {}),
            ...(input.compactionSummaryTemplate.sections !== undefined
              ? {
                  sections: Object.freeze([
                    ...input.compactionSummaryTemplate.sections,
                  ]) as CompactionSummaryTemplate['sections'],
                }
              : {}),
          }) as Partial<CompactionSummaryTemplate>,
        }
      : {}),
  });
}
