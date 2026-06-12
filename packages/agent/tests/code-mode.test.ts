import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Provider, ProviderEvent, ProviderRequest, Tool } from '@graphorin/core';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

// --- fixtures ---------------------------------------------------------------

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

/**
 * A real tool that returns ~100 KB of data — the kind code-mode keeps out
 * of context. `maxResultTokens` is set high so the in-script call receives
 * the full body (inner calls go through the executor, so a tool's own
 * truncation budget still applies to its result — code-mode does not
 * bypass per-tool governance).
 */
const fetchBig: Tool<unknown, unknown, unknown> = {
  name: 'fetch_big',
  description: 'Fetch a large blob of data.',
  inputSchema: passthroughSchema,
  sideEffectClass: 'read-only',
  maxResultTokens: 100_000,
  execute: async () => 'X'.repeat(100_000),
} as Tool<unknown, unknown, unknown>;

/** An approval-gated tool — must be excluded from the code API. */
const dangerTool: Tool<unknown, unknown, unknown> = {
  name: 'danger',
  description: 'Does something that needs human approval.',
  inputSchema: passthroughSchema,
  sideEffectClass: 'external-stateful',
  needsApproval: true,
  execute: async () => 'done',
} as Tool<unknown, unknown, unknown>;

/** A mock provider that also records the advertised tool names per call. */
function recordingProvider(
  scripts: ReadonlyArray<MockProviderScript>,
): Provider & { readonly toolNamesPerCall: string[][] } {
  const toolNamesPerCall: string[][] = [];
  let cursor = 0;
  const provider: Provider = {
    name: 'mock',
    modelId: 'mock',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200_000,
      maxOutput: 8192,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      toolNamesPerCall.push((req.tools ?? []).map((t) => t.name));
      const script = scripts[cursor++];
      if (script === undefined) {
        yield { type: 'error', error: { kind: 'unknown', message: 'no script' } };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate() {
      throw new Error('mock: generate not implemented');
    },
  };
  return Object.assign(provider, { toolNamesPerCall });
}

const spillDirsToClean: string[] = [];
afterEach(async () => {
  while (spillDirsToClean.length > 0) {
    const dir = spillDirsToClean.pop();
    if (dir !== undefined) await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
});

// --- registration & catalogue ----------------------------------------------

describe('WI-11 — code-mode registration', () => {
  it('registers the meta-tools and advertises only them (not the real tools)', async () => {
    const provider = recordingProvider([textOnlyScript('hi')]);
    const agent = createAgent({
      name: 'cm',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [fetchBig],
      toolInvocation: 'code-mode',
    });

    // The meta-tools are registered; the real tool stays registered (so the
    // in-script bridge can run it) but is not advertised.
    expect(agent.registry?.get('code_execute')).toBeDefined();
    expect(agent.registry?.get('code_search')).toBeDefined();
    expect(agent.registry?.get('fetch_big')).toBeDefined();

    for await (const _ of agent.stream('go')) {
      // drain one step
    }
    const advertised = provider.toolNamesPerCall[0] ?? [];
    expect(advertised).toContain('code_execute');
    expect(advertised).toContain('code_search');
    expect(advertised).toContain('read_result'); // code_execute spills → fetchable
    expect(advertised).not.toContain('fetch_big'); // reached via code, not advertised
  });

  it('default (direct) mode is unchanged: no meta-tools, real tools advertised', async () => {
    const provider = recordingProvider([textOnlyScript('hi')]);
    const agent = createAgent({
      name: 'direct',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [fetchBig],
    });
    expect(agent.registry?.get('code_execute')).toBeUndefined();
    expect(agent.registry?.get('code_search')).toBeUndefined();

    for await (const _ of agent.stream('go')) {
      // drain
    }
    const advertised = provider.toolNamesPerCall[0] ?? [];
    expect(advertised).toContain('fetch_big');
    expect(advertised).not.toContain('code_execute');
  });

  it('excludes approval-gated tools from the code API', () => {
    const provider = recordingProvider([textOnlyScript('hi')]);
    const agent = createAgent({
      name: 'cm-approval',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [fetchBig, dangerTool],
      toolInvocation: 'code-mode',
    });
    const description = agent.registry?.get('code_execute')?.description ?? '';
    expect(description).toContain('fetch_big'); // a normal tool is offered
    expect(description).not.toContain('danger'); // the approval-gated tool is not
  });
});

// --- the acceptance: only the final result re-enters context ----------------

describe('WI-11 — only the final result re-enters context', () => {
  it('runs a multi-tool script in a sandbox; the large intermediates never enter messages', async () => {
    const source = [
      'const a = await tools.fetch_big({});',
      'const b = await tools.fetch_big({});',
      'return { totalLen: a.length + b.length };',
    ].join('\n');

    const provider = recordingProvider([
      toolCallScript({ toolCallId: 'tc-code', toolName: 'code_execute', args: { source } }),
      textOnlyScript('done'),
    ]);

    const toolMessages: string[] = [];
    const agent = createAgent({
      name: 'cm-run',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [fetchBig],
      toolInvocation: 'code-mode',
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

    const codeResult = toolMessages.find((c) => c.includes('totalLen'));
    expect(codeResult).toBeDefined();
    // The two 100 KB intermediates were combined to a tiny final result…
    expect(codeResult).toContain('200000');
    expect(codeResult?.length).toBeLessThan(200);
    // …and the 200 KB of intermediate data never entered the conversation.
    expect(toolMessages.some((c) => c.includes('X'.repeat(2000)))).toBe(false);
    for (const m of toolMessages) trackSpill(m);
  });
});

/** Track any spill dir referenced by a handle, for cleanup. */
function trackSpill(content: string): void {
  const m = content.match(/graphorin-spill:([^"\s\]]+)/);
  const runId = m?.[1]?.split('/')[0];
  if (runId !== undefined) spillDirsToClean.push(path.join(os.tmpdir(), 'graphorin-spill', runId));
}
