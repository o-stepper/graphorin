/**
 * Scoring-prompt template for the LLM-as-reranker. Default template is
 * English; operators that target a different locale pass an explicit
 * `scoringPrompt` per the Phase 16 spec (the package's defaults are
 * locale-agnostic, not locale-privileging).
 *
 * @packageDocumentation
 */

/**
 * Inputs passed to a {@link ScoringPromptBuilder}.
 *
 * @stable
 */
export interface ScoringPromptInput {
  readonly query: string;
  readonly passage: string;
  /** Maximum integer the model is allowed to return. */
  readonly maxScore: number;
}

/**
 * Result of a {@link ScoringPromptBuilder} call. The system message is
 * forwarded verbatim to the provider; the user message is the
 * per-pair instruction.
 *
 * @stable
 */
export interface ScoringPrompt {
  readonly system: string;
  readonly user: string;
}

/**
 * Function shape consumed by {@link createLlmReranker}.
 *
 * @stable
 */
export type ScoringPromptBuilder = (input: ScoringPromptInput) => ScoringPrompt;

/**
 * Default English scoring prompt. Asks the model to emit a single
 * integer in `[0, maxScore]` and to omit any other text.
 *
 * @stable
 */
export const defaultScoringPrompt: ScoringPromptBuilder = ({ query, passage, maxScore }) => ({
  system:
    'You are a precise relevance grader. Given a search query and a candidate passage, ' +
    'output a single integer from 0 to ' +
    String(maxScore) +
    ' representing how well the passage answers the query. ' +
    'Higher means more relevant. Output ONLY the integer; no explanation, no formatting.',
  user: `QUERY:\n${query}\n\nPASSAGE:\n${passage}\n\nINTEGER SCORE (0-${maxScore}):`,
});
