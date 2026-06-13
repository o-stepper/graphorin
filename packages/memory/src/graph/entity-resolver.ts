/**
 * Entity resolution for the lightweight in-SQLite relation graph (P2-1).
 *
 * Raw `subject` / `object` strings on facts fragment ("Anna", "Anna S.",
 * "my sister" become unrelated rows), which kills multi-hop recall. This
 * module folds them into **canonical entities** so the one-hop CTE can
 * traverse relationships. Resolution is layered, cheapest first:
 *
 *   1. **lexical** — exact match on the folded {@link normalizeEntityName}.
 *   2. **embedding** — cosine over candidate name vectors; `≥ mergeThreshold`
 *      reuses the match.
 *   3. **adjudication** — a middle similarity band (`[adjudicate, merge)`)
 *      is *ambiguous*; an opt-in LLM call (provider + `llmAdjudication`)
 *      decides. **Offline / by default the ambiguous band mints a new
 *      entity** — the resolver never auto-merges on weak evidence, because
 *      a wrong merge fuses two distinct people (the stated P2-1 risk).
 *
 * The pure policy ({@link resolveEntityDecision}) is provider-agnostic and
 * does no I/O; {@link EntityResolver} wires it to an injected store +
 * embedder + optional provider. With no embedder it degrades to
 * lexical-only — still useful, and still fully offline.
 *
 * @packageDocumentation
 */

import type {
  EmbedderProvider,
  Fact,
  Provider,
  ProviderRequest,
  SessionScope,
} from '@graphorin/core';
import type { EntityWithEmbedding, GraphMemoryStoreExt } from '../internal/storage-adapter.js';

/** Cosine `≥` this auto-reuses an existing entity (embedding match). */
export const DEFAULT_MERGE_THRESHOLD = 0.92;
/** Cosine in `[this, merge)` is *ambiguous* — adjudicate or mint new. */
export const DEFAULT_ADJUDICATE_THRESHOLD = 0.82;

/**
 * Outcome of the pure resolution policy. `match` reuses an existing
 * entity; `ambiguous` flags a middle-similarity candidate for the caller
 * to adjudicate (or conservatively reject); `new` mints a fresh entity.
 *
 * @stable
 */
export type EntityResolveDecision =
  | {
      readonly kind: 'match';
      readonly entityId: string;
      readonly similarity: number;
      readonly via: 'lexical' | 'embedding';
    }
  | { readonly kind: 'ambiguous'; readonly entityId: string; readonly similarity: number }
  | { readonly kind: 'new' };

/** Minimal candidate shape the pure policy compares against. */
export interface ResolutionCandidate {
  readonly id: string;
  readonly normalizedName: string;
  readonly vector: Float32Array | null;
  /**
   * MST-11: the embedder that produced `vector`. When both this and the
   * query's `vectorEmbedderId` are known and differ, the candidate is skipped
   * for embedding comparison — vectors from different models live in different
   * spaces, so their cosine is meaningless. Absent on either side ⇒ compared
   * (byte-identical to the prior behaviour).
   */
  readonly embedderId?: string | null;
}

/** Inputs to {@link resolveEntityDecision} (all provided by the caller). */
export interface ResolveDecisionInput {
  readonly normalizedName: string;
  readonly vector?: Float32Array | null;
  /** MST-11: the embedder that produced `vector` (gates cross-embedder cosine). */
  readonly vectorEmbedderId?: string | null;
  readonly candidates: ReadonlyArray<ResolutionCandidate>;
  readonly mergeThreshold: number;
  readonly adjudicateThreshold: number;
}

/**
 * Fold an entity surface form into a canonical lexical key: Unicode
 * NFKC, lowercased, internal whitespace collapsed, surrounding
 * punctuation stripped. `"  Anna S. "` → `"anna s"`. Returns `''` for a
 * name with no letters/digits (the resolver treats that as "no entity").
 *
 * @stable
 */
export function normalizeEntityName(name: string): string {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

/**
 * Cosine similarity of two embeddings in `[-1, 1]`. Compares over the
 * shorter length and returns `0` when either vector is empty / zero-norm.
 *
 * @stable
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

/**
 * Pure resolution policy: lexical exact match → embedding cosine →
 * ambiguous band → new. No I/O; deterministic. The caller decides what
 * to do with `ambiguous` (LLM adjudicate, or conservatively mint new).
 *
 * @stable
 */
export function resolveEntityDecision(input: ResolveDecisionInput): EntityResolveDecision {
  // 1. Exact lexical match is the cheapest + strongest signal.
  for (const c of input.candidates) {
    if (c.normalizedName === input.normalizedName) {
      return { kind: 'match', entityId: c.id, similarity: 1, via: 'lexical' };
    }
  }
  // 2. Embedding similarity (only when both sides have a vector).
  const v = input.vector;
  if (v === undefined || v === null || v.length === 0) return { kind: 'new' };
  let bestId: string | null = null;
  let bestSim = Number.NEGATIVE_INFINITY;
  for (const c of input.candidates) {
    if (c.vector === null || c.vector.length === 0) continue;
    // MST-11: never compare vectors across embedders — different models live
    // in different vector spaces, so their cosine is meaningless. Skip only
    // when both embedder ids are known and differ.
    if (
      input.vectorEmbedderId != null &&
      c.embedderId != null &&
      c.embedderId !== input.vectorEmbedderId
    ) {
      continue;
    }
    const sim = cosineSimilarity(v, c.vector);
    if (sim > bestSim) {
      bestSim = sim;
      bestId = c.id;
    }
  }
  if (bestId === null) return { kind: 'new' };
  if (bestSim >= input.mergeThreshold) {
    return { kind: 'match', entityId: bestId, similarity: bestSim, via: 'embedding' };
  }
  if (bestSim >= input.adjudicateThreshold) {
    return { kind: 'ambiguous', entityId: bestId, similarity: bestSim };
  }
  return { kind: 'new' };
}

/** Tunable thresholds + LLM-adjudication switch for {@link EntityResolver}. */
export interface EntityResolutionConfig {
  /** Cosine `≥` this auto-reuses a match. Default {@link DEFAULT_MERGE_THRESHOLD}. */
  readonly mergeThreshold?: number;
  /** Cosine in `[this, merge)` is ambiguous. Default {@link DEFAULT_ADJUDICATE_THRESHOLD}. */
  readonly adjudicateThreshold?: number;
  /**
   * Resolve the ambiguous band with one provider call. Requires a
   * `provider`. Default `false` ⇒ ambiguous mints a new entity (no
   * network call; never auto-merges on weak evidence).
   */
  readonly llmAdjudication?: boolean;
}

/** Construction deps for {@link EntityResolver}. */
export interface EntityResolverDeps {
  readonly store: GraphMemoryStoreExt;
  readonly embedder?: EmbedderProvider | null;
  readonly embedderId?: () => string | null;
  readonly provider?: Provider | null;
  readonly config?: EntityResolutionConfig;
}

const ADJUDICATION_SYSTEM_PROMPT =
  'You decide whether two short names refer to the SAME real-world entity ' +
  '(person, place, org, thing). Reply with a single word: "yes" or "no". ' +
  'Be conservative — answer "no" unless they are clearly the same entity.';

/** Build the (pure) adjudication request. Exposed for testing. */
export function buildAdjudicationRequest(
  nameA: string,
  nameB: string,
  options: { readonly signal?: AbortSignal } = {},
): ProviderRequest {
  return {
    messages: [{ role: 'user', content: `Name A: ${nameA}\nName B: ${nameB}\nSame entity?` }],
    systemMessage: ADJUDICATION_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: 4,
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  };
}

/** Parse a yes/no adjudication reply. Conservative: only a clear yes is `true`. */
export function parseAdjudication(text: string): boolean {
  return /^\s*(yes|true|same)\b/i.test(text);
}

/**
 * Resolves a fact's subject / object strings to canonical entity ids and
 * links them, applying {@link resolveEntityDecision} backed by an
 * injected store + embedder (+ optional provider for adjudication).
 * Constructed only when entity resolution is opted in
 * (`createMemory({ graph: { entityResolution: true } })`); otherwise the
 * write path skips it and behaviour is unchanged + offline.
 *
 * @stable
 */
export class EntityResolver {
  readonly #store: GraphMemoryStoreExt;
  readonly #embedder: EmbedderProvider | null;
  readonly #embedderId: () => string | null;
  readonly #provider: Provider | null;
  readonly #mergeThreshold: number;
  readonly #adjudicateThreshold: number;
  readonly #llmAdjudication: boolean;

  constructor(deps: EntityResolverDeps) {
    this.#store = deps.store;
    this.#embedder = deps.embedder ?? null;
    this.#embedderId = deps.embedderId ?? (() => null);
    this.#provider = deps.provider ?? null;
    this.#mergeThreshold = deps.config?.mergeThreshold ?? DEFAULT_MERGE_THRESHOLD;
    this.#adjudicateThreshold = deps.config?.adjudicateThreshold ?? DEFAULT_ADJUDICATE_THRESHOLD;
    this.#llmAdjudication = deps.config?.llmAdjudication ?? false;
  }

  /**
   * Resolve a single name to a canonical entity id (find-or-create),
   * deduping via lexical + embedding similarity. Returns `null` for a
   * name that normalizes to empty (no entity).
   */
  async resolve(
    scope: SessionScope,
    rawName: string,
    opts: { readonly signal?: AbortSignal } = {},
  ): Promise<string | null> {
    const normalizedName = normalizeEntityName(rawName);
    if (normalizedName.length === 0) return null;
    // 1. Exact lexical match — the cheapest, strongest signal. Resolve it via
    //    an uncapped indexed lookup so an alias of an arbitrarily-old entity
    //    dedups without scanning (and deserializing) the bounded candidate
    //    window, and short-circuits before any embedding call (CS-11). Stores
    //    that don't implement it fall through to the capped lexical scan below.
    const exact = await this.#store.findEntityByNormalizedName?.(scope, normalizedName);
    if (exact != null) return exact.id;
    const vector = await this.#embed(rawName, opts.signal);
    // 2. Without a query vector, embedding dedup is impossible — skip the
    //    BLOB-deserializing candidate scan entirely and mint a new entity.
    if (vector === null || vector.length === 0) {
      return this.#create(scope, rawName, normalizedName, vector);
    }
    const candidates = await this.#store.listEntities(scope);
    const decision = resolveEntityDecision({
      normalizedName,
      vector,
      vectorEmbedderId: this.#embedderId(),
      candidates,
      mergeThreshold: this.#mergeThreshold,
      adjudicateThreshold: this.#adjudicateThreshold,
    });
    if (decision.kind === 'match') return decision.entityId;
    if (decision.kind === 'ambiguous') {
      if (this.#llmAdjudication && this.#provider !== null) {
        const same = await this.#adjudicate(rawName, decision.entityId, candidates, opts.signal);
        if (same) return decision.entityId;
      }
      // Conservative default: weak evidence ⇒ a distinct new entity.
    }
    return this.#create(scope, rawName, normalizedName, vector);
  }

  /**
   * Resolve + link a fact's subject and object (the predicate is a
   * relation label, never an entity). Idempotent on re-link.
   */
  async linkFact(
    scope: SessionScope,
    fact: Fact,
    opts: { readonly signal?: AbortSignal } = {},
  ): Promise<void> {
    if (fact.subject !== undefined) {
      const id = await this.resolve(scope, fact.subject, opts);
      if (id !== null) await this.#store.linkFactEntity(fact.id, id, 'subject');
    }
    if (fact.object !== undefined) {
      const id = await this.resolve(scope, fact.object, opts);
      if (id !== null) await this.#store.linkFactEntity(fact.id, id, 'object');
    }
  }

  async #embed(name: string, signal?: AbortSignal): Promise<Float32Array | null> {
    const embedder = this.#embedder;
    if (embedder === null || this.#embedderId() === null) return null;
    void signal;
    try {
      const [vector] = await embedder.embed([name]);
      return vector ?? null;
    } catch {
      return null;
    }
  }

  async #create(
    scope: SessionScope,
    name: string,
    normalizedName: string,
    vector: Float32Array | null,
  ): Promise<string> {
    const embedderId = this.#embedderId();
    return this.#store.upsertEntity(scope, {
      name,
      normalizedName,
      ...(vector !== null ? { vector } : {}),
      ...(vector !== null && embedderId !== null ? { embedderId } : {}),
    });
  }

  async #adjudicate(
    name: string,
    candidateId: string,
    candidates: ReadonlyArray<EntityWithEmbedding>,
    signal?: AbortSignal,
  ): Promise<boolean> {
    const provider = this.#provider;
    if (provider === null) return false;
    const candidate = candidates.find((c) => c.id === candidateId);
    if (candidate === undefined) return false;
    try {
      const request = buildAdjudicationRequest(name, candidate.name, {
        ...(signal !== undefined ? { signal } : {}),
      });
      const response = await provider.generate(request);
      return parseAdjudication(response.text ?? '');
    } catch {
      return false;
    }
  }
}
