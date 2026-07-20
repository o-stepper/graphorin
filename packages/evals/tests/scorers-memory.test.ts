import type { Provider, ProviderRequest, ProviderResponse } from '@graphorin/core';
import type { Case } from '@graphorin/observability/eval';
import { describe, expect, it } from 'vitest';

import type {
  MemoryGoldPoint,
  MemoryOperationsEvalInput,
  MemoryOperationsObservation,
} from '../src/index.js';
import {
  defaultMemoryPointMatcher,
  goldTokenCoverage,
  memoryExtractionPrecision,
  memoryExtractionRecall,
  memoryQaHallucination,
  memoryUpdateOmission,
  tokenF1,
  tokenF1Matcher,
} from '../src/scorers/index.js';

function makeCase(
  goldPoints: ReadonlyArray<MemoryGoldPoint>,
  extra: Partial<MemoryOperationsEvalInput> = {},
): Case<MemoryOperationsEvalInput, MemoryOperationsObservation> {
  return { id: 'c1', input: { haystackSessions: [], goldPoints, ...extra } };
}

function scoreArgs(
  c: Case<MemoryOperationsEvalInput, MemoryOperationsObservation>,
  output: MemoryOperationsObservation,
) {
  return { case: c, output, durationMs: 0 };
}

describe('tokenF1 matcher', () => {
  it('is symmetric, normalises punctuation/case and thresholds at minTokenF1', () => {
    expect(tokenF1('User lives in Berlin', 'the user LIVES in Berlin!')).toBeGreaterThan(0.5);
    expect(tokenF1('a', 'b')).toBe(0);
    expect(tokenF1('', 'anything')).toBe(0);
    const strict = tokenF1Matcher(0.9);
    expect(strict('User lives in Berlin', 'User lives in Berlin')).toBe(true);
    expect(strict('User lives in Berlin', 'User lives near Berlin in a flat')).toBe(false);
  });
});

describe('memoryExtractionRecall', () => {
  const gold: MemoryGoldPoint[] = [
    { kind: 'extract', content: 'User lives in Berlin' },
    { kind: 'extract', content: 'User works as a nurse' },
  ];

  it('scores the matched fraction of gold extract points', async () => {
    const scorer = memoryExtractionRecall();
    const r = await scorer.score(
      scoreArgs(makeCase(gold), {
        memoryPoints: ['The user lives in Berlin now.', 'User enjoys gardening'],
      }),
    );
    expect(r.score).toBeCloseTo(0.5);
    expect(r.pass).toBe(true); // default threshold 0.5
    expect(r.metadata?.missed).toEqual(['User works as a nurse']);
  });

  it('fails below the threshold and vacuously passes with no gold extracts', async () => {
    const scorer = memoryExtractionRecall({ passThreshold: 0.9 });
    const r = await scorer.score(scoreArgs(makeCase(gold), { memoryPoints: [] }));
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0);
    expect(r.reason).toContain('recall');

    const vacuous = await memoryExtractionRecall().score(
      scoreArgs(makeCase([{ kind: 'update', content: 'x', previous: 'y' }]), {
        memoryPoints: ['x'],
      }),
    );
    expect(vacuous.pass).toBe(true);
    expect(vacuous.score).toBe(1);
  });
});

describe('memoryExtractionPrecision', () => {
  it('treats update.previous as grounded (stale, not hallucinated)', async () => {
    const c = makeCase([
      { kind: 'extract', content: 'User works as a nurse' },
      { kind: 'update', content: 'User lives in Kyiv', previous: 'User lives in Berlin' },
    ]);
    const scorer = memoryExtractionPrecision();
    const r = await scorer.score(
      scoreArgs(c, {
        memoryPoints: [
          'User works as a nurse',
          'User lives in Berlin', // stale old value: grounded for precision
          'User owns a yacht', // hallucinated
        ],
      }),
    );
    expect(r.score).toBeCloseTo(2 / 3);
    expect(r.metadata?.hallucinated).toEqual(['User owns a yacht']);
  });

  it('vacuously passes when memory is empty', async () => {
    const r = await memoryExtractionPrecision().score(
      scoreArgs(makeCase([{ kind: 'extract', content: 'x' }]), { memoryPoints: [] }),
    );
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });
});

describe('memoryUpdateOmission', () => {
  const update: MemoryGoldPoint = {
    kind: 'update',
    content: 'User lives in Kyiv',
    previous: 'User lives in Berlin',
  };
  const del: MemoryGoldPoint = { kind: 'delete', content: 'User has a MusicApp subscription' };

  it('applied update = new present AND old absent; applied delete = content absent', async () => {
    const scorer = memoryUpdateOmission({ maxOmissionRate: 0 });
    const good = await scorer.score(
      scoreArgs(makeCase([update, del]), { memoryPoints: ['User lives in Kyiv'] }),
    );
    expect(good.pass).toBe(true);
    expect(good.score).toBe(1);
    expect(good.metadata?.omissionRate).toBe(0);
  });

  it('counts a surviving old value as omitted + stale', async () => {
    const scorer = memoryUpdateOmission({ maxOmissionRate: 0 });
    const r = await scorer.score(
      scoreArgs(makeCase([update]), {
        memoryPoints: ['User lives in Kyiv', 'User lives in Berlin'],
      }),
    );
    expect(r.pass).toBe(false);
    expect(r.score).toBe(0);
    expect(r.metadata?.stale).toEqual(['User lives in Berlin']);
    expect(r.reason).toContain('omission');
  });

  it('counts an un-deleted point as omitted; vacuous with no update/delete gold', async () => {
    const r = await memoryUpdateOmission({ maxOmissionRate: 0 }).score(
      scoreArgs(makeCase([del]), { memoryPoints: ['User has a MusicApp subscription'] }),
    );
    expect(r.pass).toBe(false);
    expect(r.metadata?.omissionRate).toBe(1);

    const vacuous = await memoryUpdateOmission().score(
      scoreArgs(makeCase([{ kind: 'extract', content: 'x' }]), { memoryPoints: [] }),
    );
    expect(vacuous.pass).toBe(true);
    expect(vacuous.score).toBe(1);
  });
});

describe('deep-retest 0.13.7 P2 - verbose-but-correct memories (gold-coverage leg)', () => {
  // Live gpt-4.1-mini memory from the 0.13.7 external retest:
  // semantically a perfect update (stale vegetarian gone, pescatarian
  // present), yet the symmetric-F1 default scored it missed +
  // hallucinated + omitted at once (F1 vs the 3-token gold = 4/17).
  const VERBOSE_PESCATARIAN =
    'The user started eating fish again on 2026-01-20, so the user identifies as pescatarian.';
  const STALE_VEGETARIAN =
    'The user is vegetarian and prefers restaurant suggestions that accommodate this diet.';
  const GOLD_NEW = 'User is pescatarian';
  const GOLD_OLD = 'User is vegetarian';
  const dietUpdate: MemoryGoldPoint = { kind: 'update', content: GOLD_NEW, previous: GOLD_OLD };

  it('goldTokenCoverage strips function words and reads 1.0 on the verbose paraphrase', () => {
    expect(tokenF1(GOLD_NEW, VERBOSE_PESCATARIAN)).toBeCloseTo(4 / 17, 5);
    expect(goldTokenCoverage(GOLD_NEW, VERBOSE_PESCATARIAN)).toBe(1);
    // Directional: the same verbose text does NOT cover the old value.
    expect(goldTokenCoverage(GOLD_OLD, VERBOSE_PESCATARIAN)).toBe(0.5);
  });

  it('the default matcher accepts the paraphrase and never cross-matches the stale value', () => {
    const matcher = defaultMemoryPointMatcher();
    expect(matcher(GOLD_NEW, VERBOSE_PESCATARIAN)).toBe(true);
    expect(matcher(GOLD_NEW, STALE_VEGETARIAN)).toBe(false);
    expect(matcher(GOLD_OLD, STALE_VEGETARIAN)).toBe(true);
    expect(matcher(GOLD_OLD, VERBOSE_PESCATARIAN)).toBe(false);
  });

  it('update-omission: the verbose correct update counts as applied once the stale value is gone', async () => {
    const r = await memoryUpdateOmission({ maxOmissionRate: 0 }).score(
      scoreArgs(makeCase([dietUpdate]), { memoryPoints: [VERBOSE_PESCATARIAN] }),
    );
    expect(r.pass).toBe(true);
    expect(r.score).toBe(1);
  });

  it('update-omission: a surviving stale value still marks the update omitted', async () => {
    const r = await memoryUpdateOmission({ maxOmissionRate: 0 }).score(
      scoreArgs(makeCase([dietUpdate]), {
        memoryPoints: [STALE_VEGETARIAN, VERBOSE_PESCATARIAN],
      }),
    );
    expect(r.pass).toBe(false);
    expect(r.metadata?.stale).toEqual([GOLD_OLD]);
  });

  it('extraction recall matches the paraphrase; precision grounds it instead of calling it hallucinated', async () => {
    const c = makeCase([{ kind: 'extract', content: GOLD_NEW }, dietUpdate]);
    const recall = await memoryExtractionRecall().score(
      scoreArgs(c, { memoryPoints: [VERBOSE_PESCATARIAN] }),
    );
    expect(recall.score).toBe(1);
    const precision = await memoryExtractionPrecision().score(
      scoreArgs(c, { memoryPoints: [VERBOSE_PESCATARIAN, 'User owns a yacht'] }),
    );
    expect(precision.score).toBeCloseTo(0.5);
    expect(precision.metadata?.hallucinated).toEqual(['User owns a yacht']);
  });

  it('minGoldCoverage tightens the coverage leg per scorer', async () => {
    const c = makeCase([{ kind: 'extract', content: 'User lives in Kyiv' }]);
    const output = { memoryPoints: ['The user moved to Kyiv'] };
    const loose = await memoryExtractionRecall().score(scoreArgs(c, output));
    expect(loose.score).toBe(1); // coverage 2/3 >= 0.6 (F1 alone is 4/9)
    const tight = await memoryExtractionRecall({ minGoldCoverage: 0.7 }).score(
      scoreArgs(c, output),
    );
    expect(tight.score).toBe(0); // coverage 2/3 < 0.7 and F1 4/9 < 0.5
  });
});

function buildJudge(reply: string, seen: ProviderRequest[]): Provider {
  return {
    name: 'stub',
    modelId: 'stub-judge',
    capabilities: {
      streaming: false,
      toolCalling: false,
      parallelToolCalls: false,
      multimodal: false,
      structuredOutput: false,
      reasoning: false,
      contextWindow: 4096,
      maxOutput: 1024,
    },
    stream(): AsyncIterable<never> {
      throw new Error('not used');
    },
    async generate(req: ProviderRequest): Promise<ProviderResponse> {
      seen.push(req);
      return {
        text: reply,
        usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 },
        finishReason: 'stop',
      };
    },
  };
}

describe('memoryQaHallucination', () => {
  it('fences question/reference/candidate (candidate last) and passes on a high score', async () => {
    const seen: ProviderRequest[] = [];
    const scorer = memoryQaHallucination({ provider: buildJudge('SCORE: 9', seen) });
    const c = makeCase([], {
      question: 'Where does the user live now?',
      referenceAnswer: 'Kyiv',
      unanswerable: false,
    });
    const r = await scorer.score(
      scoreArgs(c, { memoryPoints: [], answer: 'Kyiv, since December.' }),
    );
    expect(r.pass).toBe(true);
    expect(scorer.name).toBe('memory-qa-hallucination');
    const user = extractUserText(seen[0]);
    expect(user).toContain('<<<BEGIN QUESTION>>>');
    expect(user).toContain('<<<BEGIN REFERENCE>>>');
    expect(user.indexOf('CANDIDATE ANSWER')).toBeGreaterThan(user.indexOf('REFERENCE'));
  });

  it('frames unanswerable probes as abstention checks and fails on a low score', async () => {
    const seen: ProviderRequest[] = [];
    const scorer = memoryQaHallucination({ provider: buildJudge('SCORE: 1', seen) });
    const c = makeCase([], { question: 'Dog name?', unanswerable: true });
    const r = await scorer.score(
      scoreArgs(c, { memoryPoints: [], answer: 'The dog is called Rex.' }),
    );
    expect(r.pass).toBe(false);
    expect(extractUserText(seen[0])).toContain('UNANSWERABLE');
  });
});

function extractUserText(req: ProviderRequest | undefined): string {
  const content = req?.messages[0]?.content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => ('text' in part && typeof part.text === 'string' ? part.text : ''))
    .join('\n');
}
