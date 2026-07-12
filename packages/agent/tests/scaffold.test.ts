import type {
  Message,
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Tool,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { type MockProviderScript, textOnlyScript } from './fixtures/mock-provider.js';

/**
 * C6 (decision D-10): the `scaffold: 'minimal' | 'full'` preset. Minimal
 * is the cheap-run posture - instructions-only prompt, defer-loading by
 * default (catalogue starts at `tool_search` alone), no plan tool /
 * recitation. Security layers are untouched by design.
 */

/** Minimal pass-through input schema (no zod dep in `@graphorin/agent`). */
const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function makeTool(
  name: string,
  extra: Partial<Tool<unknown, unknown, unknown>> = {},
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'read-only',
    execute: async () => 'ok',
    ...extra,
  } as Tool<unknown, unknown, unknown>;
}

/** Records the advertised tool names and messages of every step. */
function createRecordingProvider(scripts: ReadonlyArray<MockProviderScript>): {
  readonly provider: Provider;
  readonly toolNamesPerStep: string[][];
  readonly messagesPerStep: Message[][];
} {
  const toolNamesPerStep: string[][] = [];
  const messagesPerStep: Message[][] = [];
  let cursor = 0;
  const provider: Provider = {
    name: 'recording',
    modelId: 'mock',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200000,
      maxOutput: 8192,
    },
    async *stream(req: ProviderRequest): AsyncIterable<ProviderEvent> {
      toolNamesPerStep.push((req.tools ?? []).map((t) => t.name));
      messagesPerStep.push([...req.messages]);
      const idx = cursor++;
      const script = scripts[idx];
      if (script === undefined) {
        yield {
          type: 'error',
          error: { kind: 'unknown', message: `recording provider: no script for call #${idx}` },
        };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate(_req: ProviderRequest): Promise<ProviderResponse> {
      throw new Error('recording provider: generate(...) not implemented; use stream(...).');
    },
  };
  return { provider, toolNamesPerStep, messagesPerStep };
}

describe("C6: scaffold preset 'minimal' | 'full'", () => {
  it('rejects contradictory explicit flags fail-fast', () => {
    const { provider } = createRecordingProvider([]);
    expect(() =>
      createAgent({
        name: 'bad-1',
        instructions: 'x',
        provider,
        scaffold: 'minimal',
        autoAssembleContext: true,
      }),
    ).toThrow(/scaffold 'minimal' with autoAssembleContext/);
    expect(() =>
      createAgent({
        name: 'bad-2',
        instructions: 'x',
        provider,
        scaffold: 'minimal',
        plan: true,
      }),
    ).toThrow(/scaffold 'minimal' with plan/);
  });

  it('minimal: every undeclared tool defers - the step catalogue is tool_search alone', async () => {
    const { provider, toolNamesPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'lean',
      instructions: 'noop',
      provider,
      scaffold: 'minimal',
      tools: [makeTool('memory_search'), makeTool('web_fetch'), makeTool('calc')],
    });
    for await (const _ev of agent.stream('go')) {
      /* drain */
    }
    expect(toolNamesPerStep[0]).toEqual(['tool_search']);
  });

  it('minimal: an explicit defer_loading: false stays eager (per-tool declaration wins)', async () => {
    const { provider, toolNamesPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'lean-pin',
      instructions: 'noop',
      provider,
      scaffold: 'minimal',
      tools: [makeTool('always_on', { defer_loading: false }), makeTool('lazy_one')],
    });
    for await (const _ev of agent.stream('go')) {
      /* drain */
    }
    const step1 = toolNamesPerStep[0] ?? [];
    expect(step1).toContain('always_on');
    expect(step1).toContain('tool_search');
    expect(step1).not.toContain('lazy_one');
  });

  it('minimal: the system prompt is the instructions verbatim (snapshot)', async () => {
    const { provider, messagesPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'lean-prompt',
      instructions: 'You are a tiny heartbeat runner.',
      provider,
      scaffold: 'minimal',
      tools: [makeTool('memory_search')],
    });
    for await (const _ev of agent.stream('go')) {
      /* drain */
    }
    const step1 = messagesPerStep[0] ?? [];
    const systemMessages = step1.filter((m) => m.role === 'system');
    expect(systemMessages.length).toBe(1);
    expect(systemMessages[0]?.content).toMatchInlineSnapshot(`"You are a tiny heartbeat runner."`);
    // No plan recitation block anywhere in the request.
    expect(step1.some((m) => m.role === 'system' && String(m.content).includes('<plan>'))).toBe(
      false,
    );
  });

  it("scaffold 'full' (and default) keeps the pre-C6 behaviour - undeclared tools stay eager", async () => {
    const scriptsA = [textOnlyScript('hi', 4)];
    const a = createRecordingProvider(scriptsA);
    const full = createAgent({
      name: 'full-explicit',
      instructions: 'noop',
      provider: a.provider,
      scaffold: 'full',
      tools: [makeTool('echo')],
    });
    for await (const _ev of full.stream('go')) {
      /* drain */
    }
    expect(a.toolNamesPerStep[0]).toEqual(['echo']);

    const b = createRecordingProvider([textOnlyScript('hi', 4)]);
    const dflt = createAgent({
      name: 'full-default',
      instructions: 'noop',
      provider: b.provider,
      tools: [makeTool('echo')],
    });
    for await (const _ev of dflt.stream('go')) {
      /* drain */
    }
    expect(b.toolNamesPerStep[0]).toEqual(['echo']);
  });
});
