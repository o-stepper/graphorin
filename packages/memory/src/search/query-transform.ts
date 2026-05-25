/**
 * Query transformation for hybrid retrieval (P2-3) — **multi-query /
 * RAG-Fusion** and optional **HyDE**.
 *
 * Auto-recall is a regex trigger and the default search is single-shot:
 * the user's phrasing rarely matches how a memory was stored, so a
 * relevant fact is missed at the retrieval step. This module fans a
 * query into a few reworded variants (one cheap LLM call) and/or writes
 * a hypothetical answer passage to embed (HyDE, arXiv:2212.10496); the
 * caller retrieves each and fuses the lists through the existing RRF
 * reranker. Variant generation is the only thing that touches a
 * provider, so it is **opt-in**: with no transformer configured the
 * default search path stays fully offline and single-shot.
 *
 * The module is provider-agnostic — it imports only `@graphorin/core`
 * types and never performs I/O itself. The concrete `Provider` is
 * injected by the caller via {@link createProviderQueryTransformer},
 * which is resilient: any provider error or unparseable output degrades
 * to "no variants" / "no hypothetical" rather than throwing into the
 * search hot path.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest } from '@graphorin/core';

/** Default ceiling on reworded variants a provider-backed transformer requests. */
export const DEFAULT_MAX_QUERY_VARIANTS = 5;

/** Default output-token ceiling for a single transform call. */
const DEFAULT_TRANSFORM_MAX_TOKENS = 256;

/**
 * Pluggable query-transformation seam consumed by
 * `SemanticMemory.search(..., { multiQuery, hyde })`. The built-in
 * provider-backed implementation lives in
 * {@link createProviderQueryTransformer}; advanced callers can supply a
 * bespoke one (e.g. a deterministic synonym expander) to
 * `new SemanticMemory({ queryTransformer })`.
 *
 * Implementations MUST degrade gracefully — return `[]` / `null` rather
 * than throw — so a transform failure never breaks recall.
 *
 * @stable
 */
export interface QueryTransformer {
  /**
   * Rewrite a query into up to `count` **additional** reworded variants
   * (the original query is retained by the caller). Returns `[]` when
   * transformation is unavailable or the model returns nothing usable.
   */
  expand(
    query: string,
    count: number,
    options?: QueryTransformOptions,
  ): Promise<ReadonlyArray<string>>;
  /**
   * Generate a single short hypothetical-answer passage to embed (HyDE),
   * or `null` when unavailable. The caller embeds the passage and fuses
   * its vector neighbours into the result.
   */
  hypothetical(query: string, options?: QueryTransformOptions): Promise<string | null>;
}

/**
 * Per-call options for a {@link QueryTransformer}.
 *
 * @stable
 */
export interface QueryTransformOptions {
  /** Cancellation signal forwarded to the underlying provider call. */
  readonly signal?: AbortSignal;
}

/**
 * System prompt for multi-query variant generation. Asks for a bare
 * JSON array of standalone rephrasings that preserve the original
 * intent — {@link parseQueryVariants} also tolerates a chatty model.
 *
 * @internal
 */
export const QUERY_EXPANSION_SYSTEM_PROMPT =
  'You rewrite a search query into alternative phrasings to improve recall over a ' +
  'personal memory store. Preserve the original intent; vary vocabulary, specificity, ' +
  'and perspective so different wordings of the same stored memory are matched. ' +
  'Return ONLY a JSON array of strings — each a standalone query, no numbering, no ' +
  'commentary, no duplicates of the original.';

/**
 * System prompt for HyDE. Asks for a short, plausible hypothetical
 * answer (not a question rephrase) whose embedding sits near the
 * passage that would actually answer the query.
 *
 * @internal
 */
export const HYDE_SYSTEM_PROMPT =
  'Write a short, plausible hypothetical answer to the question, phrased as a ' +
  'first-person statement of fact as it might be recorded in a memory store. One to ' +
  'three sentences. Output only the passage — no preamble, no caveats, no markdown.';

/**
 * Build the multi-query expansion request. Pure — no I/O. A higher
 * temperature is used deliberately so the variants diverge (the
 * downstream retrieval + RRF fusion stays deterministic).
 *
 * @stable
 */
export function buildExpansionRequest(
  query: string,
  count: number,
  options: { readonly maxTokens?: number; readonly signal?: AbortSignal } = {},
): ProviderRequest {
  return {
    messages: [
      {
        role: 'user',
        content: `Original query: ${query}\nReturn up to ${count} alternative phrasings as a JSON array of strings.`,
      },
    ],
    systemMessage: QUERY_EXPANSION_SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: options.maxTokens ?? DEFAULT_TRANSFORM_MAX_TOKENS,
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
    outputType: { kind: 'structured' },
  };
}

/**
 * Build the HyDE pseudo-document request. Pure — no I/O.
 *
 * @stable
 */
export function buildHydeRequest(
  query: string,
  options: { readonly maxTokens?: number; readonly signal?: AbortSignal } = {},
): ProviderRequest {
  return {
    messages: [{ role: 'user', content: query }],
    systemMessage: HYDE_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: options.maxTokens ?? DEFAULT_TRANSFORM_MAX_TOKENS,
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  };
}

/**
 * Parse the variant-generation model output into a deduped, capped list
 * of reworded queries. Tolerates a JSON array, a `{ "variants": [...] }`
 * / `{ "queries": [...] }` wrapper, fenced blocks, and (as a last
 * resort) a newline / numbered list — so a chatty model never breaks
 * recall. Empty strings and case-insensitive duplicates are dropped;
 * the result is capped at `max`.
 *
 * @stable
 */
export function parseQueryVariants(text: string | undefined, max: number): ReadonlyArray<string> {
  if (max <= 0 || text === undefined) return [];
  const candidate = stripFence(text).trim();
  if (candidate.length === 0) return [];
  const raw = extractVariantStrings(candidate);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const trimmed = item.trim();
    if (trimmed.length === 0) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Parse the HyDE model output into a single passage, or `null` when the
 * model returned nothing usable. Strips a fenced block and trims.
 *
 * @stable
 */
export function parseHypothetical(text: string | undefined): string | null {
  if (text === undefined) return null;
  const trimmed = stripFence(text).trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Wrap a {@link Provider} as a {@link QueryTransformer}. Both methods
 * are **resilient**: a provider error or unparseable response degrades
 * to `[]` / `null` so transformation never throws into `search`. The
 * `maxVariants` ceiling caps the variants requested regardless of the
 * caller's `multiQuery` value (a latency guardrail).
 *
 * @stable
 */
export function createProviderQueryTransformer(
  provider: Provider,
  options: { readonly maxVariants?: number; readonly maxTokens?: number } = {},
): QueryTransformer {
  const maxVariants = Math.max(0, options.maxVariants ?? DEFAULT_MAX_QUERY_VARIANTS);
  const maxTokens = options.maxTokens ?? DEFAULT_TRANSFORM_MAX_TOKENS;
  return {
    async expand(query, count, opts = {}): Promise<ReadonlyArray<string>> {
      const want = Math.min(Math.max(0, count), maxVariants);
      if (want === 0 || query.trim().length === 0) return [];
      try {
        const request = buildExpansionRequest(query, want, {
          maxTokens,
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        });
        const response = await provider.generate(request);
        return parseQueryVariants(response.text, want);
      } catch {
        return [];
      }
    },
    async hypothetical(query, opts = {}): Promise<string | null> {
      if (query.trim().length === 0) return null;
      try {
        const request = buildHydeRequest(query, {
          maxTokens,
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        });
        const response = await provider.generate(request);
        return parseHypothetical(response.text);
      } catch {
        return null;
      }
    },
  };
}

/** Extract the raw (pre-dedup) variant strings from tolerant model output. */
function extractVariantStrings(candidate: string): ReadonlyArray<string> {
  const parsed = tryParseJson(candidate);
  if (parsed !== undefined) {
    const arr = Array.isArray(parsed) ? parsed : isRecord(parsed) ? pickArray(parsed) : null;
    if (arr !== null) {
      return arr.filter((v): v is string => typeof v === 'string');
    }
  }
  // Fallback — split a newline / numbered list and strip list markers.
  return candidate.split('\n').map((line) =>
    line
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/u, '')
      .replace(/^["']|["']$/gu, '')
      .trim(),
  );
}

function pickArray(record: Record<string, unknown>): ReadonlyArray<unknown> | null {
  if (Array.isArray(record.variants)) return record.variants;
  if (Array.isArray(record.queries)) return record.queries;
  return null;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const slice = sliceJson(text);
    if (slice === null) return undefined;
    try {
      return JSON.parse(slice);
    } catch {
      return undefined;
    }
  }
}

/** Slice the widest `[...]` array or `{...}` object out of chatty text. */
function sliceJson(text: string): string | null {
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart >= 0 && arrEnd > arrStart) return text.slice(arrStart, arrEnd + 1);
  const objStart = text.indexOf('{');
  const objEnd = text.lastIndexOf('}');
  if (objStart >= 0 && objEnd > objStart) return text.slice(objStart, objEnd + 1);
  return null;
}

function stripFence(text: string): string {
  const match = /^```[^\n]*\n([\s\S]*?)\n```/u.exec(text.trim());
  return match?.[1] ?? text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}
