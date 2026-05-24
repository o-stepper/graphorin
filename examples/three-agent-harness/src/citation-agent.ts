/**
 * Graphorin v0.3.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Minimal `createCitationAgent({...})` post-processing helper used by
 * the research-and-decide variant. Bound to the harness example only —
 * not exported from the framework packages.
 *
 *   1. Split each draft "claim" by sentence (period / question /
 *      exclamation boundary).
 *   2. Match each claim against the supplied source list using a
 *      simple lowercased substring overlap heuristic.
 *   3. Emit the rewritten draft with `[Source N]` superscripts
 *      appended inline (`mode: 'inline'`).
 *   4. Increment the `agent.citation.bound.total` /
 *      `agent.citation.unbound.total` counters via the supplied
 *      `Tracer` if one is wired; otherwise count in-memory and
 *      surface the totals on the result.
 */

import type { Tracer } from '@graphorin/core';

/** Where to render the `[Source N]` markers in the rewritten draft. */
export type CitationMode = 'inline' | 'footnote';

/** Bare-minimum source descriptor consumed by the helper. */
export interface CitationSource {
  readonly id: string;
  readonly text: string;
  readonly url?: string;
}

/** Per-claim binding decision returned by the helper. */
export interface CitationBinding {
  readonly claim: string;
  readonly sourceIds: ReadonlyArray<string>;
  readonly bound: boolean;
}

/** Aggregate result returned by {@link CitationAgent.bind}. */
export interface CitationResult {
  readonly text: string;
  readonly bindings: ReadonlyArray<CitationBinding>;
  readonly boundCount: number;
  readonly unboundCount: number;
}

/** Public surface returned by {@link createCitationAgent}. */
export interface CitationAgent {
  readonly mode: CitationMode;
  readonly sources: ReadonlyArray<CitationSource>;
  bind(draft: string): CitationResult;
}

/** Options accepted by {@link createCitationAgent}. */
export interface CreateCitationAgentOptions {
  readonly sources: ReadonlyArray<CitationSource>;
  readonly mode?: CitationMode;
  /**
   * Optional tracer used to emit
   * `agent.citation.bound.total` / `agent.citation.unbound.total`
   * counters. The framework `Tracer` shape currently only spans /
   * counts spans, so we duck-type a `recordCounter(name, n)`
   * affordance — when the supplied tracer does not implement it,
   * the helper falls back to in-memory accumulation.
   */
  readonly tracer?: Tracer;
}

/** Threshold (0..1) for "this claim overlaps enough with this source". */
const SUBSTRING_OVERLAP_THRESHOLD = 0.2;

/**
 * Build a citation post-processor. Intentionally minimal (no embeddings,
 * no LLM judge, no retrieval index).
 */
export function createCitationAgent(options: CreateCitationAgentOptions): CitationAgent {
  const mode: CitationMode = options.mode ?? 'inline';
  const sources = options.sources;
  const tracer = options.tracer;
  const sourceIndexById = new Map(sources.map((s, i) => [s.id, i + 1] as const));

  function recordCounter(name: string, n: number): void {
    if (n <= 0) return;
    const t = tracer as { readonly recordCounter?: (n: string, v: number) => void } | undefined;
    if (typeof t?.recordCounter === 'function') {
      t.recordCounter(name, n);
    }
  }

  function bind(draft: string): CitationResult {
    const claims = splitClaims(draft);
    const bindings: CitationBinding[] = [];
    const renderedClaims: string[] = [];
    let boundCount = 0;
    let unboundCount = 0;

    for (const claim of claims) {
      const matches: string[] = [];
      const lowerClaim = claim.toLowerCase();
      for (const source of sources) {
        if (overlapScore(lowerClaim, source.text.toLowerCase()) >= SUBSTRING_OVERLAP_THRESHOLD) {
          matches.push(source.id);
        }
      }
      const bound = matches.length > 0;
      bindings.push({ claim, sourceIds: matches, bound });
      if (bound) {
        boundCount += 1;
        const labels = matches
          .map((id) => sourceIndexById.get(id))
          .filter((n): n is number => typeof n === 'number')
          .map((n) => `[Source ${n}]`);
        renderedClaims.push(mode === 'inline' ? `${claim.trimEnd()} ${labels.join(' ')}` : claim);
      } else {
        unboundCount += 1;
        renderedClaims.push(claim);
      }
    }

    recordCounter('agent.citation.bound.total', boundCount);
    recordCounter('agent.citation.unbound.total', unboundCount);

    const text =
      mode === 'inline'
        ? renderedClaims.join(' ')
        : renderFootnotes(renderedClaims, bindings, sourceIndexById, sources);

    return { text, bindings, boundCount, unboundCount };
  }

  return { mode, sources, bind };
}

function splitClaims(draft: string): ReadonlyArray<string> {
  return draft
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Lowercased word-overlap heuristic: count how many >=4-letter words
 * from the claim appear in the source. Returns the ratio of matched
 * words / total qualifying words, in `[0, 1]`. The 4-letter floor
 * avoids matching against `the`, `and`, `a`, etc.
 */
function overlapScore(loweredClaim: string, loweredSource: string): number {
  const words = loweredClaim.match(/[a-z][a-z0-9]{3,}/g) ?? [];
  if (words.length === 0) return 0;
  let hits = 0;
  for (const w of words) {
    if (loweredSource.includes(w)) hits += 1;
  }
  return hits / words.length;
}

function renderFootnotes(
  renderedClaims: ReadonlyArray<string>,
  bindings: ReadonlyArray<CitationBinding>,
  sourceIndexById: ReadonlyMap<string, number>,
  sources: ReadonlyArray<CitationSource>,
): string {
  const body = renderedClaims.join(' ');
  const footnotes: string[] = [];
  for (const b of bindings) {
    if (!b.bound) continue;
    for (const id of b.sourceIds) {
      const idx = sourceIndexById.get(id);
      if (idx === undefined) continue;
      const src = sources[idx - 1];
      if (src === undefined) continue;
      const url = src.url ?? src.id;
      const line = `[Source ${idx}] ${url}`;
      if (!footnotes.includes(line)) footnotes.push(line);
    }
  }
  return footnotes.length > 0 ? `${body}\n\n---\n${footnotes.join('\n')}` : body;
}
