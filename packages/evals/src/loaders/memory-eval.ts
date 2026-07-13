/**
 * Shared "memory system under test" contract used by the long-term
 * memory eval loaders ({@link loadLongMemEvalDataset},
 * {@link loadLocomoDataset}, {@link loadDmrDataset}) and the benchmark
 * runner. A loader turns a dataset's native JSON into
 * `Case<MemoryEvalInput, string>`: the input carries the haystack of
 * prior sessions plus the question; the expected output is the
 * reference answer string, graded by the `llmJudge` "J" scorer.
 *
 * This module is intentionally **type-only** and carries no dependency
 * on `@graphorin/memory` - the concrete system-under-test agent lives
 * in the benchmark package so `@graphorin/evals` stays a generic
 * harness.
 *
 * @packageDocumentation
 */

/**
 * One conversational turn inside a haystack session.
 *
 * @stable
 */
export interface MemoryEvalTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
  /** Dataset-native (often ISO-8601) timestamp, when the dataset provides one. */
  readonly timestamp?: string;
  /**
   * Dataset-native speaker NAME (e.g. LOCOMO's `"Melanie"`), when the
   * dataset provides one (W-022). Distinct from `role`: two-speaker
   * datasets map onto user/assistant for machinery compatibility, but
   * most LOCOMO questions reference the speakers by name, so the
   * system under test must see the names in the ingested text.
   */
  readonly speaker?: string;
}

/**
 * One prior session in the haystack the memory system must ingest
 * before the question is asked.
 *
 * @stable
 */
export interface MemoryEvalSession {
  readonly id: string;
  readonly turns: ReadonlyArray<MemoryEvalTurn>;
}

/**
 * The five LongMemEval abilities. Every loader maps its dataset-native
 * category onto one of these so per-ability scoring is comparable
 * across datasets; the raw category is preserved in `Case.metadata`.
 *
 * @stable
 */
export type MemoryEvalAbility =
  | 'info-extraction'
  | 'multi-session'
  | 'temporal'
  | 'knowledge-update'
  | 'abstention';

/**
 * Input handed to the memory system under test for one eval case.
 *
 * @stable
 */
export interface MemoryEvalInput {
  /** Prior sessions to ingest before the question is asked. */
  readonly haystackSessions: ReadonlyArray<MemoryEvalSession>;
  /** The question to answer from memory. */
  readonly question: string;
  /**
   * When the question is asked. Drives temporal / knowledge-update
   * reasoning; dataset-native string (not necessarily ISO-8601).
   */
  readonly askedAt?: string;
  /** Mapped ability ({@link MemoryEvalAbility}); the raw category lives in metadata. */
  readonly ability?: MemoryEvalAbility;
}

/**
 * Kind of an operation-level gold memory point (HaluMem-style):
 * `extract` - the point must exist in memory after ingest; `update` -
 * the point must have replaced {@link MemoryGoldPoint.previous};
 * `delete` - the point must be gone from memory after ingest.
 *
 * @stable
 */
export type MemoryOperationKind = 'extract' | 'update' | 'delete';

/**
 * One operation-level ground-truth memory point. Per-operation gold
 * labels are what distinguish HaluMem-format datasets from the
 * QA-level loaders above: they grade the memory system's *write*
 * pipeline (extraction recall/precision, update omission) instead of
 * only its final answers.
 *
 * @stable
 */
export interface MemoryGoldPoint {
  readonly kind: MemoryOperationKind;
  /**
   * The expected memory content: for `extract` the fact that must be
   * present, for `update` the NEW value, for `delete` the fact that
   * must be absent.
   */
  readonly content: string;
  /** For `update`: the superseded (old) content. */
  readonly previous?: string;
  /** Which haystack session this point is grounded in, when known. */
  readonly sessionId?: string;
}

/**
 * Input handed to the memory system under test for one
 * operation-level eval case. The gold labels ride the input (not
 * `Case.expected`) so a single observation type can serve the
 * extraction, update and QA stages.
 *
 * @stable
 */
export interface MemoryOperationsEvalInput {
  /** Sessions to ingest before memory is observed. */
  readonly haystackSessions: ReadonlyArray<MemoryEvalSession>;
  /** Per-operation ground truth for this case. */
  readonly goldPoints: ReadonlyArray<MemoryGoldPoint>;
  /** QA-stage probe question (absent on operations-stage cases). */
  readonly question?: string;
  /** Reference answer for the QA probe. */
  readonly referenceAnswer?: string;
  /** `true` when the correct QA behaviour is to abstain. */
  readonly unanswerable?: boolean;
  /** When the question is asked; dataset-native string. */
  readonly askedAt?: string;
  /** Mapped ability ({@link MemoryEvalAbility}); the raw category lives in metadata. */
  readonly ability?: MemoryEvalAbility;
}

/**
 * What the system under test exposes for scoring after replaying one
 * operation-level case: the observable memory contents post-ingest
 * plus the QA answer when the case carried a question. Produced by
 * the replaying harness in `benchmarks/` - this package stays
 * type-only with respect to `@graphorin/memory`.
 *
 * @stable
 */
export interface MemoryOperationsObservation {
  /** Textual contents of every recall-eligible memory point after ingest. */
  readonly memoryPoints: ReadonlyArray<string>;
  /** The answer produced for {@link MemoryOperationsEvalInput.question}. */
  readonly answer?: string;
}
