import type { AgentEvent, Message, Tool } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import {
  createMockProvider,
  type MockProviderScript,
  textOnlyScript,
  toolCallScript,
} from './fixtures/mock-provider.js';

// --- shared fixtures --------------------------------------------------------

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

/** A pure no-op tool; tool-call steps keep the loop running. */
const noopTool: Tool<unknown, unknown, unknown> = {
  name: 'noop',
  description: 'noop tool',
  inputSchema: passthroughSchema,
  sideEffectClass: 'pure',
  execute: async () => 'ok',
} as Tool<unknown, unknown, unknown>;

/** One provider step that calls `noop` (so the loop continues). */
function noopStep(id: string): MockProviderScript {
  return toolCallScript({ toolCallId: id, toolName: 'noop', args: {} });
}

/** `n` tool-call steps followed by a terminating text step. */
function toolStepsThenText(n: number, text = 'done'): MockProviderScript[] {
  return [...Array.from({ length: n }, (_, i) => noopStep(`tc-${i}`)), textOnlyScript(text)];
}

interface FakeEngineOptions {
  /** `shouldCompact` returns true once the buffer reaches this length. */
  readonly triggerAtMessages: number;
  /** Recent messages of the body kept verbatim by the summary. */
  readonly preserveRecent: number;
  /** Post-compaction hook content re-injected by the runtime. */
  readonly extraContent?: ReadonlyArray<{ readonly type: 'text'; readonly text: string }>;
  /** Simulate a misconfigured engine (e.g. no summarizer). */
  readonly throwOnCompact?: boolean;
}

interface FakeMemoryHandle {
  readonly memory: Memory;
  readonly shouldCompactCalls: () => number;
  readonly compactNowCalls: () => number;
}

/**
 * A deterministic, offline stand-in for the memory `ContextEngine`. The
 * agent loop only ever calls `shouldCompact` + `compactNow`; `compactNow`
 * mirrors the real `summarize-old-preserve-recent` envelope shape
 * (`trimmedMessages = [summary, ...preserved]`) so the agent's splice /
 * emit path is exercised against the real contract. The real engine's
 * summarisation is unit-tested in `@graphorin/memory`.
 */
function makeFakeMemory(opts: FakeEngineOptions): FakeMemoryHandle {
  let shouldCompactCalls = 0;
  let compactNowCalls = 0;
  const engine = {
    async shouldCompact(messages: ReadonlyArray<Message>): Promise<boolean> {
      shouldCompactCalls += 1;
      return messages.length >= opts.triggerAtMessages;
    },
    async compactNow(input: {
      readonly messages: ReadonlyArray<Message>;
      readonly source: 'auto-trigger' | 'manual' | 'pre-step';
    }) {
      compactNowCalls += 1;
      if (opts.throwOnCompact === true) throw new Error('no summarizer configured');
      const body = input.messages;
      const olderCount = Math.max(0, body.length - opts.preserveRecent);
      const older = body.slice(0, olderCount);
      const preserved = body.slice(olderCount);
      const summaryMessage: Message = { role: 'system', content: `SUMMARY[${older.length}]` };
      const trimmedMessages: ReadonlyArray<Message> =
        older.length === 0 ? preserved : [summaryMessage, ...preserved];
      const extraContent = opts.extraContent ?? [];
      return {
        result: {
          summary: older.length === 0 ? '' : `SUMMARY[${older.length}]`,
          summaryTokens: 7,
          beforeTokens: body.length * 100,
          afterTokens: trimmedMessages.length * 100,
          droppedMessageIds: older.map((_, i) => `m${i}`),
          droppedMessageIndices: older.map((_, i) => i),
          preservedMessages: preserved,
          trimmedMessages,
          source: input.source,
          durationMs: 1,
          hooksFiredCount: extraContent.length > 0 ? 1 : 0,
        },
        extraContent,
        hookFailures: [],
      };
    },
  };
  return {
    memory: { contextEngine: engine } as unknown as Memory,
    shouldCompactCalls: () => shouldCompactCalls,
    compactNowCalls: () => compactNowCalls,
  };
}

// --- auto-compaction trigger ------------------------------------------------

describe('WI-09 — auto-compaction trigger', () => {
  it('fires context.compacted with the full event shape when the buffer crosses threshold', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 6,
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(2) });
    const agent = createAgent({
      name: 'compactor',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [noopTool],
    });

    const compacted: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'context.compacted') compacted.push(ev);
    }

    // Buffer reaches [system,user,asst,tool,asst,tool] = 6 at step 3 start.
    expect(compactNowCalls()).toBe(1);
    expect(compacted).toHaveLength(1);
    const ev = compacted[0];
    if (ev?.type !== 'context.compacted') throw new Error('expected a context.compacted event');
    expect(ev.source).toBe('auto-trigger');
    expect(ev.agentId).toBe(agent.id);
    expect(typeof ev.runId).toBe('string');
    expect(ev.runId.length).toBeGreaterThan(0);
    expect(ev.beforeTokens).toBeGreaterThan(ev.afterTokens);
    expect(ev.summaryTokens).toBe(7);
    expect(ev.durationMs).toBeGreaterThanOrEqual(0);
    expect(ev.hooksFiredCount).toBe(0);
  });

  it('does not fire when no memory is wired (R10 happy-path trace unchanged)', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'noop', args: {} }),
        textOnlyScript('all done'),
      ],
    });
    const agent = createAgent({
      name: 'no-memory',
      instructions: 'INSTRUCTIONS',
      provider,
      tools: [noopTool],
    });

    const types: string[] = [];
    for await (const ev of agent.stream('go')) types.push(ev.type);

    expect(types).not.toContain('context.compacted');
    expect(types).toEqual([
      'agent.start',
      'step.start',
      'tool.call.start',
      'tool.call.delta',
      'tool.call.end',
      'tool.execute.start',
      'tool.execute.end',
      'step.end',
      'step.start',
      'text.delta',
      'text.complete',
      'step.end',
    ]);
  });

  it('is best-effort: a compactNow failure (e.g. no summarizer) never aborts the run', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 6,
      preserveRecent: 2,
      throwOnCompact: true,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(2) });
    const agent = createAgent({
      name: 'misconfigured',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [noopTool],
    });

    const types: string[] = [];
    for await (const ev of agent.stream('go')) types.push(ev.type);

    expect(compactNowCalls()).toBe(1); // attempted
    expect(types).not.toContain('context.compacted'); // but produced no event
    expect(types).not.toContain('agent.error'); // and did not fail the run
    expect(types).toContain('text.complete'); // run completed normally
  });
});

// --- KV-cache prefix stability ----------------------------------------------

describe('WI-09 — KV-cache system-prefix stability', () => {
  it('keeps the system-prompt prefix byte-identical across steps, including a compaction', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 6,
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(3) });

    const prefixContents: Array<string | undefined> = [];
    const agent = createAgent({
      name: 'stable-prefix',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [noopTool],
      prepareStep: (ctx) => {
        const head = ctx.messages[0];
        prefixContents.push(
          head !== undefined && typeof head.content === 'string' ? head.content : undefined,
        );
        return {};
      },
    });

    for await (const _ of agent.stream('go')) {
      // drain
    }

    expect(compactNowCalls()).toBeGreaterThanOrEqual(1); // a compaction happened
    expect(prefixContents.length).toBeGreaterThan(1); // observed multiple steps
    // The instruction prefix is never rewritten — not even by the
    // summary system message (which is spliced *after* the prefix).
    for (const content of prefixContents) {
      expect(content).toBe('INSTRUCTIONS');
    }
  });
});

// --- bounded context on long runs -------------------------------------------

describe('WI-09 — bounded context on long runs', () => {
  it('keeps the buffer bounded across many steps via repeated compaction', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 8,
      preserveRecent: 2,
    });
    const steps = 12;
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(steps) });

    const lengths: number[] = [];
    const agent = createAgent({
      name: 'long-run',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [noopTool],
      prepareStep: (ctx) => {
        lengths.push(ctx.messages.length);
        return {};
      },
    });

    for await (const _ of agent.stream('go')) {
      // drain
    }

    // Without compaction the buffer would reach ~2 + 2*steps messages.
    const unbounded = 2 + 2 * steps;
    const maxObserved = Math.max(...lengths);
    expect(maxObserved).toBeLessThanOrEqual(8);
    expect(maxObserved).toBeLessThan(unbounded);
    expect(compactNowCalls()).toBeGreaterThanOrEqual(2); // compacted repeatedly
  });
});

// --- sensitivity gate -------------------------------------------------------

describe('WI-09 — sensitivity gate', () => {
  it('never compacts a secret-tier run (secret history is not shipped to the summarizer)', async () => {
    const { memory, shouldCompactCalls, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 6,
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(3) });
    const agent = createAgent({
      name: 'secret',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [noopTool],
      sensitivity: 'secret',
    });

    const types: string[] = [];
    for await (const ev of agent.stream('go')) types.push(ev.type);

    expect(types).not.toContain('context.compacted');
    // The gate short-circuits before the engine is touched at all.
    expect(shouldCompactCalls()).toBe(0);
    expect(compactNowCalls()).toBe(0);
    expect(types).toContain('text.complete'); // run still completes
  });
});

// --- re-injected Context Essentials -----------------------------------------

describe('WI-09 — post-compaction Context Essentials', () => {
  it('re-injects post-compaction hook text content as a trailing system message', async () => {
    const { memory } = makeFakeMemory({
      triggerAtMessages: 6,
      preserveRecent: 2,
      extraContent: [{ type: 'text', text: 'CONTEXT_ESSENTIALS' }],
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(3) });

    let sawEssentials = false;
    const agent = createAgent({
      name: 'essentials',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [noopTool],
      prepareStep: (ctx) => {
        for (const m of ctx.messages) {
          if (m.role === 'system' && m.content === 'CONTEXT_ESSENTIALS') sawEssentials = true;
        }
        return {};
      },
    });

    for await (const _ of agent.stream('go')) {
      // drain
    }

    expect(sawEssentials).toBe(true);
  });
});
