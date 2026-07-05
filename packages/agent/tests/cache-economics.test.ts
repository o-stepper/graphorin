/**
 * C1 (core-provider-02 / agent-11): prompt-cache economics at the agent
 * loop level - cache token legs survive per-step and per-run usage
 * aggregation, `cachePolicy` rides every ProviderRequest, the serialized
 * tool catalogue keeps a byte-stable prefix when a promotion lands
 * (handoffs serialize BEFORE the growing promoted section), and
 * `toolPromotion: 'run-boundary'` freezes the advertised catalogue for
 * the whole run while still persisting discoveries.
 */
import type {
  AgentEvent,
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Tool,
} from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { type MockProviderScript, textOnlyScript } from './fixtures/mock-provider.js';

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
};

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

function toolCallEvents(toolCallId: string, toolName: string, args: unknown): ProviderEvent[] {
  return [
    { type: 'tool-call-start', toolCallId, toolName },
    { type: 'tool-call-input-delta', toolCallId, argsDelta: JSON.stringify(args) },
    { type: 'tool-call-end', toolCallId, finalArgs: args },
  ];
}

/** finish event carrying prompt-cache legs in its usage. */
function cachedFinish(parts: {
  prompt: number;
  completion: number;
  cachedRead?: number;
  cacheWrite?: number;
  toolCalls?: boolean;
}): ProviderEvent {
  return {
    type: 'finish',
    finishReason: parts.toolCalls === true ? 'tool-calls' : 'stop',
    usage: {
      promptTokens: parts.prompt,
      completionTokens: parts.completion,
      totalTokens: parts.prompt + parts.completion,
      ...(parts.cachedRead !== undefined ? { cachedReadTokens: parts.cachedRead } : {}),
      ...(parts.cacheWrite !== undefined ? { cacheWriteTokens: parts.cacheWrite } : {}),
    },
  };
}

/** Records the full request per step, then plays the given script. */
function createCapturingProvider(scripts: ReadonlyArray<MockProviderScript>): {
  readonly provider: Provider;
  readonly requests: ProviderRequest[];
} {
  const requests: ProviderRequest[] = [];
  let cursor = 0;
  const provider: Provider = {
    name: 'capturing',
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
      requests.push(req);
      const script = scripts[cursor++];
      if (script === undefined) {
        yield { type: 'error', error: { kind: 'unknown', message: 'no script' } };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate(_req: ProviderRequest): Promise<ProviderResponse> {
      throw new Error('use stream()');
    },
  };
  return { provider, requests };
}

describe('C1 - cache usage aggregation through the loop', () => {
  it('carries cachedRead/cacheWrite through step.end, result.usage and usageByModel', async () => {
    const { provider } = createCapturingProvider([
      {
        events: [
          { type: 'stream-start', metadata: { providerName: 'capturing', modelId: 'mock' } },
          ...toolCallEvents('tc-1', 'echo', {}),
          cachedFinish({
            prompt: 100,
            completion: 10,
            cachedRead: 0,
            cacheWrite: 90,
            toolCalls: true,
          }),
        ],
      },
      {
        events: [
          { type: 'stream-start', metadata: { providerName: 'capturing', modelId: 'mock' } },
          { type: 'text-delta', delta: 'done' },
          cachedFinish({ prompt: 120, completion: 5, cachedRead: 90 }),
        ],
      },
    ]);
    const agent = createAgent({
      name: 'cache-usage',
      instructions: 'noop',
      provider,
      tools: [makeTool('echo')],
    });

    const stepUsages: Array<{ step: number; cachedRead?: number; cacheWrite?: number }> = [];
    let result: Extract<AgentEvent, { type: 'agent.end' }> | undefined;
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'step.end') {
        stepUsages.push({
          step: ev.stepNumber,
          ...(ev.usage.cachedReadTokens !== undefined
            ? { cachedRead: ev.usage.cachedReadTokens }
            : {}),
          ...(ev.usage.cacheWriteTokens !== undefined
            ? { cacheWrite: ev.usage.cacheWriteTokens }
            : {}),
        });
      }
      if (ev.type === 'agent.end') result = ev;
    }

    expect(stepUsages).toEqual([
      { step: 1, cachedRead: 0, cacheWrite: 90 },
      { step: 2, cachedRead: 90 },
    ]);
    // Run aggregate: reads 0+90, writes 90.
    expect(result?.result.usage.cachedReadTokens).toBe(90);
    expect(result?.result.usage.cacheWriteTokens).toBe(90);
    const byModel = result?.result.state.usageByModel?.mock;
    expect(byModel?.cachedReadTokens).toBe(90);
    expect(byModel?.cacheWriteTokens).toBe(90);
    expect(byModel?.promptTokens).toBe(220);
  });

  it('keeps the pre-cache Usage shape when no provider reports cache legs', async () => {
    const { provider } = createCapturingProvider([textOnlyScript('hi', 10)]);
    const agent = createAgent({ name: 'no-cache', instructions: 'noop', provider });
    let result: Extract<AgentEvent, { type: 'agent.end' }> | undefined;
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'agent.end') result = ev;
    }
    expect(result?.result.usage.cachedReadTokens).toBeUndefined();
    expect(result?.result.usage.cacheWriteTokens).toBeUndefined();
  });
});

describe('C1 - cachePolicy forwarding', () => {
  it('forwards AgentConfig.cachePolicy verbatim on every ProviderRequest', async () => {
    const { provider, requests } = createCapturingProvider([
      {
        events: [
          { type: 'stream-start', metadata: { providerName: 'capturing', modelId: 'mock' } },
          ...toolCallEvents('tc-1', 'echo', {}),
          cachedFinish({ prompt: 10, completion: 2, toolCalls: true }),
        ],
      },
      textOnlyScript('done', 4),
    ]);
    const agent = createAgent({
      name: 'cache-policy',
      instructions: 'noop',
      provider,
      tools: [makeTool('echo')],
      cachePolicy: { breakpoints: 'auto', ttl: '5m' },
    });
    for await (const _ev of agent.stream('go')) {
      /* drain */
    }
    expect(requests).toHaveLength(2);
    for (const req of requests) {
      expect(req.cachePolicy).toEqual({ breakpoints: 'auto', ttl: '5m' });
    }
  });
});

describe('C1 (agent-11) - catalogue prefix stability across promotions', () => {
  it('serializes handoffs BEFORE promotions; a promotion appends without moving the prefix', async () => {
    const worker = createAgent({
      name: 'worker',
      instructions: 'noop',
      provider: createCapturingProvider([]).provider,
    });
    const { provider, requests } = createCapturingProvider([
      {
        events: [
          { type: 'stream-start', metadata: { providerName: 'capturing', modelId: 'mock' } },
          ...toolCallEvents('tc-s', 'tool_search', { query: 'weather' }),
          cachedFinish({ prompt: 10, completion: 2, toolCalls: true }),
        ],
      },
      textOnlyScript('done', 4),
    ]);
    const agent = createAgent({
      name: 'stable-prefix',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo'),
        makeTool('weather_lookup', {
          defer_loading: true,
          description: 'Get the weather forecast for a city',
        }),
      ],
      handoffs: [worker],
    });
    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    const step1 = (requests[0]?.tools ?? []).map((t) => t.name);
    const step2 = (requests[1]?.tools ?? []).map((t) => t.name);
    // Handoff sits in the stable prefix (before any promotion)...
    expect(step1).toEqual(['echo', 'tool_search', 'transfer_to_worker']);
    // ...so the promotion appends at the END and the prefix is BYTE-stable.
    expect(step2).toEqual(['echo', 'tool_search', 'transfer_to_worker', 'weather_lookup']);
    const prefix1 = JSON.stringify(requests[0]?.tools ?? []);
    const prefix2 = JSON.stringify((requests[1]?.tools ?? []).slice(0, step1.length));
    expect(prefix2).toBe(prefix1);
  });
});

describe("C1 - toolPromotion: 'run-boundary'", () => {
  it('freezes the advertised catalogue for the run but persists the discovery', async () => {
    const { provider, requests } = createCapturingProvider([
      {
        events: [
          { type: 'stream-start', metadata: { providerName: 'capturing', modelId: 'mock' } },
          ...toolCallEvents('tc-s', 'tool_search', { query: 'weather' }),
          cachedFinish({ prompt: 10, completion: 2, toolCalls: true }),
        ],
      },
      textOnlyScript('done', 4),
    ]);
    const agent = createAgent({
      name: 'run-boundary',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo'),
        makeTool('weather_lookup', {
          defer_loading: true,
          description: 'Get the weather forecast for a city',
        }),
      ],
      toolPromotion: 'run-boundary',
    });

    let result: Extract<AgentEvent, { type: 'agent.end' }> | undefined;
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'agent.end') result = ev;
    }

    // The catalogue is byte-identical on both steps (no mid-run promotion)...
    expect(JSON.stringify(requests[0]?.tools)).toBe(JSON.stringify(requests[1]?.tools));
    expect((requests[1]?.tools ?? []).map((t) => t.name)).not.toContain('weather_lookup');
    // ...but the discovery is persisted for the next run / resume.
    expect(result?.result.state.promotedTools).toContain('weather_lookup');
    // The model-facing contract tells the truth about availability.
    const search = (requests[0]?.tools ?? []).find((t) => t.name === 'tool_search');
    expect(search?.description).toContain('NEXT run');
  });
});
