import type { Tool } from '@graphorin/core';
import type { ResultReader } from '@graphorin/tools/result';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript, toolCallScript } from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

/** A pure tool that never spills. */
const noopTool: Tool<unknown, unknown, unknown> = {
  name: 'noop',
  description: 'noop tool',
  inputSchema: passthroughSchema,
  sideEffectClass: 'pure',
  execute: async () => 'ok',
} as Tool<unknown, unknown, unknown>;

/**
 * A stand-in for an MCP resource reader: resolves any non-spill handle
 * (the spill-file reader, tried first, rejects it). Records every URI it
 * is asked to resolve.
 */
function fakeExternalReader(seen: string[]): ResultReader {
  return {
    async read(uri) {
      if (uri.startsWith('graphorin-spill:')) {
        throw new Error('fakeExternalReader does not own spill handles');
      }
      seen.push(uri);
      const content = `resolved:${uri}`;
      return Object.freeze({
        content,
        bytes: Buffer.byteLength(content, 'utf8'),
        totalBytes: Buffer.byteLength(content, 'utf8'),
        eof: true,
      });
    },
  };
}

describe('WI-13 — agent resultReaders hook', () => {
  it('force-registers read_result when resultReaders are supplied (even with no spilling tool)', () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi')] });
    const agent = createAgent({
      name: 'rr-force',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [noopTool],
      resultReaders: [fakeExternalReader([])],
    });
    const entry = agent.registry?.get('read_result');
    expect(entry).toBeDefined();
    expect(entry?.sideEffectClass).toBe('read-only');
  });

  it('does not register read_result without a spilling tool or resultReaders', () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi')] });
    const agent = createAgent({
      name: 'rr-absent',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [noopTool],
    });
    expect(agent.registry?.get('read_result')).toBeUndefined();
  });

  it('resolves an external (MCP resource_link) handle via the composed reader', async () => {
    const seen: string[] = [];
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({
          toolCallId: 'rr1',
          toolName: 'read_result',
          args: { handle: 'file:///report.txt' },
        }),
        textOnlyScript('done'),
      ],
    });
    const toolMessages: string[] = [];
    const agent = createAgent({
      name: 'rr-resolve',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [noopTool],
      resultReaders: [fakeExternalReader(seen)],
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

    // The composed reader tried (and resolved) the external handle.
    expect(seen).toContain('file:///report.txt');
    // The resolved content flowed back into the conversation as the tool result.
    expect(toolMessages.some((c) => c.includes('resolved:file:///report.txt'))).toBe(true);
  });
});
