/**
 * Tool result envelope helpers for `@graphorin/tools` — token counting,
 * truncation pipeline (`'middle' | 'tail' | 'spill-to-file' |
 * 'summarize'`), and the `ToolReturn` content-parts pass-through
 * convention.
 *
 * @packageDocumentation
 */

export {
  type ResultEnvelope,
  splitTextAndContentParts,
  toResultEnvelope,
} from './envelope.js';
export {
  countTokensHeuristic,
  type TokenCounter,
  type TruncationOutcome,
  truncateBody,
} from './truncate.js';
