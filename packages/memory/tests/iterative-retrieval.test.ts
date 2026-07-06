import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import { NOOP_LOGGER, NOOP_TRACER } from '@graphorin/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createMemory } from '../src/index.js';
import {
  assessQueryDifficulty,
  buildGradeRequest,
  createProviderRetrievalGrader,
  DEFAULT_MAX_ITERATIONS,
  type DifficultyAssessment,
  type IterativeRetrievalDeps,
  type IterativeRetrievalResult,
  MAX_ITERATIONS_CEILING,
  parseGrade,
  RETRIEVAL_GRADE_SYSTEM_PROMPT,
  type RetrievalGrade,
  type RetrievalGrader,
  runIterativeRetrieval,
} from '../src/search/index.js';
import { createInMemoryStore, InMemoryEmbeddingRegistry } from './fixtures/in-memory-store.js';

// --------------------------------------------------------------------------
// Test doubles
// --------------------------------------------------------------------------

interface FakeHit {
  readonly id: string;
  readonly text: string;
}

/** Build loop deps over a static query→ids map; records every retrieve call. */
function makeDeps(
  byQuery: Record<string, ReadonlyArray<string>>,
  grader: RetrievalGrader | null,
): {
  readonly deps: IterativeRetrievalDeps<FakeHit>;
  readonly retrieveCalls: Array<{ query: string; widen: boolean }>;
} {
  const retrieveCalls: Array<{ query: string; widen: boolean }> = [];
  const deps: IterativeRetrievalDeps<FakeHit> = {
    async retrieve(query, widen) {
      retrieveCalls.push({ query, widen });
      return (byQuery[query] ?? []).map((id) => ({ id, text: `text:${id}` }));
    },
    snippetOf: (hit) => hit.text,
    idOf: (hit) => hit.id,
    grader,
  };
  return { deps, retrieveCalls };
}

/** Grader that yields a fixed sequence of grades; records calls. */
function scriptGrader(sequence: ReadonlyArray<RetrievalGrade>): RetrievalGrader & {
  readonly grade: ReturnType<typeof vi.fn>;
} {
  let i = 0;
  const grade = vi.fn(async (): Promise<RetrievalGrade> => {
    const next = sequence[Math.min(i, sequence.length - 1)];
    i += 1;
    return next ?? { sufficient: true, confidence: 1, reformulation: null };
  });
  return { grade };
}

/** Provider stub returning a fixed text sequence; records requests. */
function scriptProvider(texts: ReadonlyArray<string>): Provider & {
  readonly calls: ProviderRequest[];
} {
  const calls: ProviderRequest[] = [];
  let i = 0;
  return {
    name: 'fake',
    modelId: 'fake:test',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 32_000,
      maxOutput: 4_000,
    },
    calls,
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      calls.push(req);
      const text = texts[Math.min(i, texts.length - 1)] ?? '';
      i += 1;
      return {
        text,
        usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        finishReason: 'stop',
      };
    },
    stream() {
      throw new Error('not implemented');
    },
  };
}

const SUFFICIENT: RetrievalGrade = { sufficient: true, confidence: 0.9, reformulation: null };
const insufficient = (reformulation: string | null): RetrievalGrade => ({
  sufficient: false,
  confidence: 0.2,
  reformulation,
});

// --------------------------------------------------------------------------
// Difficulty gate (pure, local)
// --------------------------------------------------------------------------

describe('assessQueryDifficulty (P2-4)', () => {
  it('leaves simple lookups single-shot (not hard)', () => {
    expect(assessQueryDifficulty('Where do I live?').hard).toBe(false);
    expect(assessQueryDifficulty("What is my dog's name?").hard).toBe(false);
    expect(assessQueryDifficulty('My favourite colour').hard).toBe(false);
    expect(assessQueryDifficulty('').score).toBe(0);
  });

  it('flags multi-hop questions as hard with the multi-hop signal', () => {
    const a = assessQueryDifficulty(
      'Who recommended the book that the person I met in Tbilisi told me about?',
    );
    expect(a.hard).toBe(true);
    expect(a.signals).toContain('multi-hop');
  });

  it('stacks temporal + multi-clause + multi-hop signals', () => {
    const a = assessQueryDifficulty(
      'What did I work on before I moved, and who was my manager then?',
    );
    expect(a.hard).toBe(true);
    expect(a.signals).toEqual(expect.arrayContaining(['multi-hop', 'temporal', 'multi-clause']));
    expect(a.score).toBeGreaterThanOrEqual(0.5);
  });

  it('honours a custom threshold', () => {
    expect(assessQueryDifficulty('what happened before').hard).toBe(false);
    expect(assessQueryDifficulty('what happened before', { threshold: 0.3 }).hard).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Grade parsing + request building
// --------------------------------------------------------------------------

describe('parseGrade (P2-4)', () => {
  it('parses a sufficient verdict and nulls any reformulation', () => {
    const g = parseGrade('{"sufficient": true, "confidence": 0.9, "reformulation": "ignored"}');
    expect(g.sufficient).toBe(true);
    expect(g.reformulation).toBeNull();
  });

  it('parses an insufficient verdict with a reformulation', () => {
    const g = parseGrade('{"sufficient": false, "confidence": 0.3, "reformulation": "try again"}');
    expect(g).toMatchObject({ sufficient: false, reformulation: 'try again' });
  });

  it('tolerates a fenced block and chatty surroundings', () => {
    expect(parseGrade('```json\n{"sufficient": false, "reformulation": "x"}\n```').sufficient).toBe(
      false,
    );
    expect(
      parseGrade('Sure! Here: {"sufficient": true, "reformulation": null} - done').sufficient,
    ).toBe(true);
  });

  it('coerces yes/no strings', () => {
    expect(parseGrade('{"sufficient": "yes"}').sufficient).toBe(true);
    expect(parseGrade('{"sufficient": "no", "reformulation": "r"}').sufficient).toBe(false);
  });

  it('clamps confidence to [0,1]', () => {
    expect(parseGrade('{"sufficient": true, "confidence": 9}').confidence).toBe(1);
    expect(parseGrade('{"sufficient": true, "confidence": -3}').confidence).toBe(0);
  });

  it('fails safe to a stop grade on undefined / empty / garbage', () => {
    const stop: RetrievalGrade = { sufficient: true, confidence: 0, reformulation: null };
    expect(parseGrade(undefined)).toEqual(stop);
    expect(parseGrade('')).toEqual(stop);
    expect(parseGrade('not json at all')).toEqual(stop);
    expect(parseGrade('{"confidence": 0.5}')).toEqual(stop); // no verdict field
  });
});

describe('buildGradeRequest (P2-4)', () => {
  it('numbers snippets and sets a deterministic, structured request', () => {
    const req = buildGradeRequest('q', ['alpha', 'beta'], { signal: new AbortController().signal });
    expect(req.systemMessage).toBe(RETRIEVAL_GRADE_SYSTEM_PROMPT);
    expect(req.temperature).toBe(0);
    expect(req.outputType).toEqual({ kind: 'structured' });
    expect(req.signal).toBeDefined();
    const content = req.messages[0]?.content ?? '';
    expect(content).toContain('[1] alpha');
    expect(content).toContain('[2] beta');
  });

  it('renders "(none)" when no snippets are retrieved', () => {
    expect(buildGradeRequest('q', []).messages[0]?.content).toContain('(none)');
  });
});

describe('createProviderRetrievalGrader (P2-4)', () => {
  it('parses a provider response', async () => {
    const provider = scriptProvider(['{"sufficient": false, "reformulation": "r"}']);
    const grade = await createProviderRetrievalGrader(provider).grade('q', ['s']);
    expect(grade).toMatchObject({ sufficient: false, reformulation: 'r' });
    expect(provider.calls).toHaveLength(1);
  });

  it('degrades to a stop grade when the provider throws', async () => {
    const provider: Provider = {
      ...scriptProvider([]),
      async generate() {
        throw new Error('boom');
      },
    };
    expect(await createProviderRetrievalGrader(provider).grade('q', ['s'])).toEqual({
      sufficient: true,
      confidence: 0,
      reformulation: null,
    });
  });
});

// --------------------------------------------------------------------------
// The bounded loop - the acceptance criteria
// --------------------------------------------------------------------------

describe('runIterativeRetrieval (P2-4)', () => {
  it('takes exactly one pass and never grades a non-hard query', async () => {
    const grader = scriptGrader([insufficient('x')]);
    const { deps, retrieveCalls } = makeDeps({ 'where do I live': ['a'] }, grader);
    const r = await runIterativeRetrieval('where do I live', deps);
    expect(r.iterations).toBe(1);
    expect(r.gateHard).toBe(false);
    expect(r.sufficient).toBe(true);
    expect(r.abstained).toBe(false);
    expect(grader.grade).not.toHaveBeenCalled();
    expect(retrieveCalls).toEqual([{ query: 'where do I live', widen: false }]);
  });

  it('stays single-shot when forced hard but no grader is configured', async () => {
    const { deps, retrieveCalls } = makeDeps({ q: ['a'] }, null);
    const r = await runIterativeRetrieval('q', deps, { forceHard: true });
    expect(r).toMatchObject({ iterations: 1, sufficient: true, abstained: false, gateHard: true });
    expect(retrieveCalls).toHaveLength(1);
  });

  it('graded=false on single-shot paths; graded=true once the grader actually ran (memory-retrieval-02)', async () => {
    // Single-shot (gate not hard): sufficient defaults true, but graded says so.
    const ungraded = await runIterativeRetrieval(
      'where do I live',
      makeDeps({ 'where do I live': ['a'] }, scriptGrader([SUFFICIENT])).deps,
    );
    expect(ungraded.graded).toBe(false);
    expect(ungraded.sufficient).toBe(true);
    // Single-shot (no grader): same default, same honesty flag.
    const noGrader = await runIterativeRetrieval('q', makeDeps({ q: ['a'] }, null).deps, {
      forceHard: true,
    });
    expect(noGrader.graded).toBe(false);
    // A graded pass - sufficient is now a real verdict.
    const graded = await runIterativeRetrieval(
      'q',
      makeDeps({ q: ['a'] }, scriptGrader([SUFFICIENT])).deps,
      { forceHard: true },
    );
    expect(graded.graded).toBe(true);
    expect(graded.sufficient).toBe(true);
    // An abstention is graded too.
    const abstained = await runIterativeRetrieval(
      'q',
      makeDeps({ q: ['a'] }, scriptGrader([insufficient(null)])).deps,
      { forceHard: true },
    );
    expect(abstained.graded).toBe(true);
    expect(abstained.abstained).toBe(true);
  });

  it('reformulates once then stops when sufficient (widening on pass 2)', async () => {
    const grader = scriptGrader([insufficient('better'), SUFFICIENT]);
    const { deps, retrieveCalls } = makeDeps({ q: ['a'], better: ['b'] }, grader);
    const r = await runIterativeRetrieval('q', deps, { forceHard: true });
    expect(r.iterations).toBe(2);
    expect(r.sufficient).toBe(true);
    expect(r.abstained).toBe(false);
    expect(r.queries).toEqual(['q', 'better']);
    expect(retrieveCalls).toEqual([
      { query: 'q', widen: false },
      { query: 'better', widen: true },
    ]);
  });

  it('enforces the iteration cap and abstains', async () => {
    const grader = scriptGrader([insufficient('r1'), insufficient('r2'), insufficient('r3')]);
    const { deps, retrieveCalls } = makeDeps({ q: ['a'], r1: ['b'], r2: ['c'] }, grader);
    const r = await runIterativeRetrieval('q', deps, { forceHard: true, maxIterations: 2 });
    expect(r.iterations).toBe(2);
    expect(r.sufficient).toBe(false);
    expect(r.abstained).toBe(true);
    expect(retrieveCalls).toHaveLength(2);
    expect(grader.grade).toHaveBeenCalledTimes(2);
  });

  it('clamps maxIterations to the ceiling', async () => {
    const grader = scriptGrader([
      insufficient('a'),
      insufficient('b'),
      insufficient('c'),
      insufficient('d'),
      insufficient('e'),
      insufficient('f'),
    ]);
    const { deps, retrieveCalls } = makeDeps(
      { q: ['0'], a: ['1'], b: ['2'], c: ['3'], d: ['4'] },
      grader,
    );
    const r = await runIterativeRetrieval('q', deps, { forceHard: true, maxIterations: 99 });
    expect(r.iterations).toBe(MAX_ITERATIONS_CEILING);
    expect(retrieveCalls).toHaveLength(MAX_ITERATIONS_CEILING);
  });

  it('abstains immediately when no reformulation is offered', async () => {
    const grader = scriptGrader([insufficient(null)]);
    const { deps, retrieveCalls } = makeDeps({ q: ['a'] }, grader);
    const r = await runIterativeRetrieval('q', deps, { forceHard: true });
    expect(r).toMatchObject({ iterations: 1, sufficient: false, abstained: true });
    expect(retrieveCalls).toHaveLength(1);
    expect(grader.grade).toHaveBeenCalledTimes(1);
  });

  it('never re-treads an already-tried query (cannot spin)', async () => {
    const grader = scriptGrader([insufficient('q')]); // proposes the original query back
    const { deps, retrieveCalls } = makeDeps({ q: ['a'] }, grader);
    const r = await runIterativeRetrieval('q', deps, { forceHard: true });
    expect(r.iterations).toBe(1);
    expect(r.abstained).toBe(true);
    expect(retrieveCalls).toHaveLength(1);
  });

  it('accumulates + dedups hits across passes (interleaved when no fuse is supplied)', async () => {
    const grader = scriptGrader([insufficient('r1'), SUFFICIENT]);
    const { deps } = makeDeps({ q: ['a', 'b'], r1: ['b', 'c'] }, grader);
    const all = await runIterativeRetrieval('q', deps, { forceHard: true });
    expect(all.hits.map((h) => h.id)).toEqual(['a', 'b', 'c']);
  });

  it('a pass-2 find reaches both the grade window and the final cut when pass 1 saturates (MRET-2)', async () => {
    // Pass 1 fills the whole default grade window (8) AND the final cut
    // with noise; the answer only arrives on the reformulation pass.
    const noise = Array.from({ length: 10 }, (_, i) => `n${i}`);
    const windows: string[][] = [];
    let calls = 0;
    const grader: RetrievalGrader = {
      async grade(_q, snippets) {
        windows.push([...snippets]);
        calls += 1;
        return calls === 1 ? insufficient('better query') : SUFFICIENT;
      },
    };
    const { deps } = makeDeps({ q: noise, 'better query': ['answer', 'n0'] }, grader);
    const r = await runIterativeRetrieval('q', deps, { forceHard: true, maxResults: 5 });
    expect(r.sufficient).toBe(true);
    // The re-grade window is NOT byte-identical to grade 1's - the
    // pass-2 answer snippet is in it (the old flat slice replayed
    // pass 1's head forever and the loop span to the cap).
    expect(windows[1]).toContain('text:answer');
    // And the answer survives the maxResults cut instead of being
    // dropped behind 10 discovery-ordered noise hits.
    expect(r.hits.map((h) => h.id)).toContain('answer');
  });

  it('always grades against the ORIGINAL question; reformulations ride as tried-context (MRET-11)', async () => {
    const graded: Array<{ query: string; tried: ReadonlyArray<string> | undefined }> = [];
    let calls = 0;
    const grader: RetrievalGrader = {
      async grade(q, _snippets, opts) {
        graded.push({ query: q, tried: opts?.triedQueries });
        calls += 1;
        return calls === 1 ? insufficient('narrow sub-question') : SUFFICIENT;
      },
    };
    const { deps } = makeDeps({ q: ['a'], 'narrow sub-question': ['b'] }, grader);
    await runIterativeRetrieval('q', deps, { forceHard: true });
    expect(graded[0]?.query).toBe('q');
    // The re-grade is judged against the ORIGINAL question - never the
    // narrowed reformulation (premature sufficient=true otherwise).
    expect(graded[1]?.query).toBe('q');
    expect(graded[1]?.tried).toEqual(['narrow sub-question']);
  });

  it('re-fuses per-pass lists through the injected fuse before the cut (MRET-2)', async () => {
    const grader = scriptGrader([insufficient('r1'), SUFFICIENT]);
    const { deps } = makeDeps({ q: ['a', 'b'], r1: ['c', 'a'] }, grader);
    // A fuse that ranks by cross-pass frequency then by name puts the
    // consensus hit first - the cut keeps it even at maxResults 1.
    const fused = await runIterativeRetrieval(
      'q',
      {
        ...deps,
        fuse: (lists) => {
          const score = new Map<string, number>();
          for (const list of lists) {
            for (const hit of list) score.set(hit.id, (score.get(hit.id) ?? 0) + 1);
          }
          const byId = new Map(lists.flat().map((h) => [h.id, h]));
          return [...byId.values()].sort(
            (x, y) => (score.get(y.id) ?? 0) - (score.get(x.id) ?? 0) || x.id.localeCompare(y.id),
          );
        },
      },
      { forceHard: true, maxResults: 1 },
    );
    expect(fused.hits.map((h) => h.id)).toEqual(['a']); // seen by BOTH passes
  });
});

// --------------------------------------------------------------------------
// End-to-end through createMemory
// --------------------------------------------------------------------------

describe('searchIterative + deep_recall wiring (P2-4)', () => {
  it('registers deep_recall (twelfth tool) only when iterativeRetrieval is configured', () => {
    const offline = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    expect(offline.tools.length).toBe(11);
    expect(offline.tools.map((t) => t.name)).not.toContain('deep_recall');

    const deep = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      iterativeRetrieval: { provider: scriptProvider([]) },
    });
    expect(deep.tools.length).toBe(12);
    expect(deep.tools.map((t) => t.name)).toContain('deep_recall');
  });

  it('offline default: searchIterative runs one pass with no provider call', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const scope = { userId: 'alex' };
    await memory.semantic.remember(scope, { text: 'tbilisi trip notes' });
    const r = await memory.semantic.searchIterative(scope, 'tbilisi', { forceHard: true });
    expect(r.iterations).toBe(1);
    expect(r.sufficient).toBe(true);
    expect(r.abstained).toBe(false);
  });

  it('W-088: per-call difficultyThreshold lowers the gate for a single multi-hop query', async () => {
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
    });
    const scope = { userId: 'alex' };
    await memory.semantic.remember(scope, { text: 'sushi recommendation from Nino' });

    // One lone multi-hop signal scores 0.4: below the default 0.5 gate,
    // above an explicit 0.3.
    const query = 'who recommended sushi';
    const byDefault = await memory.semantic.searchIterative(scope, query);
    expect(byDefault.gateHard).toBe(false);

    const lowered = await memory.semantic.searchIterative(scope, query, {
      difficultyThreshold: 0.3,
    });
    expect(lowered.gateHard).toBe(true);
  });

  it('W-088: iterativeRetrieval.difficultyThreshold reaches the gate as the facade default', async () => {
    const provider = scriptProvider(['{"sufficient": true, "confidence": 0.9}']);
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      iterativeRetrieval: { provider, difficultyThreshold: 0.3 },
    });
    const scope = { userId: 'alex' };
    await memory.semantic.remember(scope, { text: 'sushi recommendation from Nino' });

    const r = await memory.semantic.searchIterative(scope, 'who recommended sushi');
    expect(r.gateHard).toBe(true);
    // Per-call still wins over the facade default.
    const strict = await memory.semantic.searchIterative(scope, 'who recommended sushi', {
      difficultyThreshold: 0.9,
    });
    expect(strict.gateHard).toBe(false);
  });

  it('hard query: reformulation surfaces a fact the first pass missed', async () => {
    const provider = scriptProvider([
      '{"sufficient": false, "confidence": 0.2, "reformulation": "sapiens"}',
      '{"sufficient": true, "confidence": 0.9, "reformulation": null}',
    ]);
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      iterativeRetrieval: { provider },
    });
    const scope = { userId: 'alex' };
    const a = await memory.semantic.remember(scope, { text: 'tbilisi trip notes' });
    const b = await memory.semantic.remember(scope, { text: 'sapiens recommendation' });

    // Pass 1 ("tbilisi") FTS-matches only `a`; the grader reformulates to
    // "sapiens", which pass 2 matches - so the loop recovers `b`.
    const r = await memory.semantic.searchIterative(scope, 'tbilisi', { forceHard: true });
    expect(r.iterations).toBe(2);
    expect(r.sufficient).toBe(true);
    expect(r.queries).toEqual(['tbilisi', 'sapiens']);
    expect(r.hits.map((h) => h.record.id).sort()).toEqual([a.id, b.id].sort());
    expect(provider.calls).toHaveLength(2);
  });

  it('deep_recall tool surfaces abstention when memory is insufficient', async () => {
    const provider = scriptProvider([
      '{"sufficient": false, "confidence": 0.1, "reformulation": "missing-term"}',
      '{"sufficient": false, "confidence": 0.1, "reformulation": "still-missing"}',
    ]);
    const scope = { userId: 'alex' };
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      iterativeRetrieval: { provider },
      resolveScope: () => scope,
    });
    await memory.semantic.remember(scope, { text: 'tbilisi trip notes' });
    const tool = memory.tools.find((t) => t.name === 'deep_recall');
    expect(tool).toBeDefined();
    // A genuinely hard query (multi-hop + temporal + multi-clause) so the
    // real difficulty gate - not a `forceHard` override - admits it to the
    // loop; the seeded memory can't answer it, so the tool abstains.
    const out = (await tool?.execute(
      { query: 'who did the person I met before recommend, and which book?', maxIterations: 2 },
      makeCtx(),
    )) as { abstained: boolean; sufficient: boolean; graded: boolean; iterations: number };
    expect(out.abstained).toBe(true);
    expect(out.sufficient).toBe(false);
    expect(out.graded).toBe(true);
    expect(out.iterations).toBe(2);
  });

  it('deep_recall forces the loop: even a simple query gets GRADED (memory-retrieval-02)', async () => {
    // Pre-fix the local difficulty gate (W_MULTI_HOP 0.4 < threshold
    // 0.5, English-only regexes) rejected the tool's own documented
    // examples, so deep_recall returned single-shot `sufficient: true`
    // without any grading. The model choosing deep_recall IS the
    // hardness signal - the tool now passes forceHard.
    const provider = scriptProvider([
      '{"sufficient": true, "confidence": 0.9, "reformulation": null}',
    ]);
    const scope = { userId: 'alex' };
    const memory = createMemory({
      store: createInMemoryStore(),
      embeddings: new InMemoryEmbeddingRegistry(),
      iterativeRetrieval: { provider },
      resolveScope: () => scope,
    });
    await memory.semantic.remember(scope, { text: 'tbilisi trip notes' });
    const tool = memory.tools.find((t) => t.name === 'deep_recall');
    const out = (await tool?.execute({ query: 'tbilisi' }, makeCtx())) as {
      sufficient: boolean;
      graded: boolean;
      iterations: number;
    };
    // The grader RAN (one provider call) - a simple query is no longer
    // waved through ungraded.
    expect(provider.calls).toHaveLength(1);
    expect(out.graded).toBe(true);
    expect(out.sufficient).toBe(true);
  });
});

// --------------------------------------------------------------------------
// Type-level contracts
// --------------------------------------------------------------------------

describe('iterative retrieval - type contracts (P2-4)', () => {
  it('exposes the documented public shapes', () => {
    expectTypeOf<DifficultyAssessment['hard']>().toEqualTypeOf<boolean>();
    expectTypeOf<DifficultyAssessment['signals']>().toEqualTypeOf<ReadonlyArray<string>>();
    expectTypeOf<RetrievalGrade['reformulation']>().toEqualTypeOf<string | null>();
    expectTypeOf<IterativeRetrievalResult<FakeHit>['abstained']>().toEqualTypeOf<boolean>();
    expectTypeOf(runIterativeRetrieval<FakeHit>).returns.resolves.toMatchTypeOf<
      IterativeRetrievalResult<FakeHit>
    >();
    expect(DEFAULT_MAX_ITERATIONS).toBe(3);
  });
});

function makeCtx(): import('@graphorin/core').ToolExecutionContext<unknown> {
  return {
    toolCallId: 'call_test',
    runContext: {} as never,
    signal: new AbortController().signal,
    tracer: NOOP_TRACER,
    logger: NOOP_LOGGER,
    secrets: {
      async require() {
        throw new Error('no secrets');
      },
    } as never,
    reportProgress() {},
    streamContent() {},
  };
}
