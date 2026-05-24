import type {
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Tool,
  ToolDefinition,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { type MockProviderScript, textOnlyScript } from './fixtures/mock-provider.js';

// --- shared fixtures --------------------------------------------------------

/** Minimal pass-through input schema (no zod dep in `@graphorin/agent`). */
const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

/** Build a plain `Tool` whose `execute` is supplied by the caller. */
function makeTool(
  name: string,
  execute: Tool<unknown, unknown, unknown>['execute'],
  extra: Partial<Tool<unknown, unknown, unknown>> = {},
): Tool<unknown, unknown, unknown> {
  return {
    name,
    description: `${name} tool`,
    inputSchema: passthroughSchema,
    sideEffectClass: 'read-only',
    execute,
    ...extra,
  } as Tool<unknown, unknown, unknown>;
}

const noop = async (): Promise<string> => 'ok';

/** Provider script that emits several tool calls inside a single step. */
function multiToolCallScript(
  calls: ReadonlyArray<{
    readonly toolCallId: string;
    readonly toolName: string;
    readonly args: unknown;
  }>,
): MockProviderScript {
  const events: ProviderEvent[] = [
    { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
  ];
  for (const c of calls) {
    events.push(
      { type: 'tool-call-start', toolCallId: c.toolCallId, toolName: c.toolName },
      {
        type: 'tool-call-input-delta',
        toolCallId: c.toolCallId,
        argsDelta: JSON.stringify(c.args),
      },
      { type: 'tool-call-end', toolCallId: c.toolCallId, finalArgs: c.args },
    );
  }
  events.push({
    type: 'finish',
    finishReason: 'tool-calls',
    usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
  });
  return { events };
}

/**
 * A provider that records the full `ToolDefinition[]` advertised on each
 * `stream(...)` call (i.e. the per-step catalogue the loop built) before
 * yielding the scripted events. `toolDefsPerStep[i]` is step `i`'s catalogue.
 */
function createRecordingProvider(scripts: ReadonlyArray<MockProviderScript>): {
  readonly provider: Provider;
  readonly toolDefsPerStep: ToolDefinition[][];
} {
  const toolDefsPerStep: ToolDefinition[][] = [];
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
      toolDefsPerStep.push([...(req.tools ?? [])]);
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
  return { provider, toolDefsPerStep };
}

const findDef = (step: ToolDefinition[] | undefined, name: string): ToolDefinition | undefined =>
  (step ?? []).find((d) => d.name === name);

// --- WI-06: toolToDefinition renders examples -------------------------------

describe('toolToDefinition examples rendering (WI-06)', () => {
  it("renders a tool's worked examples into the provider definition", async () => {
    const { provider, toolDefsPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'ex-render',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo', noop, {
          examples: [{ input: { q: 'hello' }, output: 'world', comment: 'greeting demo' }],
        }),
      ],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    const def = findDef(toolDefsPerStep[0], 'echo');
    expect(def?.examples).toBeDefined();
    expect(def?.examples).toHaveLength(1);
    expect(def?.examples?.[0]).toEqual({
      input: { q: 'hello' },
      output: 'world',
      comment: 'greeting demo',
    });
  });

  it('omits the comment key when an example declares none', async () => {
    const { provider, toolDefsPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'ex-nocomment',
      instructions: 'noop',
      provider,
      tools: [makeTool('echo', noop, { examples: [{ input: { q: 'hi' }, output: 'ok' }] })],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    const def = findDef(toolDefsPerStep[0], 'echo');
    expect(def?.examples?.[0]).toEqual({ input: { q: 'hi' }, output: 'ok' });
    expect(def?.examples?.[0] && 'comment' in def.examples[0]).toBe(false);
  });

  it('omits examples when examplesEagerlyRendered is false', async () => {
    const { provider, toolDefsPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'ex-optout',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo', noop, {
          examplesEagerlyRendered: false,
          examples: [{ input: { q: 'hi' }, output: 'ok' }],
        }),
      ],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    const def = findDef(toolDefsPerStep[0], 'echo');
    expect(def).toBeDefined();
    expect(def?.examples).toBeUndefined();
  });

  it('bounds rendered examples to five (registry only WARNs on overflow)', async () => {
    const { provider, toolDefsPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const many = Array.from({ length: 6 }, (_v, i) => ({ input: { n: i }, output: `r${i}` }));
    const agent = createAgent({
      name: 'ex-bound',
      instructions: 'noop',
      provider,
      tools: [makeTool('echo', noop, { examples: many })],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    expect(findDef(toolDefsPerStep[0], 'echo')?.examples).toHaveLength(5);
  });

  it('does not eagerly render examples for a deferred tool, even once promoted', async () => {
    const { provider, toolDefsPerStep } = createRecordingProvider([
      multiToolCallScript([
        { toolCallId: 'tc-search', toolName: 'tool_search', args: { query: 'weather' } },
      ]),
      textOnlyScript('done', 4),
    ]);
    const agent = createAgent({
      name: 'ex-defer',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo', noop),
        makeTool('weather_lookup', noop, {
          defer_loading: true,
          description: 'Get the weather forecast for a city',
          examples: [{ input: { city: 'NYC' }, output: 'sunny' }],
        }),
      ],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    // Step 1: deferred ⇒ withheld from the catalogue entirely.
    expect(findDef(toolDefsPerStep[0], 'weather_lookup')).toBeUndefined();
    // Step 2: tool_search promoted it, but the defer rule keeps its examples
    // out of context (normalize resolved examplesEagerlyRendered ⇒ false).
    const promoted = findDef(toolDefsPerStep[1], 'weather_lookup');
    expect(promoted).toBeDefined();
    expect(promoted?.examples).toBeUndefined();
  });
});
