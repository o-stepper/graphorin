/**
 * D2 sub-agent isolation tests: the run-level `'read-only'` capability
 * (advertise filter + deterministic executor gate = the single-writer
 * constraint), context folding at the `toTool` boundary, and taint
 * propagation across the fold into the parent's data-flow ledger.
 */

import type { Provider, ProviderEvent, ProviderRequest, Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function readTool(name: string, body = 'read-ok'): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `Read-only tool ${name}.`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'read-only',
    execute: async () => body,
  } as Tool<unknown, unknown, unknown>;
}

function writeTool(name: string, state: { ran: boolean }): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `Side-effecting tool ${name}.`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'side-effecting',
    execute: async () => {
      state.ran = true;
      return 'wrote';
    },
  } as Tool<unknown, unknown, unknown>;
}

function capturingProvider(scripts: ReadonlyArray<MockProviderScript>): Provider & {
  readonly requests: ProviderRequest[];
} {
  let cursor = 0;
  const requests: ProviderRequest[] = [];
  return {
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
      requests.push(req);
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
    get requests() {
      return requests;
    },
  };
}

describe('D2 — read-only run capability (single-writer constraint)', () => {
  it('advertises only pure/read-only tools and no handoffs to the model', async () => {
    const wrote = { ran: false };
    const helper = createAgent({
      name: 'helper',
      instructions: 'helper',
      provider: capturingProvider([textOnlyScript('hi')]),
    });
    const provider = capturingProvider([textOnlyScript('done')]);
    const agent = createAgent({
      name: 'reader',
      instructions: 'read things',
      provider,
      tools: [readTool('lookup'), writeTool('mutate', wrote)],
      handoffs: [helper],
      capability: 'read-only',
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    const advertised = (provider.requests[0]?.tools ?? []).map((t) => t.name);
    expect(advertised).toContain('lookup');
    expect(advertised).not.toContain('mutate');
    expect(advertised.some((n) => n.startsWith('transfer_to_'))).toBe(false);
  });

  it('blocks a fabricated writer call at the executor with capability_blocked', async () => {
    const wrote = { ran: false };
    const provider = capturingProvider([
      // The model calls the writer even though it was never advertised.
      toolCallScript({ toolCallId: 'c1', toolName: 'mutate', args: {} }),
      textOnlyScript('done'),
    ]);
    const agent = createAgent({
      name: 'reader',
      instructions: 'read things',
      provider,
      tools: [readTool('lookup'), writeTool('mutate', wrote)],
    });
    // Per-call capability override (no config default needed).
    const result = await agent.run('go', { capability: 'read-only' });
    expect(result.status).toBe('completed');
    expect(wrote.ran).toBe(false);
    const outcomes = result.state.steps.flatMap((s) => s.toolCalls);
    expect(outcomes.length).toBe(1);
    const outcome = outcomes[0]?.outcome;
    expect(outcome !== undefined && 'kind' in outcome ? outcome.kind : null).toBe(
      'capability_blocked',
    );
  });

  it('leaves writer tools untouched without the capability (default)', async () => {
    const wrote = { ran: false };
    const provider = capturingProvider([
      toolCallScript({ toolCallId: 'c1', toolName: 'mutate', args: {} }),
      textOnlyScript('done'),
    ]);
    const agent = createAgent({
      name: 'writer',
      instructions: 'write things',
      provider,
      tools: [writeTool('mutate', wrote)],
    });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    expect(wrote.ran).toBe(true);
  });
});

describe('D2 — context folding at the toTool boundary', () => {
  it('returns a distilled, bounded outcome instead of the raw output', async () => {
    const longText = 'finding: '.concat('x'.repeat(5000));
    const child = createAgent({
      name: 'researcher',
      instructions: 'research',
      provider: capturingProvider([
        toolCallScript({ toolCallId: 'c1', toolName: 'lookup', args: {} }),
        textOnlyScript(longText),
      ]),
      tools: [readTool('lookup')],
    });
    const tool = child.toTool({ contextFold: { maxChars: 200 } });
    const raw = await tool.execute(
      { input: 'find things' },
      undefined as unknown as Parameters<typeof tool.execute>[1],
    );
    const folded = (
      typeof raw === 'object' && raw !== null && 'output' in raw
        ? (raw as { output: unknown }).output
        : raw
    ) as string;
    expect(folded).toContain("[sub-agent 'researcher' outcome] status=completed");
    expect(folded).toContain('steps=2');
    expect(folded).toContain('tools=lookup');
    expect(folded).toContain('truncated by contextFold');
    expect(folded.length).toBeLessThan(600);
  });
});

describe('D2 — taint propagation across the fold', () => {
  it('carries the child taint summary as a widen-only ToolReturn override', async () => {
    const untrustedRead: Tool<unknown, unknown, unknown> = {
      name: 'web_fetch',
      description: 'Fetch untrusted web content.',
      inputSchema: passthroughSchema,
      sideEffectClass: 'read-only',
      inboundSanitization: 'pass-through',
      __source: { kind: 'web-search', providerName: 'searchco' },
      execute: async () => 'wild internet content',
    } as Tool<unknown, unknown, unknown>;

    const child = createAgent({
      name: 'browser',
      instructions: 'browse',
      provider: capturingProvider([
        toolCallScript({ toolCallId: 'c1', toolName: 'web_fetch', args: {} }),
        textOnlyScript('summary of the page'),
      ]),
      tools: [untrustedRead],
      dataFlowPolicy: { mode: 'shadow' },
    });
    const tool = child.toTool();
    const raw = await tool.execute(
      { input: 'browse example.com' },
      undefined as unknown as Parameters<typeof tool.execute>[1],
    );
    expect(typeof raw).toBe('object');
    const envelope = raw as {
      output: unknown;
      taint?: { untrusted?: boolean; sourceKind?: string };
    };
    expect(envelope.taint?.untrusted).toBe(true);
    expect(envelope.taint?.sourceKind).toBe('sub-agent');

    // propagateTaint: false restores the raw output shape (fresh child —
    // the scripted provider is single-use).
    const child2 = createAgent({
      name: 'browser2',
      instructions: 'browse',
      provider: capturingProvider([
        toolCallScript({ toolCallId: 'c1', toolName: 'web_fetch', args: {} }),
        textOnlyScript('summary of the page'),
      ]),
      tools: [untrustedRead],
      dataFlowPolicy: { mode: 'shadow' },
    });
    const optOut = child2.toTool({ propagateTaint: false });
    const plain = await optOut.execute(
      { input: 'browse example.com' },
      undefined as unknown as Parameters<typeof optOut.execute>[1],
    );
    expect(typeof plain).toBe('string');
  });

  it('re-arms the parent ledger end-to-end through the sub-agent tool', async () => {
    const child = createAgent({
      name: 'browser',
      instructions: 'browse',
      provider: capturingProvider([
        toolCallScript({ toolCallId: 'c1', toolName: 'web_fetch', args: {} }),
        textOnlyScript('summary of the page'),
      ]),
      tools: [
        {
          name: 'web_fetch',
          description: 'Fetch untrusted web content.',
          inputSchema: passthroughSchema,
          sideEffectClass: 'read-only',
          inboundSanitization: 'pass-through',
          __source: { kind: 'web-search', providerName: 'searchco' },
          execute: async () => 'wild internet content',
        } as Tool<unknown, unknown, unknown>,
      ],
      dataFlowPolicy: { mode: 'shadow' },
    });

    const parent = createAgent({
      name: 'orchestrator',
      instructions: 'orchestrate',
      provider: capturingProvider([
        toolCallScript({ toolCallId: 'p1', toolName: 'subagent_browser', args: { input: 'go' } }),
        textOnlyScript('all done'),
      ]),
      tools: [child.toTool() as unknown as Tool<unknown, unknown, unknown>],
      dataFlowPolicy: { mode: 'shadow' },
    });
    const result = await parent.run('research this');
    expect(result.status).toBe('completed');
    // The parent's persisted taint summary re-armed from the child.
    expect(result.state.taintSummary?.untrustedSeen).toBe(true);
    expect(result.state.taintSummary?.untrustedSourceKinds).toContain('sub-agent');
  });
});
