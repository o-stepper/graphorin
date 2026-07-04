import type { AgentEvent, Message, Tool } from '@graphorin/core';
import { isStepCount } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { describe, expect, it } from 'vitest';
import { createAgent, runStateFromJSON } from '../src/index.js';
import {
  createMockProvider,
  errorScript,
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
  /** Override the engine-reported `result.hooksFiredCount` (CE-3/AG-13). */
  readonly hooksFiredCount?: number;
}

interface FakeMemoryHandle {
  readonly memory: Memory;
  readonly shouldCompactCalls: () => number;
  readonly compactNowCalls: () => number;
  /** The most recent `compactNow` input (source, preserveRecentTurns, ...). */
  readonly lastCompactNowInput: () => Record<string, unknown> | undefined;
  /** The most recent `shouldCompact` options (compactableFromIndex, ...). */
  readonly lastShouldCompactOptions: () => Record<string, unknown> | undefined;
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
  let lastCompactNowInput: Record<string, unknown> | undefined;
  let lastShouldCompactOptions: Record<string, unknown> | undefined;
  const engine = {
    async shouldCompact(
      messages: ReadonlyArray<Message>,
      options?: Record<string, unknown>,
    ): Promise<boolean> {
      shouldCompactCalls += 1;
      lastShouldCompactOptions = options;
      return messages.length >= opts.triggerAtMessages;
    },
    async compactNow(input: {
      readonly messages: ReadonlyArray<Message>;
      readonly source: 'auto-trigger' | 'manual' | 'pre-step';
      readonly preserveRecentTurns?: number;
    }) {
      compactNowCalls += 1;
      lastCompactNowInput = input as unknown as Record<string, unknown>;
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
          hooksFiredCount: opts.hooksFiredCount ?? (extraContent.length > 0 ? 1 : 0),
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
    lastCompactNowInput: () => lastCompactNowInput,
    lastShouldCompactOptions: () => lastShouldCompactOptions,
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
      'agent.end',
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

// --- manual agent.compact() through the loop (CE-3/AG-13) ---------------------

describe('CE-3/AG-13 — manual agent.compact() splices through the loop', () => {
  /**
   * A `noop`-named tool whose Nth execution invokes `onKick` — lets a test
   * fire `agent.compact()` from inside a live run without awaiting it
   * (awaiting inside the tool would deadlock: the loop services the
   * request at the next step boundary).
   */
  function kickTool(kickAtCall: number, onKick: () => void): Tool<unknown, unknown, unknown> {
    let calls = 0;
    return {
      name: 'noop',
      description: 'noop tool',
      inputSchema: passthroughSchema,
      sideEffectClass: 'pure',
      execute: async () => {
        calls += 1;
        if (calls === kickAtCall) onKick();
        return 'ok';
      },
    } as Tool<unknown, unknown, unknown>;
  }

  it('splices summary + trimmed tail into the live buffer and emits context.compacted(manual)', async () => {
    const { memory, compactNowCalls, lastCompactNowInput } = makeFakeMemory({
      triggerAtMessages: 999, // auto-trigger never fires
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(2) });
    const stepSnapshots: Array<ReadonlyArray<Message>> = [];
    let compactPromise: Promise<unknown> | undefined;
    const agent = createAgent({
      name: 'manual-compactor',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [
        kickTool(2, () => {
          compactPromise = agent.compact();
        }),
      ],
      prepareStep: (ctx) => {
        stepSnapshots.push(ctx.messages.map((m) => ({ ...m })));
        return {};
      },
    });

    const compacted: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'context.compacted') compacted.push(ev);
    }

    expect(compactNowCalls()).toBe(1);
    expect(lastCompactNowInput()?.source).toBe('manual');
    expect(compacted).toHaveLength(1);
    const ev = compacted[0];
    if (ev?.type !== 'context.compacted') throw new Error('expected context.compacted');
    expect(ev.source).toBe('manual');

    // The step AFTER the kick sees summary + trimmed tail, not full history.
    const last = stepSnapshots.at(-1);
    if (last === undefined) throw new Error('expected step snapshots');
    expect(last).toHaveLength(4); // [system, SUMMARY, recent asst, recent tool]
    expect(last[1]?.content).toBe('SUMMARY[3]');
    expect(last.some((m) => m.role === 'user')).toBe(false); // 'go' was summarized away

    const result = (await compactPromise) as Record<string, unknown>;
    expect(result.applied).toBe(true);
    expect(result.summary).toBe('SUMMARY[3]');
    expect(result.beforeTokens as number).toBeGreaterThan(result.afterTokens as number);
  });

  it('forwards CompactOptions.preserveRecentTurns to the engine', async () => {
    const { memory, lastCompactNowInput } = makeFakeMemory({
      triggerAtMessages: 999,
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(2) });
    let compactPromise: Promise<unknown> | undefined;
    const agent = createAgent({
      name: 'forwarding',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [
        kickTool(2, () => {
          compactPromise = agent.compact({ preserveRecentTurns: 4 });
        }),
      ],
    });
    for await (const _ of agent.stream('go')) {
      // drain
    }
    await compactPromise;
    expect(lastCompactNowInput()?.preserveRecentTurns).toBe(4);
  });

  it('reports hooksFiredCount from the engine result, not extraContent length', async () => {
    const { memory } = makeFakeMemory({
      triggerAtMessages: 999,
      preserveRecent: 2,
      extraContent: [{ type: 'text', text: 'REINJECTED ESSENTIALS' }],
      hooksFiredCount: 3, // engine fired 3 hooks; only 1 produced content
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(2) });
    let compactPromise: Promise<unknown> | undefined;
    const agent = createAgent({
      name: 'hook-count',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [
        kickTool(2, () => {
          compactPromise = agent.compact();
        }),
      ],
    });
    const compacted: AgentEvent[] = [];
    for await (const ev of agent.stream('go')) {
      if (ev.type === 'context.compacted') compacted.push(ev);
    }
    const result = (await compactPromise) as Record<string, unknown>;
    expect(result.hooksFiredCount).toBe(3);
    const ev = compacted[0];
    if (ev?.type !== 'context.compacted') throw new Error('expected context.compacted');
    expect(ev.hooksFiredCount).toBe(3);
  });

  it('resolves an explicit no-op for idle calls (no active run)', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 999,
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi')] });
    const agent = createAgent({ name: 'idle', instructions: 'I', provider, memory });
    const result = (await agent.compact()) as unknown as Record<string, unknown>;
    expect(result.applied).toBe(false);
    expect(result.skippedReason).toBe('no-active-run');
    expect(compactNowCalls()).toBe(0);
  });

  it('resolves an explicit no-op when no memory is wired', async () => {
    const provider = createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('hi')] });
    const agent = createAgent({ name: 'memless', instructions: 'I', provider });
    const result = (await agent.compact()) as unknown as Record<string, unknown>;
    expect(result.applied).toBe(false);
    expect(result.skippedReason).toBe('no-memory');
  });

  it('resolves applied:false nothing-to-trim and emits no event when body fits preserveRecent', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 999,
      preserveRecent: 99, // nothing is ever old enough to trim
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(2) });
    let compactPromise: Promise<unknown> | undefined;
    const agent = createAgent({
      name: 'nothing-to-trim',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      tools: [
        kickTool(2, () => {
          compactPromise = agent.compact();
        }),
      ],
    });
    const types: string[] = [];
    for await (const ev of agent.stream('go')) types.push(ev.type);
    const result = (await compactPromise) as Record<string, unknown>;
    expect(compactNowCalls()).toBe(1); // the summarizer ran...
    expect(result.applied).toBe(false); // ...but nothing was spliced
    expect(result.skippedReason).toBe('nothing-to-trim');
    expect(types).not.toContain('context.compacted');
  });

  it('secret-sensitivity runs never ship history to the summarizer on manual compact', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 999,
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: toolStepsThenText(1) });
    let compactPromise: Promise<unknown> | undefined;
    const agent = createAgent({
      name: 'secret-run',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      sensitivity: 'secret',
      tools: [
        kickTool(1, () => {
          compactPromise = agent.compact();
        }),
      ],
    });
    for await (const _ of agent.stream('go')) {
      // drain
    }
    const result = (await compactPromise) as Record<string, unknown>;
    expect(result.applied).toBe(false);
    expect(result.skippedReason).toBe('sensitivity-gated');
    expect(compactNowCalls()).toBe(0);
  });

  it('settles pending requests as no-ops when the run ends before the next step', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 999,
      preserveRecent: 2,
    });
    const provider = createMockProvider({ modelId: 'mock', scripts: [noopStep('tc-0')] });
    let compactPromise: Promise<unknown> | undefined;
    const agent = createAgent({
      name: 'leftover',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
      stopWhen: isStepCount(1), // the loop never reaches another step top
      tools: [
        kickTool(1, () => {
          compactPromise = agent.compact();
        }),
      ],
    });
    for await (const _ of agent.stream('go')) {
      // drain
    }
    const result = (await compactPromise) as Record<string, unknown>;
    expect(result.applied).toBe(false);
    expect(result.skippedReason).toBe('no-active-run');
    expect(compactNowCalls()).toBe(0);
  });
});

// --- TL-10 — spill artifacts cleared on terminal runs --------------------------

describe('TL-10 — run-scoped spill artifacts are cleared when the run ends', () => {
  it('a completed run removes its spill directory; awaiting_approval keeps it', async () => {
    const { promises: fsp } = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const spillRoot = path.join(os.tmpdir(), 'graphorin-spill');
    const bigTool: Tool<unknown, unknown, unknown> = {
      name: 'big',
      description: 'big output',
      inputSchema: passthroughSchema,
      sideEffectClass: 'pure',
      maxResultTokens: 50,
      truncationStrategy: 'spill-to-file',
      execute: async () => `head\n${'filler '.repeat(800)}`,
    } as Tool<unknown, unknown, unknown>;

    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-1', toolName: 'big', args: {} }),
        textOnlyScript('done', 4),
      ],
    });
    const agent = createAgent({ name: 'spiller', instructions: 'I', provider, tools: [bigTool] });
    const result = await agent.run('go');
    expect(result.status).toBe('completed');
    const runDir = path.join(spillRoot, result.state.id);
    await expect(fsp.stat(runDir)).rejects.toThrow(); // cleared

    // Suspended (awaiting_approval) runs keep their artifacts.
    const approvalTool: Tool<unknown, unknown, unknown> = {
      ...bigTool,
      name: 'big-gated',
      needsApproval: true,
    } as Tool<unknown, unknown, unknown>;
    const provider2 = createMockProvider({
      modelId: 'mock',
      scripts: [
        toolCallScript({ toolCallId: 'tc-a', toolName: 'big', args: {} }),
        toolCallScript({ toolCallId: 'tc-b', toolName: 'big-gated', args: {} }),
      ],
    });
    const agent2 = createAgent({
      name: 'suspender',
      instructions: 'I',
      provider: provider2,
      tools: [bigTool, approvalTool],
    });
    const result2 = await agent2.run('go');
    expect(result2.status).toBe('awaiting_approval');
    const runDir2 = path.join(spillRoot, result2.state.id);
    await expect(fsp.stat(runDir2)).resolves.toBeDefined(); // kept for resume
    await fsp.rm(runDir2, { recursive: true, force: true }).catch(() => {});
  });
});

describe('context-engine-05 — a resumed compaction summary stays outside the pinned prefix', () => {
  it('the prefix scan stops at the summary marker on resume', async () => {
    const { memory, lastShouldCompactOptions } = makeFakeMemory({
      triggerAtMessages: 999,
      preserveRecent: 1,
    });
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('done')],
    });
    const agent = createAgent({
      name: 'prefix-resume',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
    });
    // A run that compacted, then suspended: on disk the buffer is
    // [system prompt, system SUMMARY, ...]. Pre-fix the prefix scan
    // counted the summary INTO the pinned prefix (compactableFromIndex
    // 2), shielding it from every future compaction — each
    // compact-then-resume cycle grew the uncompactable prefix by one
    // summary, exactly the unbounded stacking the engine guards against.
    const resumed = runStateFromJSON(
      JSON.stringify({
        version: 'graphorin-run-state/1.1',
        id: 'run-prefix',
        agentId: agent.id,
        currentAgentId: agent.id,
        sessionId: 's',
        status: 'running',
        steps: [],
        messages: [
          { role: 'system', content: 'INSTRUCTIONS' },
          {
            role: 'system',
            content:
              '<graphorin_compaction_summary>\nprior summary\n</graphorin_compaction_summary>',
          },
          { role: 'user', content: 'continue' },
        ],
        pendingApprovals: [],
        handoffs: [],
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        startedAt: new Date().toISOString(),
      }),
    );
    for await (const _ of agent.stream(resumed)) {
      // drain
    }
    expect(lastShouldCompactOptions()?.compactableFromIndex).toBe(1);
  });
});

describe('context-engine-06 — emergency compaction at hard context overflow', () => {
  it('a context-length provider error triggers ONE forced compaction and a retry that succeeds', async () => {
    const { memory, compactNowCalls, lastCompactNowInput } = makeFakeMemory({
      // The auto trigger never fires — only the emergency path compacts.
      triggerAtMessages: 999,
      preserveRecent: 0,
    });
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [errorScript({ kind: 'context-length' }), textOnlyScript('recovered')],
    });
    const agent = createAgent({
      name: 'emergency-compact',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
    });
    const events: AgentEvent<string>[] = [];
    for await (const ev of agent.stream('go')) events.push(ev);
    const end = events.find((e) => e.type === 'agent.end');
    if (end?.type !== 'agent.end') throw new Error('expected agent.end');
    // The run RECOVERED instead of dying on the overflow.
    expect(end.result.status).toBe('completed');
    expect(end.result.output).toBe('recovered');
    expect(compactNowCalls()).toBe(1);
    // Aggressive knobs: emergency preserves only the last 2 turns.
    expect(lastCompactNowInput()?.preserveRecentTurns).toBe(2);
    expect(events.some((e) => e.type === 'context.compacted')).toBe(true);
  });

  it('when compaction cannot shrink the buffer the run still fails cleanly (no retry loop)', async () => {
    const { memory, compactNowCalls } = makeFakeMemory({
      triggerAtMessages: 999,
      // preserveRecent so large nothing is ever dropped — compaction is futile.
      preserveRecent: 99,
    });
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [errorScript({ kind: 'context-length' })],
    });
    const agent = createAgent({
      name: 'emergency-futile',
      instructions: 'INSTRUCTIONS',
      provider,
      memory,
    });
    const result = await agent.run('go');
    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('context-length');
    // Exactly one compaction attempt — no infinite retry.
    expect(compactNowCalls()).toBe(1);
  });
});
