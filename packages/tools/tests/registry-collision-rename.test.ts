import type { ToolSource } from '@graphorin/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getCounterForTesting, resetCountersForTesting } from '../src/audit/index.js';
import { tool } from '../src/builder/index.js';
import { type CollisionResolution, createToolRegistry } from '../src/registry/index.js';

const MCP_LINEAR: ToolSource = { kind: 'mcp', serverIdentity: 'linear-mcp' };

describe('ToolRegistry — bytes-equal preservation across auto-prefix rename', () => {
  beforeEach(() => resetCountersForTesting());
  afterEach(() => resetCountersForTesting());

  it('preserves examples + preferredModel + sideEffectClass + tags + every non-public registry field bytes-equal', () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'a',
        description: 'first-party a',
        inputSchema: z.object({ q: z.string() }),
        outputSchema: z.object({ ok: z.boolean() }),
        sideEffectClass: 'pure',
        preferredModel: 'fast',
        tags: ['greeting', 'experimental'],
        examples: [
          { input: { q: 'one' }, output: { ok: true }, comment: 'first' },
          { input: { q: 'two' }, output: { ok: false }, comment: 'second' },
          { input: { q: 'three' }, output: { ok: true } },
        ],
        async execute({ q }) {
          return { ok: q.length > 0 };
        },
      }),
    );
    registry.register(
      tool({
        name: 'a',
        description: 'mcp a',
        inputSchema: z.object({ q: z.string() }),
        outputSchema: z.object({ ok: z.boolean() }),
        sideEffectClass: 'read-only',
        preferredModel: 'smart',
        tags: ['mcp-tool'],
        examples: [{ input: { q: 'mcp-example' }, output: { ok: true } }],
        async execute() {
          return { ok: true };
        },
      }),
      MCP_LINEAR,
    );

    const before = registry.list().filter((e) => e.__source.kind === 'mcp')[0]!;
    const beforeSnapshot = {
      examples: before.examples,
      preferredModel: before.preferredModel,
      sideEffectClass: before.__sideEffectClass,
      hasIdempotencyKey: before.__hasIdempotencyKey,
      streamingHint: before.__streamingHint,
      trustClass: before.__trustClass,
      effectiveDeferLoading: before.__effectiveDeferLoading,
      exampleCount: before.__exampleCount,
      examplesEagerlyRendered: before.examplesEagerlyRendered,
      inboundSanitization: before.inboundSanitization,
      maxResultTokens: before.maxResultTokens,
      truncationStrategy: before.truncationStrategy,
      tags: before.tags,
    };

    registry.assertNoDuplicates('auto-prefix', { source: MCP_LINEAR });

    const renamed = registry.get('linear-mcp.a');
    expect(renamed).toBeDefined();
    if (!renamed) return;

    expect(renamed.examples).toEqual(beforeSnapshot.examples);
    expect(renamed.preferredModel).toBe(beforeSnapshot.preferredModel);
    expect(renamed.__sideEffectClass).toBe(beforeSnapshot.sideEffectClass);
    expect(renamed.__hasIdempotencyKey).toBe(beforeSnapshot.hasIdempotencyKey);
    expect(renamed.__streamingHint).toBe(beforeSnapshot.streamingHint);
    expect(renamed.__trustClass).toBe(beforeSnapshot.trustClass);
    expect(renamed.__effectiveDeferLoading).toBe(beforeSnapshot.effectiveDeferLoading);
    expect(renamed.__exampleCount).toBe(beforeSnapshot.exampleCount);
    expect(renamed.examplesEagerlyRendered).toBe(beforeSnapshot.examplesEagerlyRendered);
    expect(renamed.inboundSanitization).toBe(beforeSnapshot.inboundSanitization);
    expect(renamed.maxResultTokens).toBe(beforeSnapshot.maxResultTokens);
    expect(renamed.truncationStrategy).toBe(beforeSnapshot.truncationStrategy);
    expect(renamed.tags).toEqual(beforeSnapshot.tags);

    // First-party stays under the original name.
    expect(registry.get('a')?.__source.kind).toBe('first-party');
    expect(registry.get('a')?.preferredModel).toBe('fast');
  });
});

describe('ToolRegistry — CollisionResolution data integrity', () => {
  beforeEach(() => resetCountersForTesting());
  afterEach(() => resetCountersForTesting());

  it('returns one CollisionResolution per resolved collision and matches the audit / counter increments 1:1', () => {
    const registry = createToolRegistry();
    // Three collision pairs across a first-party + 2 MCP servers.
    for (const name of ['x', 'y', 'z']) {
      registry.register(
        tool({
          name,
          description: `first-party ${name}`,
          inputSchema: z.object({}),
          sideEffectClass: 'pure',
          async execute() {
            return null;
          },
        }),
      );
      registry.register(
        tool({
          name,
          description: `mcp ${name}`,
          inputSchema: z.object({}),
          sideEffectClass: 'read-only',
          async execute() {
            return null;
          },
        }),
        { kind: 'mcp', serverIdentity: 'mcp-1' },
      );
    }

    const resolutions = registry.assertNoDuplicates('auto-prefix', {
      source: { kind: 'mcp', serverIdentity: 'mcp-1' },
    });
    expect(resolutions.length).toBe(3);
    for (const r of resolutions as ReadonlyArray<CollisionResolution>) {
      expect(['x', 'y', 'z']).toContain(r.toolName);
      expect(r.action).toBe('auto-prefix-applied');
      if (r.action === 'auto-prefix-applied') {
        expect(r.renamed.to).toBe(`mcp-1.${r.toolName}`);
      }
    }

    expect(getCounterForTesting('tool.collision.detected.total', { strategy: 'auto-prefix' })).toBe(
      3,
    );
    expect(
      getCounterForTesting('tool.collision.auto-prefix-applied.total', {
        namespaceSource: 'mcp-1',
      }),
    ).toBe(3);
  });
});

describe('ToolRegistry — idempotency-key WARN for MCP-derived auto-defaulted tools', () => {
  beforeEach(() => resetCountersForTesting());
  afterEach(() => resetCountersForTesting());

  it('fires the idempotency-key WARN even when sideEffectClass came from the MCP auto-default', () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'mcp-without-key',
        description: 'mcp tool with no class and no key',
        inputSchema: z.object({}),
        async execute() {
          return null;
        },
      } as never),
      { kind: 'mcp', serverIdentity: 'sneaky' },
    );
    expect(
      getCounterForTesting('tool.classification.idempotency-key-missing.total', {
        toolName: 'mcp-without-key',
        sideEffectClass: 'external-stateful',
      }),
    ).toBe(1);
  });

  it('does NOT fire the idempotency-key WARN when MCP tool was downgraded to read-only', () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'mcp-readonly',
        description: 'mcp readonly query',
        inputSchema: z.object({}),
        sideEffectClass: 'read-only',
        async execute() {
          return null;
        },
      }),
      { kind: 'mcp', serverIdentity: 'wikipedia' },
    );
    expect(
      getCounterForTesting('tool.classification.idempotency-key-missing.total', {
        toolName: 'mcp-readonly',
        sideEffectClass: 'read-only',
      }),
    ).toBe(0);
  });
});

describe('ToolRegistry — MCP-derived sideEffectClass auto-default suppression', () => {
  beforeEach(() => resetCountersForTesting());
  afterEach(() => resetCountersForTesting());

  it("auto-defaults to 'external-stateful' for MCP tools without sideEffectClass and SUPPRESSES the warn", () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'mcp-tool',
        description: 'mcp without classification',
        inputSchema: z.object({}),
        // intentionally no `sideEffectClass`
        async execute() {
          return null;
        },
      } as never),
      { kind: 'mcp', serverIdentity: 'wikipedia' },
    );

    const got = registry.get('mcp-tool');
    expect(got?.__sideEffectClass).toBe('external-stateful');
    // The classification:missing WARN should NOT have fired for the MCP path.
    expect(getCounterForTesting('tool.classification.missing.total', { source: 'mcp' })).toBe(0);
  });

  it("first-party WITHOUT sideEffectClass DOES emit the warn AND auto-defaults to 'side-effecting'", () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'fp-tool',
        description: 'first-party without classification',
        inputSchema: z.object({}),
        async execute() {
          return null;
        },
      } as never),
    );
    expect(registry.get('fp-tool')?.__sideEffectClass).toBe('side-effecting');
    expect(
      getCounterForTesting('tool.classification.missing.total', { source: 'first-party' }),
    ).toBe(1);
  });
});

describe('ToolRegistry — listByTag', () => {
  it('returns every registered tool whose tags include `tag` in registration order', () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'a',
        description: 'a',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        tags: ['communication', 'experimental'],
        async execute() {
          return null;
        },
      }),
    );
    registry.register(
      tool({
        name: 'b',
        description: 'b',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        tags: ['communication'],
        async execute() {
          return null;
        },
      }),
    );
    registry.register(
      tool({
        name: 'c',
        description: 'c',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        async execute() {
          return null;
        },
      }),
    );
    const comms = registry.listByTag('communication');
    expect(comms.map((e) => e.name)).toEqual(['a', 'b']);
    const exp = registry.listByTag('experimental');
    expect(exp.map((e) => e.name)).toEqual(['a']);
    expect(registry.listByTag('non-existent')).toEqual([]);
    expect(registry.listByTag('')).toEqual([]);
  });
});
