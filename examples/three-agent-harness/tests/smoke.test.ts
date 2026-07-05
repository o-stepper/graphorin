/**
 * Graphorin v0.6.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/three-agent-harness`. Exercises the
 * Planner / Generator / Evaluator pipeline end-to-end against the
 * deterministic stub provider (so CI never depends on a live LLM),
 * verifies the structured-handoff artifact convention
 * (`<artifactRoot>/<runId>/progress/<role>.<seq>.txt`), and runs
 * the optional research-and-decide variant
 * (`Agent.fanOut({...})` + `createCitationAgent({...})`) with
 * `maxConcurrentChildren: 4`.
 */

import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createCitationAgent } from '../src/citation-agent.js';
import { LRU_FIXTURE_SOURCE, LRUCache } from '../src/lru-fixture.js';
import {
  defaultStubSources,
  runHarness,
  runResearchAndDecideVariant,
  VERSION,
} from '../src/main.js';
import { COMPARISON_JUDGE_REPLY, EVALUATOR_REPLY, PLANNER_REPLY } from '../src/stub-provider.js';

describe('examples/three-agent-harness — smoke', () => {
  let artifactRoot = '';

  beforeEach(async () => {
    artifactRoot = await mkdtemp(join(tmpdir(), 'graphorin-three-agent-'));
  });

  afterEach(async () => {
    if (artifactRoot.length > 0) {
      await rm(artifactRoot, { recursive: true, force: true });
    }
  });

  it('exposes VERSION = 0.6.0', () => {
    expect(VERSION).toBe('0.6.0');
  });

  it('runHarness converges on iteration 1 with the LRU fixture', async () => {
    const result = await runHarness({
      request: 'implement a thread-safe LRU cache in TypeScript with tests',
      recipe: 'stub',
      artifactRoot,
      maxIterations: 3,
    });

    expect(result.recipe).toBe('stub');
    expect(result.plan).toBe(PLANNER_REPLY);
    expect(result.outcome.terminationReason).toBe('pass');
    expect(result.outcome.iterations.length).toBe(1);
    expect(result.outcome.finalScore).toBe(9);
    expect(result.outcome.output).toBe(LRU_FIXTURE_SOURCE);

    const expectedEvaluator = JSON.parse(EVALUATOR_REPLY) as { readonly score: number };
    expect(result.outcome.finalScore).toBe(expectedEvaluator.score);
  }, 15_000);

  it('persists planner.001.txt and generator.NNN.txt under the artifact root', async () => {
    const result = await runHarness({
      request: 'implement a thread-safe LRU cache in TypeScript with tests',
      recipe: 'stub',
      artifactRoot,
      maxIterations: 3,
    });

    const plannerPath = join(artifactRoot, result.runId, 'progress', 'planner.001.txt');
    const plannerStat = await stat(plannerPath);
    expect(plannerStat.isFile()).toBe(true);
    expect(plannerStat.size).toBeGreaterThan(0);
    expect(result.plannerArtifact.path).toBe(plannerPath);
    expect(result.plannerArtifact.role).toBe('planner');
    expect(result.plannerArtifact.seq).toBe(1);

    expect(result.generatorArtifacts.length).toBeGreaterThanOrEqual(1);
    // Use the OS-specific separator so the regex matches both POSIX
    // (`progress/generator.001.txt`) and Windows
    // (`progress\generator.001.txt`) artifact paths.
    const sep = process.platform === 'win32' ? '\\\\' : '/';
    const generatorPathRe = new RegExp(`${sep}generator\\.\\d{3}\\.txt$`);
    for (const ref of result.generatorArtifacts) {
      const gstat = await stat(ref.path);
      expect(gstat.isFile()).toBe(true);
      expect(ref.role).toBe('generator');
      expect(ref.path).toMatch(generatorPathRe);
    }
    const firstGenerator = result.generatorArtifacts[0];
    expect(firstGenerator).toBeDefined();
    if (firstGenerator !== undefined) {
      expect(firstGenerator.path).toBe(
        join(artifactRoot, result.runId, 'progress', 'generator.001.txt'),
      );
    }
  }, 15_000);

  it('LRU fixture class is byte-aligned with the source string', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.has('b')).toBe(false);
    expect(cache.size).toBe(2);
    expect(LRU_FIXTURE_SOURCE).toContain('export class LRUCache');
  });

  it('runResearchAndDecideVariant fans out 3 children under maxConcurrentChildren: 4', async () => {
    const variant = await runResearchAndDecideVariant({
      question: 'recommend a concurrency strategy for a high-throughput LRU cache',
      recipe: 'stub',
      maxConcurrentChildren: 4,
    });

    expect(variant.recipe).toBe('stub');
    expect(variant.fanOutResult.children.length).toBe(3);
    for (const child of variant.fanOutResult.children) {
      expect(child.status).toBe('completed');
    }
    expect(variant.fanOutResult.output).toBe(COMPARISON_JUDGE_REPLY);

    const total = variant.citationResult.bindings.length;
    expect(total).toBeGreaterThan(0);
    const ratio = variant.citationResult.boundCount / total;
    expect(ratio).toBeGreaterThanOrEqual(0.5);
  }, 15_000);

  it('runHarness accepts priorRunId and completes using prior planner artifacts', async () => {
    const first = await runHarness({
      request: 'implement a thread-safe LRU cache in TypeScript with tests',
      recipe: 'stub',
      artifactRoot,
      maxIterations: 3,
    });
    const second = await runHarness({
      request: 'implement a thread-safe LRU cache in TypeScript with tests',
      recipe: 'stub',
      artifactRoot,
      maxIterations: 3,
      priorRunId: first.runId,
    });

    expect(second.runId).not.toBe(first.runId);
    expect(second.outcome.terminationReason).toBe('pass');
    expect(second.plan).toBe(PLANNER_REPLY);
  }, 20_000);

  it('createCitationAgent binds claims to provided sources via substring overlap', () => {
    const sources = defaultStubSources();
    const agent = createCitationAgent({ sources, mode: 'inline' });
    const result = agent.bind(COMPARISON_JUDGE_REPLY);
    expect(result.bindings.length).toBeGreaterThanOrEqual(1);
    expect(result.boundCount).toBeGreaterThanOrEqual(1);
    expect(result.text).toContain('[Source');
  });
});
