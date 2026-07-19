/**
 * Contextual retrieval. Before a memory is embedded / FTS-indexed
 * the framework can prepend a short *situating context* (entities,
 * timeframe, topics) so a terse fact like "moved there in March" stays
 * findable by "Where did Anna relocate?". This mirrors Anthropic's
 * Contextual Retrieval, applied to both the vector embedding *and* the
 * lexical index, while the canonical `text` shown to the user / audit
 * trail is left untouched.
 *
 * Three modes:
 * - `'off'` - index the bare canonical text (no situating prefix).
 * - `'late-chunk'` - the **offline default**: prepend a context derived
 *   deterministically from the memory's own structured metadata. No LLM
 *   call, so the local-first write path is unchanged in cost.
 * - `'llm'` - an opt-in, **consolidator-only** enrichment: one cheap
 *   provider call writes a 1-2 sentence situating prefix. Confined to the
 *   background consolidator (never the hot write path); a failure or empty
 *   completion degrades to {@link contextualize} so a write never wedges.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest, Usage } from '@graphorin/core';

/**
 * Contextual-retrieval mode. `'late-chunk'` is the offline default;
 * `'llm'` is the opt-in, consolidator-only enrichment.
 *
 * @stable
 */
export type ContextualRetrievalMode = 'off' | 'late-chunk' | 'llm';

/**
 * Structural subset of a fact / candidate consumed by the
 * contextualizers. Only **author / extraction-supplied** signals are
 * used - never framework-defaulted fields (e.g. a `validFrom` defaulted
 * to write-time) and never opaque scope ids (random uuids would only
 * add noise to the embedding). A candidate with no structured signals
 * yields an empty context, so plain `remember({ text })` writes are
 * left byte-identical.
 *
 * @internal
 */
export interface ContextualizeInput {
  readonly text: string;
  readonly subject?: string;
  readonly predicate?: string;
  readonly object?: string;
  readonly tags?: ReadonlyArray<string>;
  /** Author-set validity start (ISO-8601). Framework-defaulted values are *not* passed. */
  readonly validFrom?: string;
}

const SITUATING_CONTEXT_SYSTEM_PROMPT = [
  'You are a situating-context assistant for a long-running memory store.',
  'Given one memory and any structured hints, write a single short sentence (≤ 25 words) that situates it - the entities, timeframe, and topic it concerns - so it can be retrieved later by a vaguely-worded question.',
  'Do not restate the memory verbatim and do not add facts that are not implied. Return only the sentence, no preamble.',
].join(' ');

/**
 * Build the deterministic situating-context prefix from a candidate's
 * structured signals. Returns `''` when nothing useful is available so
 * the caller can short-circuit to the canonical text.
 *
 * @internal
 */
export function buildSituatingContext(input: ContextualizeInput): string {
  const parts: string[] = [];
  const subject = trimToUndefined(input.subject);
  const predicate = trimToUndefined(input.predicate);
  const object = trimToUndefined(input.object);
  if (subject !== undefined && predicate !== undefined && object !== undefined) {
    parts.push(`${subject} ${predicate} ${object}`);
  } else {
    if (subject !== undefined) parts.push(subject);
    if (object !== undefined) parts.push(object);
  }
  const validFrom = trimToUndefined(input.validFrom);
  if (validFrom !== undefined) {
    parts.push(`as of ${validFrom.length >= 10 ? validFrom.slice(0, 10) : validFrom}`);
  }
  const tags = (input.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
  if (tags.length > 0) {
    parts.push(`topics: ${tags.join(', ')}`);
  }
  if (parts.length === 0) return '';
  return `[Context: ${parts.join('; ')}]`;
}

/**
 * Late-chunking contextualizer (offline default). Prepends the
 * deterministic situating context to the canonical text; a no-op when
 * the candidate carries no structured signals. Pure - never calls a
 * provider.
 *
 * @internal
 */
export function contextualize(input: ContextualizeInput): string {
  const ctx = buildSituatingContext(input);
  return ctx === '' ? input.text : `${ctx}\n${input.text}`;
}

const ZERO_USAGE: Usage = Object.freeze({
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
});

/** Result of the LLM-context enrichment - the index text plus call usage for budgeting. */
export interface ContextualizeLlmResult {
  readonly indexText: string;
  readonly usage: Usage;
}

/**
 * LLM-context contextualizer (opt-in, consolidator-only). Spends one
 * cheap provider call to write a situating prefix, then prepends it to
 * the canonical text. Resilient by design: an empty completion or a
 * provider error degrades to {@link contextualize} (deterministic
 * late-chunk) so the enrichment can never wedge a write. Returns the
 * usage so the caller can record it against the budget.
 *
 * @internal
 */
export async function contextualizeWithLlm(
  input: ContextualizeInput,
  provider: Provider,
  opts: { readonly signal?: AbortSignal } = {},
): Promise<ContextualizeLlmResult> {
  const request: ProviderRequest = {
    messages: [{ role: 'user', content: buildSituatingUserPrompt(input) }],
    systemMessage: SITUATING_CONTEXT_SYSTEM_PROMPT,
    temperature: 0,
    // MCON-14: per-call output cap - a one-sentence situating prefix.
    maxTokens: 256,
    ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
  };
  try {
    const response = await provider.generate(request);
    const prefix = (response.text ?? '').trim();
    if (prefix.length === 0) {
      return { indexText: contextualize(input), usage: response.usage };
    }
    return { indexText: `${prefix}\n${input.text}`, usage: response.usage };
  } catch {
    // Contextualization is an enhancement, not a correctness requirement -
    // a provider failure must never wedge the underlying write. Fall back
    // to the deterministic late-chunk prefix at zero cost.
    return { indexText: contextualize(input), usage: ZERO_USAGE };
  }
}

function buildSituatingUserPrompt(input: ContextualizeInput): string {
  const hints: string[] = [];
  const subject = trimToUndefined(input.subject);
  const predicate = trimToUndefined(input.predicate);
  const object = trimToUndefined(input.object);
  if (subject !== undefined) hints.push(`subject=${subject}`);
  if (predicate !== undefined) hints.push(`predicate=${predicate}`);
  if (object !== undefined) hints.push(`object=${object}`);
  const tags = (input.tags ?? []).map((t) => t.trim()).filter((t) => t.length > 0);
  if (tags.length > 0) hints.push(`tags=${tags.join(', ')}`);
  const validFrom = trimToUndefined(input.validFrom);
  if (validFrom !== undefined) hints.push(`validFrom=${validFrom}`);
  const hintLine = hints.length > 0 ? `\nStructured hints: ${hints.join('; ')}` : '';
  return `Memory: ${input.text}${hintLine}`;
}

function trimToUndefined(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
