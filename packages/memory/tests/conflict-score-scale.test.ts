/**
 * Regression tests for N-01/21: the conflict pipeline's Stage 2 zone
 * thresholds are calibrated for **raw cosine** similarity (DEC-130),
 * but storage adapters return normalized `[0, 1]` scores
 * (`(1 + cos) / 2` for the cosine metric - CS-3, `scoreFromDistance`
 * in `@graphorin/store-sqlite`). Before the fix Stage 2 compared the
 * store score straight against the raw-cosine thresholds, so a hit at
 * raw cosine 0.70 (store score 0.85) already deduped - almost every
 * e5-family sentence pair - and distinct facts collapsed into one row.
 *
 * The end-to-end legs run against the REAL `@graphorin/store-sqlite`
 * adapter (sqlite-vec KNN) with a controlled embedder that produces
 * exact pairwise cosines, proving:
 *  (a) a truly near-duplicate pair (raw cos >= 0.95) still dedupes,
 *  (b) a distinct pair at raw cos 0.75 (store score 0.875, which USED
 *      to dedupe) now commits as a separate fact.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { EmbedderProvider, SessionScope } from '@graphorin/core';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { describe, expect, it } from 'vitest';
import { rawCosineFromStoreScore } from '../src/conflict/types.js';
import { createMemory } from '../src/index.js';

const SCOPE: SessionScope = { userId: 'alex', sessionId: 's1' };
const DIM = 8;

/**
 * Deterministic embedder that maps each known text to a unit vector at
 * a controlled angle from the base axis, so every pairwise raw cosine
 * is exact by construction: `cos(v(0), v(theta)) = cos(theta)`.
 */
function controlledEmbedder(cosines: ReadonlyMap<string, number>): EmbedderProvider {
  return {
    id: () => 'controlled:pairs@8',
    dim: () => DIM,
    configHash: () => 'controlled-pairs',
    async embed(texts) {
      return texts.map((text) => {
        const cos = cosines.get(text);
        if (cos === undefined) throw new Error(`unmapped text: ${text}`);
        const vec = new Float32Array(DIM);
        vec[0] = cos;
        vec[1] = Math.sqrt(Math.max(0, 1 - cos * cos));
        return vec;
      });
    },
  };
}

async function makeVecStore(): Promise<GraphorinSqliteStore> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-conflict-scale-'));
  const store = await createSqliteStore({ path: `${dir}/db.sqlite` });
  await store.init();
  return store;
}

describe('conflict pipeline - store-score vs raw-cosine scale (N-01/21)', () => {
  it('rawCosineFromStoreScore inverts the (1 + cos) / 2 store scale and clamps', () => {
    for (const cos of [-1, -0.5, 0, 0.4, 0.75, 0.85, 0.95, 1]) {
      expect(rawCosineFromStoreScore((1 + cos) / 2)).toBeCloseTo(cos, 12);
    }
    // Out-of-contract adapter scores clamp instead of leaking past the
    // threshold-validated [-1, 1] range.
    expect(rawCosineFromStoreScore(1.2)).toBe(1);
    expect(rawCosineFromStoreScore(-0.2)).toBe(-1);
  });

  it('still dedupes a truly near-duplicate pair (raw cos >= 0.95) against the real sqlite adapter', async () => {
    const first = 'Alice enjoys hiking in the Carpathians.';
    const nearDup = 'Alice loves hiking in the Carpathian mountains.';
    const embedder = controlledEmbedder(
      new Map([
        [first, 1],
        [nearDup, 0.96],
      ]),
    );
    const sqlite = await makeVecStore();
    try {
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        embedder,
      });
      const a = await memory.semantic.rememberWithDecision(SCOPE, { text: first });
      expect(a.decision.kind).toBe('admit');
      const b = await memory.semantic.rememberWithDecision(SCOPE, { text: nearDup });
      expect(b.decision.kind).toBe('dedup');
      if (b.decision.kind === 'dedup') {
        expect(b.decision.reason).toBe('embedding-hot-zone');
        expect(b.decision.similarity).toBeCloseTo(0.96, 5);
      }
      // The dedup returned the existing row - no second fact committed.
      expect(b.fact.id).toBe(a.fact.id);
    } finally {
      await sqlite.close();
    }
  });

  it('commits a distinct pair at raw cos 0.75 (store score 0.875, which used to dedupe) as a separate fact', async () => {
    const first = 'Alice works as a data engineer in Lviv.';
    const distinct = 'Alice owns a small tabby cat called Whiskers.';
    const embedder = controlledEmbedder(
      new Map([
        [first, 1],
        // Raw cosine 0.75 => store score (1 + 0.75) / 2 = 0.875, which
        // the pre-fix comparison treated as >= nearDup 0.85 and deduped.
        [distinct, 0.75],
      ]),
    );
    const sqlite = await makeVecStore();
    try {
      const memory = createMemory({
        store: sqlite.memory,
        embeddings: sqlite.embeddings,
        embedder,
      });
      const a = await memory.semantic.rememberWithDecision(SCOPE, { text: first });
      expect(a.decision.kind).toBe('admit');
      const b = await memory.semantic.rememberWithDecision(SCOPE, { text: distinct });
      // Raw cosine 0.75 is the ambiguous CONFLICT-CHECK zone: the fact
      // is admitted (pending deep review), never silently deduped.
      expect(b.decision.kind).not.toBe('dedup');
      expect(b.fact.id).not.toBe(a.fact.id);
      expect(b.fact.text).toBe(distinct);
      // Both rows persisted - the second write really committed.
      const persisted = await memory.semantic.get(SCOPE, b.fact.id);
      expect(persisted?.text).toBe(distinct);
      const original = await memory.semantic.get(SCOPE, a.fact.id);
      expect(original?.text).toBe(first);
    } finally {
      await sqlite.close();
    }
  });
});
