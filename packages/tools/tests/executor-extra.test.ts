import type { AISpan, RunContext, SpanAttributes } from '@graphorin/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  getCounterForTesting,
  getHistogramForTesting,
  resetCountersForTesting,
} from '../src/audit/index.js';
import { tool } from '../src/builder/index.js';
import { createToolExecutor } from '../src/executor/index.js';
import { createToolRegistry } from '../src/registry/index.js';
import { makeRunContext } from './fixtures.js';

describe('ToolExecutor — secrets ACL enforcement (DoD)', () => {
  beforeEach(() => resetCountersForTesting());

  it('throws SecretAccessDeniedError when ctx.secrets.require() asks for a key outside `secretsAllowed`', async () => {
    const registry = createToolRegistry();
    let captured: { ok: boolean; reason?: string } = { ok: false };
    registry.register(
      tool({
        name: 'leaky',
        description: 'tries to grab a non-allowlisted secret',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        secretsAllowed: ['ALLOWED_KEY'],
        async execute(_input, ctx) {
          try {
            await ctx.secrets.require('FORBIDDEN_KEY');
            captured = { ok: true };
          } catch (err) {
            captured = {
              ok: false,
              reason: err instanceof Error ? err.message : String(err),
            };
          }
          return null;
        },
      }),
    );
    const executor = createToolExecutor({
      registry,
      secretResolver: {
        async resolve() {
          return null;
        },
      },
    });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'leaky', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(captured.ok).toBe(false);
    expect(captured.reason).toMatch(/FORBIDDEN_KEY/i);
  });

  it('succeeds when `ctx.secrets.require()` asks for an allowlisted key', async () => {
    const registry = createToolRegistry();
    let captured: { received: boolean } = { received: false };
    registry.register(
      tool({
        name: 'good',
        description: 'reads an allowlisted secret',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        secretsAllowed: ['ALLOWED_KEY'],
        async execute(_input, ctx) {
          const value = await ctx.secrets.require('ALLOWED_KEY');
          captured = { received: value !== null };
          return null;
        },
      }),
    );
    let resolverCalls = 0;
    const executor = createToolExecutor({
      registry,
      secretResolver: {
        async resolve(key: string) {
          resolverCalls++;
          if (key === 'ALLOWED_KEY') {
            return {
              brand: Symbol.for('graphorin.SecretValue'),
              ref: { resolver: 'inline', ref: 'inline:test' },
              dispose() {},
              use<R>(fn: (raw: string) => R): R {
                return fn('the-secret');
              },
              reveal() {
                return 'the-secret';
              },
            } as unknown as Awaited<
              ReturnType<NonNullable<typeof executor>['executeBatch']> extends Promise<infer R>
                ? R
                : never
            >;
          }
          return null;
        },
      } as never,
    });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'good', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(resolverCalls).toBe(1);
    expect(captured.received).toBe(true);
  });
});

describe('ToolExecutor — tool repair second-failure path (DoD)', () => {
  it('returns ToolError({ kind: "invalid_input" }) when the repaired payload also fails validation', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'strict',
        description: 'strict',
        inputSchema: z.object({ n: z.number() }),
        sideEffectClass: 'pure',
        async execute({ n }) {
          return n;
        },
      }),
    );
    const executor = createToolExecutor({
      registry,
      repair: {
        async repair() {
          return { n: 'still-not-a-number' };
        },
      },
    });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'strict', args: { n: 'oops' } }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    if ('kind' in completed[0]!.outcome) {
      expect(completed[0]!.outcome.kind).toBe('invalid_input');
    }
  });
});

describe('ToolExecutor — tracer span emission (DoD: GenAI semantic conventions)', () => {
  it('wraps each tool execution in a `tool.execute` AISpan with rich attributes', async () => {
    const captured: { type: string; attrs: Record<string, unknown>; statuses: string[] }[] = [];
    const fakeTracer = makeRecordingTracer(captured);
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'span-emitting',
        description: 'span emitting',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        sensitivity: 'internal',
        memoryGuardTier: 'pure',
        async execute() {
          return { ok: true };
        },
      }),
    );
    const executor = createToolExecutor({ registry });
    const runContext: RunContext = { ...makeRunContext(), tracer: fakeTracer };
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'span-emitting', args: {} }],
      runContext,
      stepNumber: 5,
    });
    const span = captured.find((s) => s.type === 'tool.execute');
    expect(span).toBeDefined();
    expect(span!.attrs['graphorin.tool.name']).toBe('span-emitting');
    expect(span!.attrs['graphorin.tool.call_id']).toBe('c1');
    expect(span!.attrs['graphorin.tool.side_effect_class']).toBe('pure');
    expect(span!.attrs['graphorin.tool.sensitivity']).toBe('internal');
    expect(span!.attrs['graphorin.tool.memory_guard.tier']).toBe('pure');
    expect(span!.attrs['graphorin.tool.sandbox.kind']).toBeDefined();
    expect(typeof span!.attrs['graphorin.tool.duration_ms']).toBe('number');
  });

  it('records the cancellation status on the span when ctx.signal aborts', async () => {
    const captured: { type: string; attrs: Record<string, unknown>; statuses: string[] }[] = [];
    const fakeTracer = makeRecordingTracer(captured);
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'sleeper',
        description: 'sleeps',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        async execute(_input, ctx) {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, 5_000);
            ctx.signal.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(new Error('aborted'));
            });
          });
          return null;
        },
      }),
    );
    const executor = createToolExecutor({ registry, cancellationGraceMs: 50 });
    const ac = new AbortController();
    const runPromise = executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'sleeper', args: {} }],
      runContext: { ...makeRunContext({ signal: ac.signal }), tracer: fakeTracer },
      stepNumber: 1,
    });
    setTimeout(() => ac.abort(), 10);
    await runPromise;
    const span = captured.find((s) => s.type === 'tool.execute');
    expect(span?.statuses).toContain('cancelled');
  });
});

describe('ToolExecutor — content-parts pass-through (DoD: ToolReturn<TOutput>.contentParts)', () => {
  it('preserves non-text content parts bytes-equal and surfaces them on the span', async () => {
    const captured: { type: string; attrs: Record<string, unknown>; statuses: string[] }[] = [];
    const fakeTracer = makeRecordingTracer(captured);
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'multimodal',
        description: 'returns image + text',
        inputSchema: z.object({}),
        sideEffectClass: 'read-only',
        async execute() {
          return {
            output: { caption: 'caption' },
            contentParts: [
              {
                type: 'image' as const,
                image: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
                mimeType: 'image/png',
              },
              { type: 'text' as const, text: 'side note' },
            ],
          };
        },
      }),
    );
    const executor = createToolExecutor({ registry });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'multimodal', args: {} }],
      runContext: { ...makeRunContext(), tracer: fakeTracer },
      stepNumber: 1,
    });
    if ('output' in completed[0]!.outcome) {
      const parts = completed[0]!.outcome.contentParts ?? [];
      const image = parts.find((p) => p.type === 'image');
      expect(image).toBeDefined();
      if (image && image.type === 'image') {
        expect(image.mimeType).toBe('image/png');
      }
    }
    const span = captured.find((s) => s.type === 'tool.execute');
    expect(span?.attrs['graphorin.tool.result.contentpart.kind.image']).toBe(true);
  });
});

describe('ToolExecutor — sandbox dispatch (DoD: SandboxImpl wired)', () => {
  it('delegates to SandboxImpl.run() when a sandbox resolver returns a non-null impl', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'sandboxed',
        description: 'runs in a worker',
        inputSchema: z.object({ x: z.number() }),
        sideEffectClass: 'pure',
        sandboxPolicy: 'sandboxed',
        async execute({ x }) {
          // Inline body (would have run in worker).
          return { x: x + 1 };
        },
      }),
    );
    const sandboxRunCalls: { input: unknown; signal: AbortSignal }[] = [];
    const fakeSandbox: import('@graphorin/core').Sandbox = {
      id: 'fake-sandbox',
      async run<TInput, TOutput>(_code: never, opts: { input: TInput; signal?: AbortSignal }) {
        sandboxRunCalls.push({ input: opts.input, signal: opts.signal! });
        return {
          ok: true as const,
          output: { x: ((opts.input as { x: number }).x ?? 0) + 100 } as unknown as TOutput,
          durationMs: 1,
        };
      },
    };
    const executor = createToolExecutor({
      registry,
      sandboxResolver: () => fakeSandbox,
    });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'sandboxed', args: { x: 5 } }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(sandboxRunCalls).toHaveLength(1);
    if ('output' in completed[0]!.outcome) {
      // Sandbox short-circuited the inline body and returned x + 100, not x + 1.
      expect(completed[0]!.outcome.output).toEqual({ x: 105 });
    }
  });

  it("surfaces a sandbox timeout as ToolError({ kind: 'timeout' }) (tools-06)", async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'sandboxed-fail',
        description: 'sandbox always fails',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        sandboxPolicy: 'sandboxed',
        async execute() {
          return null;
        },
      }),
    );
    const fakeSandbox: import('@graphorin/core').Sandbox = {
      id: 'fake-sandbox',
      async run<TInput, TOutput>(_code: never, _opts: never) {
        return {
          ok: false as const,
          error: { kind: 'timeout' as const, message: 'over budget' },
          durationMs: 1,
        } as unknown as Awaited<ReturnType<typeof fakeSandbox.run<TInput, TOutput>>>;
      },
    };
    const executor = createToolExecutor({
      registry,
      sandboxResolver: () => fakeSandbox,
    });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'sandboxed-fail', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    if ('kind' in completed[0]!.outcome) {
      expect(completed[0]!.outcome.kind).toBe('timeout');
      expect(completed[0]!.outcome.message).toMatch(/timeout/);
    }
  });
});

describe('ToolExecutor — memory-modification guard (DoD)', () => {
  it('invokes guard.snapshot before and guard.verify after execution', async () => {
    const calls: string[] = [];
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'memwriter',
        description: 'writes to memory',
        inputSchema: z.object({}),
        sideEffectClass: 'side-effecting',
        idempotencyKey: () => 'memwriter:1',
        memoryGuardTier: 'memory-aware',
        async execute() {
          calls.push('execute');
          return null;
        },
      }),
    );
    const executor = createToolExecutor({
      registry,
      memoryGuardFactory: () => ({
        tier: 'memory-aware',
        async snapshot() {
          calls.push('snapshot');
          return { digest: [], durationUs: 1 };
        },
        async verify() {
          calls.push('verify');
          return {
            ok: true,
            tier: 'memory-aware',
            snapshot: { digest: [], durationUs: 1 },
            verifyDurationUs: 1,
          };
        },
      }),
      memoryRegionReader: {
        regions: ['working'],
        async read() {
          return '';
        },
      },
    });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'memwriter', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(calls).toEqual(['snapshot', 'execute', 'verify']);
  });

  it('emits an error audit row when guard.verify reports a mismatch', async () => {
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'leaky-mem',
        description: 'mutates state out-of-band',
        inputSchema: z.object({}),
        sideEffectClass: 'side-effecting',
        idempotencyKey: () => 'leaky-mem:1',
        memoryGuardTier: 'memory-aware',
        async execute() {
          return null;
        },
      }),
    );
    const executor = createToolExecutor({
      registry,
      memoryGuardFactory: () => ({
        tier: 'memory-aware',
        async snapshot() {
          return { digest: [{ region: 'working', hash: 'abc' }], durationUs: 1 };
        },
        async verify() {
          return {
            ok: false,
            tier: 'memory-aware',
            mismatched: ['working'],
            snapshot: { digest: [{ region: 'working', hash: 'def' }], durationUs: 1 },
            verifyDurationUs: 1,
          };
        },
      }),
      memoryRegionReader: {
        regions: ['working'],
        async read() {
          return '';
        },
      },
    });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'leaky-mem', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    expect(
      getCounterForTesting('tool.executor.memory_guard.mismatch.total', {
        toolName: 'leaky-mem',
        tier: 'memory-aware',
      }),
    ).toBe(1);
  });
});

describe('ToolExecutor — default spill writer (DoD)', () => {
  it('writes the un-truncated body to a per-run / per-call file under os.tmpdir() with mode 0o600', async () => {
    const fs = await import('node:fs/promises');
    const registry = createToolRegistry();
    const runId = `spill-test-${Date.now()}`;
    registry.register(
      tool({
        name: 'big-spill',
        description: 'spills to disk',
        inputSchema: z.object({}),
        sideEffectClass: 'read-only',
        maxResultTokens: 50,
        truncationStrategy: 'spill-to-file',
        async execute() {
          return 'A'.repeat(2000);
        },
      }),
    );
    const executor = createToolExecutor({ registry });
    const completed = await executor.executeBatch({
      calls: [{ toolCallId: 'spill-call', toolName: 'big-spill', args: {} }],
      runContext: makeRunContext({ runId }),
      stepNumber: 1,
    });
    const outcome = completed[0]!.outcome;
    if ('output' in outcome) {
      // WI-10: the spill surfaces a structured, opaque handle on the result.
      expect(outcome.resultHandle).toBeDefined();
      expect(outcome.resultHandle?.kind).toBe('spill-file');
      expect(outcome.resultHandle?.uri).toMatch(/^graphorin-spill:/);
      // Reconstruct the on-disk path from the opaque handle to verify the
      // un-truncated body was written under os.tmpdir() with mode 0o600.
      const os = await import('node:os');
      const path = await import('node:path');
      const rel = outcome.resultHandle!.uri.slice('graphorin-spill:'.length);
      const abs = path.join(os.tmpdir(), 'graphorin-spill', ...rel.split('/'));
      const stat = await fs.stat(abs);
      expect(stat.isFile()).toBe(true);
      // POSIX-only confidentiality check: Windows does not honour
      // mode bits (Node returns ~0o666 by default), so the
      // group/world-readable assertion is meaningless there. On
      // win32 the on-disk confidentiality guarantee comes from
      // NTFS ACLs + the os.tmpdir() location, not POSIX bits.
      if (process.platform !== 'win32') {
        expect(stat.mode & 0o777 & 0o077).toBe(0); // group + others have no permission
      }
      await fs.unlink(abs).catch(() => {});
    }
  });
});

describe('ToolExecutor — first-chunk duration histogram (DoD)', () => {
  it('records tool.streaming.first-chunk.duration_ms on first chunk emit', async () => {
    resetCountersForTesting();
    const registry = createToolRegistry();
    registry.register(
      tool({
        name: 'chunky',
        description: 'streams chunks',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        streamingHint: true,
        async execute(_input, ctx) {
          await new Promise((r) => setTimeout(r, 5));
          ctx.streamContent({ kind: 'text', text: 'a' });
        },
      }),
    );
    const executor = createToolExecutor({ registry });
    await executor.executeBatch({
      calls: [{ toolCallId: 'c1', toolName: 'chunky', args: {} }],
      runContext: makeRunContext(),
      stepNumber: 1,
    });
    const h = getHistogramForTesting('tool.streaming.first-chunk.duration_ms', {
      toolName: 'chunky',
    });
    expect(h.length).toBe(1);
    expect(h[0]!).toBeGreaterThan(0);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRecordingTracer(
  captured: { type: string; attrs: Record<string, unknown>; statuses: string[] }[],
): RunContext['tracer'] {
  return {
    startSpan(opts) {
      const record = {
        type: opts.type as string,
        attrs: { ...(opts.attrs ?? {}) } as Record<string, unknown>,
        statuses: [] as string[],
      };
      captured.push(record);
      const span: AISpan = {
        type: opts.type,
        id: 'span-id',
        traceId: 'trace-id',
        setAttributes(attrs: SpanAttributes) {
          for (const [k, v] of Object.entries(attrs)) {
            record.attrs[k] = v;
          }
        },
        addEvent() {},
        recordException() {},
        setStatus(status) {
          record.statuses.push(status);
        },
        end() {},
      };
      // The recorder is type-erased; the per-call generic narrowing is irrelevant here.
      return span as never;
    },
    async span(opts, fn) {
      const span = this.startSpan(opts);
      try {
        const out = await fn(span);
        span.setStatus('ok');
        return out;
      } catch (err) {
        span.setStatus('error');
        throw err;
      } finally {
        span.end();
      }
    },
    async shutdown() {},
  };
}
