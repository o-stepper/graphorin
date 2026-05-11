import type { ToolSource } from '@graphorin/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  getCounterForTesting,
  getHistogramForTesting,
  observeHistogram,
  resetCountersForTesting,
  setGauge,
  snapshotCounters,
} from '../src/audit/index.js';
import { tool } from '../src/builder/index.js';
import { ToolCollisionError } from '../src/errors/index.js';
import { createToolRegistry, type ToolSearchEmbedder } from '../src/registry/index.js';

const MCP_A: ToolSource = { kind: 'mcp', serverIdentity: 'server-a' };
const MCP_B: ToolSource = { kind: 'mcp', serverIdentity: 'server-b' };

function makeTool(name: string) {
  return tool({
    name,
    description: `Tool ${name}`,
    inputSchema: z.object({ q: z.string() }),
    sideEffectClass: 'pure',
    async execute() {
      return { name };
    },
  });
}

describe('counters surface', () => {
  beforeEach(() => resetCountersForTesting());
  afterEach(() => resetCountersForTesting());

  it('snapshotCounters() returns frozen counter + histogram maps', () => {
    setGauge('tool.test.gauge', 5);
    const snapshot = snapshotCounters();
    expect(snapshot.counters['tool.test.gauge']).toBe(5);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it('rejects counter names that violate the grammar', () => {
    setGauge('Invalid Name', 1);
    setGauge('tool.valid', 1);
    const snapshot = snapshotCounters();
    expect(snapshot.counters['Invalid Name']).toBeUndefined();
    expect(snapshot.counters['tool.valid']).toBe(1);
  });

  it('histograms accumulate observations', () => {
    observeHistogram('tool.test.hist', 1.5);
    observeHistogram('tool.test.hist', 2.5);
    expect(getHistogramForTesting('tool.test.hist')).toEqual([1.5, 2.5]);
  });

  it('getCounterForTesting returns 0 when the counter is absent', () => {
    expect(getCounterForTesting('tool.never.counted')).toBe(0);
  });
});

describe('ToolRegistry — auto-prefix without first-party participant', () => {
  beforeEach(() => resetCountersForTesting());

  it('renames the lower-priority registration when two MCP servers collide', () => {
    const registry = createToolRegistry();
    registry.register(makeTool('shared'), MCP_A);
    registry.register(makeTool('shared'), MCP_B);
    const resolutions = registry.assertNoDuplicates('auto-prefix', { source: MCP_B });
    expect(resolutions.length).toBeGreaterThan(0);
    const names = registry
      .list()
      .map((e) => e.name)
      .sort();
    expect(names).toContain('shared');
    expect(names.some((n) => n.includes('.shared'))).toBe(true);
  });
});

describe('ToolRegistry — semantic search', () => {
  it('uses the embedder when supplied and returns semantic matches', async () => {
    const embedder: ToolSearchEmbedder = {
      id: () => 'fixture-embedder',
      dim: () => 4,
      async embed(texts) {
        // Trivial fixture embedder: each word maps to a fixed vector.
        return texts.map((t) => {
          const lc = t.toLowerCase();
          if (lc.includes('linear') || lc.includes('issue')) return new Float32Array([1, 0, 0, 0]);
          if (lc.includes('chat') || lc.includes('message')) return new Float32Array([0, 1, 0, 0]);
          if (lc.includes('repo') || lc.includes('code')) return new Float32Array([0, 0, 1, 0]);
          return new Float32Array([0, 0, 0, 1]);
        });
      },
    };
    const registry = createToolRegistry({ embedder });
    registry.register(
      tool({
        name: 'search_issues',
        description: 'Search Linear issues by query.',
        inputSchema: z.object({ q: z.string() }),
        sideEffectClass: 'read-only',
        defer_loading: true,
        async execute() {
          return { ok: true };
        },
      }),
      MCP_A,
    );
    registry.register(
      tool({
        name: 'send_chat',
        description: 'Send a chat message.',
        inputSchema: z.object({ q: z.string() }),
        sideEffectClass: 'side-effecting',
        idempotencyKey: () => 'k',
        defer_loading: true,
        async execute() {
          return { ok: true };
        },
      }),
      MCP_B,
    );
    const matches = await registry.searchDeferred('linear issue tracker', 5);
    expect(matches.length).toBeGreaterThan(0);
    const issuesMatch = matches.find((m) => m.name === 'search_issues');
    expect(issuesMatch?.source).toBe('semantic');
  });

  it('falls through to BM25 when embedder is missing', async () => {
    const registry = createToolRegistry();
    registry.register(makeTool('chat-bot'), MCP_A);
    // Mark as deferred via re-registration with explicit defer_loading
    registry.register(
      tool({
        name: 'chat-bot',
        description: 'Send chat messages to a channel.',
        inputSchema: z.object({ q: z.string() }),
        sideEffectClass: 'pure',
        defer_loading: true,
        async execute() {
          return null;
        },
      }),
      MCP_A,
    );
    const matches = await registry.searchDeferred('chat', 5);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.source).toBe('bm25');
  });

  it('returns empty when no deferred tools exist', async () => {
    const registry = createToolRegistry();
    registry.register(makeTool('eager'));
    expect(await registry.searchDeferred('anything', 3)).toHaveLength(0);
  });

  it('falls through to regex name-match when neither semantic nor BM25 produce hits', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'unique_tool_xyz',
        description: 'Description without query terms.',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        defer_loading: true,
        async execute() {
          return null;
        },
      }),
      MCP_A,
    );
    const matches = await registry.searchDeferred('xyz', 3);
    expect(matches.find((m) => m.name === 'unique_tool_xyz')?.source).toBe('regex-name');
  });
});

describe('ToolRegistry — manual without first-party participant', () => {
  it("'manual' throws ToolCollisionError when two MCP servers collide and there is no first-party", () => {
    const registry = createToolRegistry();
    registry.register(makeTool('shared'), MCP_A);
    registry.register(makeTool('shared'), MCP_B);
    expect(() => registry.assertNoDuplicates('manual', { source: MCP_B })).toThrow(
      ToolCollisionError,
    );
  });
});

describe('ToolRegistry — clear', () => {
  it('removes every registered entry', () => {
    const registry = createToolRegistry();
    registry.register(makeTool('a'));
    registry.register(makeTool('b'));
    expect(registry.size()).toBe(2);
    registry.clear();
    expect(registry.size()).toBe(0);
  });
});

describe('ToolRegistry — unregister', () => {
  it('returns true when a tool is removed and false otherwise', () => {
    const registry = createToolRegistry();
    registry.register(makeTool('a'));
    expect(registry.unregister('a')).toBe(true);
    expect(registry.unregister('not-here')).toBe(false);
  });
});
