/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Memory deep-dive acceptance demo: one flow over a `:memory:` SQLite
 * store that walks the release-line 0.4 memory program end-to-end,
 * fully offline and deterministic (stub embedder + scripted provider,
 * no network, no model downloads):
 *
 *  1. `createMemory` over `createSqliteStore({ path: ':memory:' })`
 *     with the deterministic hash embedder and the entity graph
 *     enabled (`graph: { entityResolution: true }`), then a small cast
 *     of related facts (people / places with s/p/o triples).
 *  2. Graph recall: `semantic.search(..., { expandHops: 1 })` pulls a
 *     fact that baseline (no-hop) recall cannot reach, and the flow
 *     names the canonical entity that linked it.
 *  3. Deep recall: `semantic.searchIterative(...)` drives the gated
 *     grade-then-reformulate loop on a scripted grader - one question
 *     gets a confident graded answer, one deliberately unanswerable
 *     question ABSTAINS instead of confabulating.
 *  4. Quarantine: a synthesized (`provenance: 'extraction'`) fact is
 *     born quarantined, invisible to default recall, then promoted via
 *     `semantic.validate(...)` and becomes recallable.
 *  5. Insights read tier: a reflection-shaped insight is inserted,
 *     promoted via `insights.validate(...)`, and read back through
 *     `memory.insights.list(...)` / `.search(...)`.
 */

import process from 'node:process';
import type { Fact, Insight, MemoryHit, SessionScope } from '@graphorin/core';
import { isMainModule, optionalTracerFromEnv } from '@graphorin/example-trace-helper';
import {
  createMemory,
  type FactInput,
  type IterativeRecallResult,
  type Memory,
  type MemoryStoreAdapter,
} from '@graphorin/memory';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };
import {
  createScriptedProvider,
  gradeResponse,
  type ScriptedProvider,
} from './scripted-provider.js';
import { createStubEmbedder } from './stub-embedder.js';

export const VERSION: string = pkg.version;

/** Fixed scope for the whole demo - every field set so record literals stay exact. */
export const DEMO_SCOPE = Object.freeze({
  userId: 'ana',
  sessionId: 'memory-graph-recall-demo',
  agentId: 'memory-graph-recall',
}) satisfies SessionScope;

/**
 * The small cast. `subject` / `object` become canonical entities in the
 * relation graph, so recall can hop `Marta -> Horizon Labs -> robotics
 * kit` even when the query never mentions the hop fact's words.
 */
export const CAST_FACTS: ReadonlyArray<FactInput> = Object.freeze([
  {
    text: 'Marta lives in Tbilisi.',
    subject: 'Marta',
    predicate: 'lives_in',
    object: 'Tbilisi',
  },
  {
    text: 'Marta works at Horizon Labs.',
    subject: 'Marta',
    predicate: 'works_at',
    object: 'Horizon Labs',
  },
  {
    // The graph-hop target: shares ZERO tokens with HOP_QUERY, so the
    // FTS leg can never return it for that query; it is reachable only
    // through the shared canonical entity 'Horizon Labs' on the fact
    // above (plus, trivially, by querying its own words directly).
    text: 'Horizon Labs ships a robotics kit for schools.',
    subject: 'Horizon Labs',
    predicate: 'ships',
    object: 'robotics kit',
  },
  {
    text: "Giorgi is Marta's brother.",
    subject: 'Giorgi',
    predicate: 'sibling_of',
    object: 'Marta',
  },
  {
    text: 'Giorgi teaches chess on Saturdays.',
    subject: 'Giorgi',
    predicate: 'teaches',
    object: 'chess',
  },
  {
    text: 'Tbilisi sits on the Kura river.',
    subject: 'Tbilisi',
    predicate: 'sits_on',
    object: 'Kura river',
  },
]);

/** Stage-2 probe: lexically matches the Marta facts, never the hop fact. */
export const HOP_QUERY = 'Where does Marta work?';

/** Stage-3 question the memory CAN answer (fact 2 states the employer). */
export const ANSWERABLE_QUERY = 'Where does Marta work?';

/** Stage-3 question NO stored fact answers - the loop must abstain. */
export const UNANSWERABLE_QUERY = "What is the name of Marta's cat?";

/**
 * The grader script, in call order. The scripted provider is consulted
 * only by the retrieval grader (`iterativeRetrieval.provider`), so the
 * sequence is exact: 1 grade for the answerable question, then 2 for
 * the unanswerable one (insufficient + reformulation, then a widened
 * second pass still insufficient -> the loop hits its cap and abstains).
 */
export const GRADE_SCRIPT = Object.freeze([
  gradeResponse({
    sufficient: true,
    confidence: 0.92,
    reformulation: null,
    reason: 'A retrieved memory states the employer directly.',
  }),
  gradeResponse({
    sufficient: false,
    confidence: 0.2,
    reformulation: 'Does Marta have a pet?',
    reason: 'No retrieved memory mentions a pet.',
  }),
  gradeResponse({
    sufficient: false,
    confidence: 0.1,
    reformulation: null,
    reason: 'Still no pet facts after widening - abstain.',
  }),
]);

/** One line per stage; `main()` routes this to stdout. */
export type StageLogger = (line: string) => void;

/** Structured outcome of {@link runMemoryGraphRecall} (what the smoke test asserts on). */
export interface MemoryGraphRecallResult {
  /** Total facts persisted (cast + the quarantined stage-4 write). */
  readonly factsStored: number;
  /** Canonical entity display names resolved by the graph, sorted. */
  readonly entities: ReadonlyArray<string>;
  readonly hopRecall: {
    /** The hop-target fact id (stage-1 write of the robotics-kit fact). */
    readonly hopFactId: string;
    /** `true` when baseline (`expandHops` absent) recall missed the hop fact. */
    readonly baselineMissed: boolean;
    /** `true` when `expandHops: 1` recall returned the hop fact. */
    readonly expandedHit: boolean;
    /** `true` when the hop hit's only retrieval leg was the graph (`rrf.graph`). */
    readonly graphLegOnly: boolean;
    /** Display name of the canonical entity that linked seed and hop fact. */
    readonly linkedVia: string | null;
  };
  readonly deepRecall: {
    readonly answered: IterativeRecallResult;
    readonly unanswerable: IterativeRecallResult;
    /** Total grade calls the scripted provider served (expected: 3). */
    readonly gradeCalls: number;
  };
  readonly quarantine: {
    readonly factId: string;
    readonly bornQuarantined: boolean;
    readonly quarantineReason: 'injection' | 'synthesized' | null;
    /** Default recall excludes the quarantined fact. */
    readonly hiddenByDefault: boolean;
    /** The `includeQuarantined: true` inspector path sees it. */
    readonly visibleToInspector: boolean;
    /** After `semantic.validate(...)` default recall returns it. */
    readonly recallableAfterValidate: boolean;
  };
  readonly insight: {
    readonly insightId: string;
    /** Default insights read tier excludes it while quarantined. */
    readonly hiddenWhileQuarantined: boolean;
    /** After `insights.validate(...)` the default list returns it. */
    readonly readableAfterValidate: boolean;
    /** FTS `insights.search(...)` finds it after promotion. */
    readonly searchHit: boolean;
  };
  /** Registered memory tools (11 canonical + the gated `deep_recall`). */
  readonly toolCount: number;
  /** The final stats line `main()` prints (`memory-graph-recall: OK ...`). */
  readonly summaryLine: string;
}

/** Options accepted by {@link runMemoryGraphRecall}. */
export interface RunOptions {
  /** Stage-line sink. Defaults to a no-op (tests); `main()` wires stdout. */
  readonly log?: StageLogger;
  /** Process environment override - only read for `GRAPHORIN_TRACE`. */
  readonly env?: NodeJS.ProcessEnv;
}

/**
 * Run the five-stage memory walkthrough against a fresh `:memory:`
 * SQLite store. Deterministic: repeated runs produce the same stage
 * outcomes (ids differ, verdicts do not).
 */
export async function runMemoryGraphRecall(
  options: RunOptions = {},
): Promise<MemoryGraphRecallResult> {
  const log: StageLogger = options.log ?? (() => {});
  const env = options.env ?? process.env;
  const scope: SessionScope = DEMO_SCOPE;

  const store: GraphorinSqliteStore = await createSqliteStore({
    path: ':memory:',
    disableWalHardening: true,
  });
  await store.init();

  try {
    // ------------------------------------------------------------------
    // Stage 1 - createMemory + stub embedder + entity graph + cast facts.
    // ------------------------------------------------------------------
    // `store.memory` (the core `MemoryStoreExt`) is assignable to the
    // wider `MemoryStoreAdapter`; the adapter view types the optional
    // `graph` + `insights` surfaces the sqlite store implements.
    const adapter: MemoryStoreAdapter = store.memory;
    const embedder = createStubEmbedder();
    const provider: ScriptedProvider = createScriptedProvider(GRADE_SCRIPT);
    const tracer = optionalTracerFromEnv(env);

    const memory: Memory = createMemory({
      store: adapter,
      embeddings: store.embeddings,
      embedder,
      // P2-1: resolve each fact's subject/object to canonical entities
      // and link them, so `search(..., { expandHops: 1 })` can traverse.
      graph: { entityResolution: true },
      // P2-4: configure the retrieval grader so `searchIterative` can
      // grade + reformulate, and the gated `deep_recall` tool registers.
      iterativeRetrieval: { provider, maxIterations: 2 },
      // The demo never assembles a system prompt, so switch off the
      // context engine's default-on compaction (it would WARN once
      // about the missing `providerContextWindow` otherwise).
      contextEngine: { compaction: false },
      resolveScope: () => scope,
      ...(tracer !== undefined ? { tracer } : {}),
    });

    const castFacts: Fact[] = [];
    for (const input of CAST_FACTS) {
      castFacts.push(await memory.semantic.remember(scope, input));
    }
    const hopFact = castFacts[2];
    const seedFact = castFacts[1];
    if (hopFact === undefined || seedFact === undefined) {
      throw new Error('[graphorin/example-memory-graph-recall] cast write failed.');
    }

    // The facade already bound the embedder on construction; calling
    // `registerOrReturn` again with the same metadata is idempotent and
    // returns the persisted `embedding_meta` row - surfaced here so the
    // registration contract is visible in the demo output.
    const embedderMeta = store.embeddings.registerOrReturn({
      id: embedder.id(),
      embedderKind: 'stub',
      model: 'hash',
      dim: embedder.dim(),
      configHash: embedder.configHash(),
      distanceMetric: 'cosine',
    });

    const graph = adapter.graph;
    if (graph === undefined) {
      throw new Error(
        '[graphorin/example-memory-graph-recall] the sqlite adapter must expose the graph surface.',
      );
    }
    const stage1Entities = await graph.listEntities(scope, { limit: 100 });
    log(
      `stage 1 [store+graph]: stored ${castFacts.length} facts; embedder '${embedderMeta.id}' ` +
        `registered (dim=${embedderMeta.dim}, metric=${embedderMeta.distanceMetric}); ` +
        `entities=${stage1Entities.length}`,
    );

    // ------------------------------------------------------------------
    // Stage 2 - graph recall with expandHops: 1.
    // ------------------------------------------------------------------
    // `candidateTopK: 3` keeps the per-leg candidate lists tight so the
    // hop fact (zero token overlap with the query, near-orthogonal stub
    // vector) stays out of the FTS + vector legs: the ONLY way it can
    // enter the result is the one-hop entity expansion.
    const searchOpts = { topK: 8, candidateTopK: 3 } as const;
    const baseline = await memory.semantic.search(scope, HOP_QUERY, searchOpts);
    const expanded = await memory.semantic.search(scope, HOP_QUERY, {
      ...searchOpts,
      expandHops: 1,
    });

    const baselineMissed = !baseline.some((h) => h.record.id === hopFact.id);
    const hopHit = expanded.find((h) => h.record.id === hopFact.id);
    const graphLegOnly =
      hopHit !== undefined &&
      hopHit.signals !== undefined &&
      'rrf.graph' in hopHit.signals &&
      !Object.keys(hopHit.signals).some(
        (k) => k.startsWith('rrf.fts') || k.startsWith('rrf.vector') || k === 'rrf.hyde',
      );
    const linkedVia = await findLinkingEntity(graph, scope, hopFact.id, baseline);
    log(
      `stage 2 [hop-recall]: baseline ${baselineMissed ? 'missed' : 'UNEXPECTEDLY found'} ` +
        `"${hopFact.text}"; expandHops=1 ${hopHit !== undefined ? 'recalled it' : 'MISSED it'} ` +
        `via entity '${linkedVia ?? 'unknown'}' (graph-leg-only=${graphLegOnly ? 'yes' : 'no'})`,
    );

    // ------------------------------------------------------------------
    // Stage 3 - deep recall: graded loop + abstention.
    // ------------------------------------------------------------------
    // `forceHard: true` is the deliberate deep-recall switch (the same
    // flag the gated `deep_recall` tool sets); the scripted grader
    // answers the first question confidently and refuses the second
    // until the 2-pass cap trips -> `abstained: true`.
    const answered = await memory.semantic.searchIterative(scope, ANSWERABLE_QUERY, {
      forceHard: true,
      maxIterations: 2,
      topK: 5,
    });
    const unanswerable = await memory.semantic.searchIterative(scope, UNANSWERABLE_QUERY, {
      forceHard: true,
      maxIterations: 2,
      topK: 5,
    });
    log(
      `stage 3 [deep-recall]: answered "${ANSWERABLE_QUERY}" ` +
        `(sufficient=${answered.sufficient}, graded=${answered.graded}, ` +
        `iterations=${answered.iterations}); abstained on "${UNANSWERABLE_QUERY}" ` +
        `(abstained=${unanswerable.abstained}, iterations=${unanswerable.iterations}, ` +
        `gradeCalls=${provider.calls.length})`,
    );

    // ------------------------------------------------------------------
    // Stage 4 - fact_validate / quarantine.
    // ------------------------------------------------------------------
    // A synthesized write (`provenance: 'extraction'`) is born
    // quarantined (P1-4): persisted + auditable, but excluded from
    // action-driving recall until a human validates it.
    const quarantineProbe = 'Devfest keynote';
    const quarantined = await memory.semantic.rememberWithDecision(scope, {
      text: 'Marta is preparing a keynote for the Devfest conference.',
      subject: 'Marta',
      predicate: 'preparing',
      object: 'Devfest keynote',
      provenance: 'extraction',
      owner: 'agent',
    });
    const bornQuarantined = quarantined.fact.status === 'quarantined';
    const hiddenByDefault = !(await searchContains(
      memory,
      scope,
      quarantineProbe,
      quarantined.fact.id,
    ));
    const visibleToInspector = (
      await memory.semantic.search(scope, quarantineProbe, { topK: 8, includeQuarantined: true })
    ).some((h) => h.record.id === quarantined.fact.id);
    await memory.semantic.validate(scope, quarantined.fact.id, 'human-review: example operator');
    const recallableAfterValidate = await searchContains(
      memory,
      scope,
      quarantineProbe,
      quarantined.fact.id,
    );
    log(
      `stage 4 [quarantine]: synthesized fact born quarantined=${bornQuarantined ? 'yes' : 'no'} ` +
        `(reason=${quarantined.quarantineReason ?? 'none'}); default recall hidden=` +
        `${hiddenByDefault ? 'yes' : 'no'}; promoted via semantic.validate; recallable=` +
        `${recallableAfterValidate ? 'yes' : 'no'}`,
    );

    // ------------------------------------------------------------------
    // Stage 5 - insights read tier.
    // ------------------------------------------------------------------
    // The only framework WRITE path for insights is the consolidator's
    // reflection pass (P1-1) - `InsightMemory` is a read/validate tier
    // by design. The lowest-level SUPPORTED public surface is the
    // storage adapter's `InsightMemoryStoreExt.insert` (a `@stable`
    // export of `@graphorin/memory`, implemented by the default sqlite
    // adapter), so the demo inserts a record shaped exactly like a
    // reflection write: quarantined, `provenance: 'reflection'`,
    // starting salience 2, and MANDATORY citations.
    const insightsStore = adapter.insights;
    if (insightsStore === undefined) {
      throw new Error(
        '[graphorin/example-memory-graph-recall] the sqlite adapter must expose the insights surface.',
      );
    }
    const insight: Insight = {
      id: `ins_demo_${Date.now().toString(36)}`,
      kind: 'insight',
      userId: scope.userId,
      ...(scope.sessionId !== undefined ? { sessionId: scope.sessionId } : {}),
      ...(scope.agentId !== undefined ? { agentId: scope.agentId } : {}),
      text: 'Marta guards her Saturday family time, so avoid proposing Saturday work sessions.',
      cites: [seedFact.id, castFacts[3]?.id ?? seedFact.id, castFacts[4]?.id ?? seedFact.id],
      salience: 2,
      provenance: 'reflection',
      status: 'quarantined',
      owner: 'agent',
      sensitivity: 'internal',
      createdAt: new Date().toISOString(),
    };
    await insightsStore.insert(insight);

    const hiddenWhileQuarantined = !(await memory.insights.list(scope)).some(
      (i) => i.id === insight.id,
    );
    const pendingReview = await memory.insights.list(scope, { includeQuarantined: true });
    if (!pendingReview.some((i) => i.id === insight.id)) {
      throw new Error(
        '[graphorin/example-memory-graph-recall] inserted insight missing from inspector list.',
      );
    }
    await memory.insights.validate(scope, insight.id, 'human-review: example operator');
    const readableAfterValidate = (await memory.insights.list(scope)).some(
      (i) => i.id === insight.id,
    );
    const searchHit = (await memory.insights.search(scope, 'Saturday')).some(
      (h) => h.record.id === insight.id,
    );
    log(
      `stage 5 [insights]: reflection-shaped insight inserted (cites=${insight.cites.length}, ` +
        `quarantined-hidden=${hiddenWhileQuarantined ? 'yes' : 'no'}); promoted via ` +
        `insights.validate; readable=${readableAfterValidate ? 'yes' : 'no'}, ` +
        `searchable=${searchHit ? 'yes' : 'no'}`,
    );

    // ------------------------------------------------------------------
    // Summary.
    // ------------------------------------------------------------------
    const finalEntities = (await graph.listEntities(scope, { limit: 100 }))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));
    const factsStored = castFacts.length + 1;
    const hopRecallHit = hopHit !== undefined && baselineMissed;
    const summaryLine =
      `memory-graph-recall: OK facts=${factsStored} entities=${finalEntities.length} ` +
      `hopRecallHit=${hopRecallHit ? 'yes' : 'no'} hopEntity='${linkedVia ?? 'unknown'}' ` +
      `abstained=${unanswerable.abstained ? 'yes' : 'no'} ` +
      `quarantinePromoted=${recallableAfterValidate ? 'yes' : 'no'} ` +
      `insightReadable=${readableAfterValidate ? 'yes' : 'no'} ` +
      `gradeCalls=${provider.calls.length} tools=${memory.tools.length}`;

    return {
      factsStored,
      entities: finalEntities,
      hopRecall: {
        hopFactId: hopFact.id,
        baselineMissed,
        expandedHit: hopHit !== undefined,
        graphLegOnly,
        linkedVia,
      },
      deepRecall: {
        answered,
        unanswerable,
        gradeCalls: provider.calls.length,
      },
      quarantine: {
        factId: quarantined.fact.id,
        bornQuarantined,
        quarantineReason: quarantined.quarantineReason ?? null,
        hiddenByDefault,
        visibleToInspector,
        recallableAfterValidate,
      },
      insight: {
        insightId: insight.id,
        hiddenWhileQuarantined,
        readableAfterValidate,
        searchHit,
      },
      toolCount: memory.tools.length,
      summaryLine,
    };
  } finally {
    await store.close();
  }
}

/** Default-recall membership probe (no trust predicates loosened). */
async function searchContains(
  memory: Memory,
  scope: SessionScope,
  query: string,
  factId: string,
): Promise<boolean> {
  const hits = await memory.semantic.search(scope, query, { topK: 8 });
  return hits.some((h) => h.record.id === factId);
}

/**
 * Name the canonical entity that links the hop fact to any fact the
 * baseline recall already surfaced: walk the resolved entities and use
 * the store's exact `factsForEntityName` retriever to find one whose
 * linked fact set contains BOTH sides of the hop.
 */
async function findLinkingEntity(
  graph: NonNullable<MemoryStoreAdapter['graph']>,
  scope: SessionScope,
  hopFactId: string,
  baselineHits: ReadonlyArray<MemoryHit<Fact>>,
): Promise<string | null> {
  if (typeof graph.factsForEntityName !== 'function') return null;
  const entities = await graph.listEntities(scope, { limit: 100 });
  for (const entity of entities) {
    const linked = await graph.factsForEntityName(scope, entity.normalizedName, { limit: 50 });
    const ids = new Set(linked.map((f) => f.id));
    if (ids.has(hopFactId) && baselineHits.some((h) => ids.has(h.record.id))) {
      return entity.name;
    }
  }
  return null;
}

/**
 * CLI entry point: run the five stages, print one line per stage plus
 * the final `memory-graph-recall: OK ...` stats line, and exit 0. Any
 * broken stage invariant throws and exits non-zero.
 */
export async function main(args: { readonly env?: NodeJS.ProcessEnv } = {}): Promise<number> {
  const env = args.env ?? process.env;
  const result = await runMemoryGraphRecall({
    env,
    log: (line) => process.stdout.write(`${line}\n`),
  });
  const ok =
    result.hopRecall.expandedHit &&
    result.hopRecall.baselineMissed &&
    result.deepRecall.answered.sufficient &&
    result.deepRecall.unanswerable.abstained &&
    result.quarantine.bornQuarantined &&
    result.quarantine.hiddenByDefault &&
    result.quarantine.recallableAfterValidate &&
    result.insight.readableAfterValidate;
  if (!ok) {
    process.stderr.write(
      `graphorin v${VERSION} memory-graph-recall: stage invariant failed - ${result.summaryLine}\n`,
    );
    return 1;
  }
  process.stdout.write(`${result.summaryLine}\n`);
  return 0;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const exitCode = await main();
  if (exitCode !== 0) process.exit(exitCode);
}
