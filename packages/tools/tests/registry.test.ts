import type { ToolSource } from '@graphorin/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getCounterForTesting, resetCountersForTesting } from '../src/audit/index.js';
import { tool } from '../src/builder/index.js';
import { DuplicateToolNameError, ToolCollisionError } from '../src/errors/index.js';
import { createToolRegistry } from '../src/registry/index.js';

const MCP_LINEAR: ToolSource = { kind: 'mcp', serverIdentity: 'linear-mcp' };
const MCP_GITHUB: ToolSource = { kind: 'mcp', serverIdentity: 'github-mcp' };
const SKILL_TRUSTED_PDF: ToolSource = {
  kind: 'skill',
  skillName: 'pdf-processing',
  trustLevel: 'trusted',
};
const SKILL_UNTRUSTED_PDF: ToolSource = {
  kind: 'skill',
  skillName: 'shady-pdf',
  trustLevel: 'untrusted',
};

function makeTool(name: string, sideEffect: 'pure' | 'side-effecting' = 'pure') {
  return tool({
    name,
    description: `Tool ${name}`,
    inputSchema: z.object({ q: z.string() }),
    sideEffectClass: sideEffect,
    ...(sideEffect === 'side-effecting'
      ? {
          idempotencyKey: ({ q }: { q: string }) => `${name}:${q}`,
        }
      : {}),
    async execute() {
      return { result: name };
    },
  });
}

describe('ToolRegistry — register/get/list', () => {
  beforeEach(() => resetCountersForTesting());
  afterEach(() => resetCountersForTesting());

  it('registers and retrieves a tool', () => {
    const registry = createToolRegistry();
    const t = makeTool('search');
    const resolved = registry.register(t);
    expect(resolved.name).toBe('search');
    expect(resolved.__trustClass).toBe('first-party-user-defined');
    expect(registry.get('search')?.name).toBe('search');
    expect(registry.list().map((e) => e.name)).toEqual(['search']);
  });

  it('lists eager and deferred separately', () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'eager-one',
        description: 'eager one',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        async execute() {
          return null;
        },
      }),
    );
    registry.register(
      tool({
        name: 'deferred-one',
        description: 'deferred one',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        defer_loading: true,
        async execute() {
          return null;
        },
      }),
    );
    expect(registry.listEager().map((e) => e.name)).toEqual(['eager-one']);
    expect(registry.listDeferred().map((e) => e.name)).toEqual(['deferred-one']);
  });
});

describe('ToolRegistry — assertNoDuplicates() pure detection (back-compat)', () => {
  beforeEach(() => resetCountersForTesting());

  it('throws DuplicateToolNameError eagerly when two first-party tools collide at register time', () => {
    const registry = createToolRegistry();
    registry.register(makeTool('foo'));
    expect(() => registry.register(makeTool('foo'))).toThrow(DuplicateToolNameError);
  });

  it('is a no-op when no collisions exist', () => {
    const registry = createToolRegistry();
    registry.register(makeTool('a'));
    registry.register(makeTool('b'));
    expect(() => registry.assertNoDuplicates()).not.toThrow();
  });
});

describe('ToolRegistry — strategy-aware overload', () => {
  beforeEach(() => resetCountersForTesting());

  it("'auto-prefix': renames the MCP-derived tool when colliding with a first-party tool", () => {
    const registry = createToolRegistry();
    registry.register(makeTool('search'));
    registry.register(makeTool('search'), MCP_LINEAR);
    const resolutions = registry.assertNoDuplicates('auto-prefix', { source: MCP_LINEAR });
    expect(resolutions).toHaveLength(1);
    const resolution = resolutions[0]!;
    expect(resolution.action).toBe('auto-prefix-applied');
    if (resolution.action === 'auto-prefix-applied') {
      expect(resolution.renamed.from).toBe('search');
      expect(resolution.renamed.to).toMatch(/^linear-mcp\.search$/);
    }
    expect(registry.get('search')?.__source.kind).toBe('first-party');
    expect(registry.get('linear-mcp.search')?.__source.kind).toBe('mcp');
    expect(getCounterForTesting('tool.collision.detected.total', { strategy: 'auto-prefix' })).toBe(
      1,
    );
  });

  it("'priority' with explicit priority: highest wins; tieBreakReason is 'explicit-priority'", () => {
    const registry = createToolRegistry();
    registry.register(makeTool('b'), MCP_LINEAR);
    registry.register(makeTool('b'), MCP_GITHUB);
    const resolutions = registry.assertNoDuplicates('priority', {
      source: MCP_GITHUB,
      priority: 50,
    });
    const resolution = resolutions[0]!;
    expect(resolution.action).toBe('priority-resolved');
    if (resolution.action === 'priority-resolved') {
      expect(resolution.tieBreakReason).toBe('explicit-priority');
    }
  });

  it("'manual' throws ToolCollisionError when two MCP servers collide", () => {
    const registry = createToolRegistry();
    registry.register(makeTool('share'), MCP_LINEAR);
    registry.register(makeTool('share'), MCP_GITHUB);
    expect(() => registry.assertNoDuplicates('manual', { source: MCP_GITHUB })).toThrow(
      ToolCollisionError,
    );
  });

  it("first-party precedence over MCP — `'priority'` keeps first-party regardless of priority", () => {
    const registry = createToolRegistry();
    registry.register(makeTool('c'));
    registry.register(makeTool('c'), MCP_LINEAR);
    const resolutions = registry.assertNoDuplicates('priority', {
      source: MCP_LINEAR,
      priority: 999,
    });
    expect(resolutions[0]!.action).toBe('first-party-precedence');
    expect(registry.get('c')?.__source.kind).toBe('first-party');
    expect(
      getCounterForTesting('tool.collision.first-party-suppressed.total', {
        trustClass: 'first-party',
      }),
    ).toBe(1);
  });

  it("trusted-skill > untrusted-skill > MCP precedence ladder under 'priority'", () => {
    const registry = createToolRegistry();
    registry.register(makeTool('d'), SKILL_TRUSTED_PDF);
    registry.register(makeTool('d'), SKILL_UNTRUSTED_PDF);
    registry.register(makeTool('d'), MCP_LINEAR);
    const resolutions = registry.assertNoDuplicates('priority', { source: MCP_LINEAR });
    const resolution = resolutions[0]!;
    expect(resolution.action).toBe('priority-resolved');
    expect(registry.get('d')?.__source.kind).toBe('skill');
    if (registry.get('d')?.__source.kind === 'skill') {
      expect((registry.get('d')!.__source as { trustLevel: string }).trustLevel).toBe('trusted');
    }
  });
});
