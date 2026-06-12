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
 * A provider that records the tool names advertised on each `stream(...)`
 * call (i.e. the per-step catalogue the loop built) before yielding the
 * scripted events. `toolNamesPerStep[i]` is the catalogue for step `i`.
 */
function createRecordingProvider(scripts: ReadonlyArray<MockProviderScript>): {
  readonly provider: Provider;
  readonly toolNamesPerStep: string[][];
} {
  const toolNamesPerStep: string[][] = [];
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
  return { provider, toolNamesPerStep };
}

// --- WI-05: deferred loading + tool_search ----------------------------------

describe('deferred loading + tool_search (WI-05)', () => {
  it('withholds deferred tools from the catalogue but advertises tool_search', async () => {
    const { provider, toolNamesPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'defer',
      instructions: 'noop',
      provider,
      tools: [makeTool('echo', noop), makeTool('weather_lookup', noop, { defer_loading: true })],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    const step1 = toolNamesPerStep[0] ?? [];
    expect(step1).toContain('echo');
    expect(step1).toContain('tool_search');
    // The deferred tool is registered but withheld from the catalogue.
    expect(step1).not.toContain('weather_lookup');
  });

  it('registers tool_search as an executor-resolvable tool that returns deferred matches', async () => {
    const { provider } = createRecordingProvider([
      multiToolCallScript([
        { toolCallId: 'tc-search', toolName: 'tool_search', args: { query: 'weather' } },
      ]),
      textOnlyScript('done', 4),
    ]);
    const agent = createAgent({
      name: 'search',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo', noop),
        makeTool('weather_lookup', noop, {
          defer_loading: true,
          description: 'Get the weather forecast for a city',
        }),
      ],
    });

    // tool_search is registered (a tool defers) and visible on the registry.
    expect(agent.registry?.get('tool_search')).toBeDefined();

    const matches: Array<{ name: string }> = [];
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.end' && ev.toolCallId === 'tc-search') {
        const result = ev.result as { matches?: Array<{ name: string }> };
        matches.push(...(result.matches ?? []));
      }
    }

    // The executor resolved + ran tool_search, which surfaced the deferred tool.
    expect(matches.some((m) => m.name === 'weather_lookup')).toBe(true);
  });

  it('promotes a matched deferred tool so it is advertised and callable next step', async () => {
    const { provider, toolNamesPerStep } = createRecordingProvider([
      multiToolCallScript([
        { toolCallId: 'tc-search', toolName: 'tool_search', args: { query: 'weather' } },
      ]),
      multiToolCallScript([
        { toolCallId: 'tc-call', toolName: 'weather_lookup', args: { city: 'NYC' } },
      ]),
      textOnlyScript('done', 4),
    ]);

    let weatherRan = false;
    const agent = createAgent({
      name: 'promote',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo', noop),
        makeTool(
          'weather_lookup',
          async () => {
            weatherRan = true;
            return 'sunny';
          },
          { defer_loading: true, description: 'Get the weather forecast for a city' },
        ),
      ],
    });

    const endResults = new Map<string, unknown>();
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'tool.execute.end') endResults.set(ev.toolCallId, ev.result);
    }

    // Step 1 withheld the deferred tool; step 2 advertises it (promoted).
    expect(toolNamesPerStep[0] ?? []).not.toContain('weather_lookup');
    expect(toolNamesPerStep[1] ?? []).toContain('weather_lookup');
    // ...and the promoted tool actually executed via the executor.
    expect(weatherRan).toBe(true);
    expect(endResults.get('tc-call')).toBe('sunny');
  });

  it('keeps a promoted tool advertised for the remainder of the run', async () => {
    // Step 2 calls an eager tool (keeps the loop going) so we can observe
    // the promoted tool still advertised on a third step.
    const { provider, toolNamesPerStep } = createRecordingProvider([
      multiToolCallScript([
        { toolCallId: 'tc-search', toolName: 'tool_search', args: { query: 'weather' } },
      ]),
      multiToolCallScript([{ toolCallId: 'tc-echo', toolName: 'echo', args: {} }]),
      textOnlyScript('done', 4),
    ]);
    const agent = createAgent({
      name: 'sticky',
      instructions: 'noop',
      provider,
      tools: [
        makeTool('echo', noop),
        makeTool('weather_lookup', noop, {
          defer_loading: true,
          description: 'Get the weather forecast for a city',
        }),
      ],
    });

    for await (const _ev of agent.stream('go')) {
      /* drain */
    }

    // Promoted in step 1, still advertised on steps 2 and 3.
    expect(toolNamesPerStep[0] ?? []).not.toContain('weather_lookup');
    expect(toolNamesPerStep[1] ?? []).toContain('weather_lookup');
    expect(toolNamesPerStep[2] ?? []).toContain('weather_lookup');
  });

  it('neither registers nor advertises tool_search when no tool defers', async () => {
    const { provider, toolNamesPerStep } = createRecordingProvider([textOnlyScript('hi', 4)]);
    const agent = createAgent({
      name: 'eager-only',
      instructions: 'noop',
      provider,
      tools: [makeTool('echo', noop), makeTool('lookup', noop)],
    });

    // No deferred tool ⇒ tool_search is never registered.
    expect(agent.registry?.get('tool_search')).toBeUndefined();

    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);

    const step1 = toolNamesPerStep[0] ?? [];
    expect(step1).toContain('echo');
    expect(step1).toContain('lookup');
    expect(step1).not.toContain('tool_search');
  });
});

// --- TL-7 — promotions persist on RunState across suspend/resume --------------

describe('TL-7 — tool_search promotions survive suspend/resume', () => {
  it('persists promoted names on RunState and keeps them in the resumed catalogue', async () => {
    const sharedTools = (): Tool<unknown, unknown, unknown>[] => [
      makeTool('echo', noop),
      makeTool('weather_lookup', noop, {
        defer_loading: true,
        description: 'Get the weather forecast for a city',
      }),
      makeTool('send_email', noop, { needsApproval: true }),
    ];

    // Run 1: tool_search promotes weather_lookup, then a gated call suspends.
    const { provider } = createRecordingProvider([
      multiToolCallScript([
        { toolCallId: 'tc-search', toolName: 'tool_search', args: { query: 'weather' } },
      ]),
      multiToolCallScript([{ toolCallId: 'tc-mail', toolName: 'send_email', args: {} }]),
    ]);
    const agent = createAgent({
      name: 'promoter',
      instructions: 'noop',
      provider,
      tools: sharedTools(),
    });
    const result = await agent.run('go');
    expect(result.status).toBe('awaiting_approval');
    // The discovery is part of the trajectory — it must be ON the state.
    expect(result.state.promotedTools).toContain('weather_lookup');

    // Resume on a FRESH instance (process restart): the promoted tool is
    // advertised WITHOUT the model having to re-search.
    const { provider: provider2, toolNamesPerStep } = createRecordingProvider([
      textOnlyScript('done', 4),
    ]);
    const resumeAgent = createAgent({
      name: 'promoter',
      instructions: 'noop',
      provider: provider2,
      tools: sharedTools(),
    });
    const rehydrated = JSON.parse(JSON.stringify(result.state));
    const resumed = await resumeAgent.run(rehydrated, {
      directive: { approvals: [{ toolCallId: 'tc-mail', granted: true }] },
    });
    expect(resumed.status).toBe('completed');
    const firstResumedStep = toolNamesPerStep[0] ?? [];
    expect(firstResumedStep).toContain('weather_lookup');
  });
});
