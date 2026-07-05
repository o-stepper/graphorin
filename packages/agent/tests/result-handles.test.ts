import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Tool } from '@graphorin/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

// --- shared fixtures --------------------------------------------------------

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

/** A pure no-op tool that does not spill. */
const noopTool: Tool<unknown, unknown, unknown> = {
  name: 'noop',
  description: 'noop tool',
  inputSchema: passthroughSchema,
  sideEffectClass: 'pure',
  execute: async () => 'ok',
} as Tool<unknown, unknown, unknown>;

/**
 * A tool that returns a large structured object and opts into the
 * `'spill-to-file'` truncation strategy with a tiny budget - so the
 * executor spills the body and surfaces a result handle.
 */
function bigTool(opts: { sensitivity?: 'public' | 'internal' | 'secret' } = {}): {
  tool: Tool<unknown, unknown, unknown>;
  body: string;
} {
  const body = 'X'.repeat(6000);
  return {
    body,
    tool: {
      name: 'big',
      description: 'returns a large blob',
      inputSchema: passthroughSchema,
      sideEffectClass: 'pure',
      truncationStrategy: 'spill-to-file',
      maxResultTokens: 40,
      ...(opts.sensitivity !== undefined ? { sensitivity: opts.sensitivity } : {}),
      // Structured (object) output: pre-WI-10 the agent would JSON.stringify
      // the whole thing back into context regardless of truncation.
      execute: async () => ({ data: body }),
    } as Tool<unknown, unknown, unknown>,
  };
}

const spillDirsToClean: string[] = [];

/** Reconstruct the on-disk spill dir from a `graphorin-spill:<runId>/…` handle. */
function trackSpillCleanup(content: string): void {
  const m = content.match(/graphorin-spill:([^"\s\]]+)/);
  if (m?.[1] !== undefined) {
    const runId = m[1].split('/')[0];
    if (runId !== undefined)
      spillDirsToClean.push(path.join(os.tmpdir(), 'graphorin-spill', runId));
  }
}

afterEach(async () => {
  while (spillDirsToClean.length > 0) {
    const dir = spillDirsToClean.pop();
    if (dir !== undefined) await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

// --- read_result registration gating ----------------------------------------

describe('WI-10 - read_result registration', () => {
  it('registers read_result when a tool opts into spill-to-file', () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi')] });
    const agent = createAgent({
      name: 'speller',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [bigTool().tool],
    });
    const entry = agent.registry?.get('read_result');
    expect(entry).toBeDefined();
    expect(entry?.sideEffectClass).toBe('read-only');
  });

  it('does not register read_result when no tool spills', () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi')] });
    const agent = createAgent({
      name: 'plain',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [noopTool],
    });
    expect(agent.registry?.get('read_result')).toBeUndefined();
  });
});

// --- handle-aware serialization ---------------------------------------------

describe('WI-10 - large results stay out of context', () => {
  it('inlines only a bounded preview + handle for a spilled object result (not the full blob)', async () => {
    const { tool, body } = bigTool();
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-big', toolName: 'big', args: {} }),
        textOnlyScript('done'),
      ],
    });

    const toolMessages: string[] = [];
    const agent = createAgent({
      name: 'spiller',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [tool],
      prepareStep: (ctx) => {
        for (const m of ctx.messages) {
          if (m.role === 'tool' && typeof m.content === 'string') toolMessages.push(m.content);
        }
        return {};
      },
    });

    for await (const _ of agent.stream('go')) {
      // drain
    }

    const handleMsg = toolMessages.find((c) => c.includes('graphorin-spill:'));
    expect(handleMsg).toBeDefined();
    trackSpillCleanup(handleMsg!);
    // The full 6000-char blob never reaches the conversation buffer…
    expect(handleMsg!).not.toContain(body);
    expect(handleMsg?.length).toBeLessThan(1000);
    // …and the model is told how to fetch the rest.
    expect(handleMsg!).toContain('read_result');
    expect(handleMsg!).toMatch(/handle "graphorin-spill:[^"]+"/);
    // No tool message ever carried the full blob.
    expect(toolMessages.some((c) => c.includes('X'.repeat(2000)))).toBe(false);
  });

  it('does not spill - and surfaces no handle - for a secret-tier tool (sensitivity gate)', async () => {
    const { tool } = bigTool({ sensitivity: 'secret' });
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-secret', toolName: 'big', args: {} }),
        textOnlyScript('done'),
      ],
    });

    const toolMessages: string[] = [];
    const agent = createAgent({
      name: 'secret-spiller',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [tool],
      prepareStep: (ctx) => {
        for (const m of ctx.messages) {
          if (m.role === 'tool' && typeof m.content === 'string') toolMessages.push(m.content);
        }
        return {};
      },
    });

    for await (const _ of agent.stream('go')) {
      // drain
    }

    // The secret body is truncated in place - never written to the shared
    // spill store, so no handle is ever surfaced.
    expect(toolMessages.length).toBeGreaterThan(0);
    expect(toolMessages.every((c) => !c.includes('graphorin-spill:'))).toBe(true);
  });
});
