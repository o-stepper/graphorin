import type { Provider, ProviderEvent, ProviderRequest, ProviderResponse } from '@graphorin/core';
import type { TriggerState } from '@graphorin/core/contracts';
import type { Scheduler, SchedulerEvent, TriggerDeclaration } from '@graphorin/triggers';

/** One scripted provider turn. */
export interface MockScript {
  readonly events: ReadonlyArray<ProviderEvent>;
}

/** Text-only reply whose finish usage optionally carries USD cost. */
export function textScript(text: string, totalTokens = 10, costUsd?: number): MockScript {
  return {
    events: [
      { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
      { type: 'text-delta', delta: text },
      {
        type: 'finish',
        finishReason: 'stop',
        usage: {
          promptTokens: Math.max(1, Math.floor(totalTokens / 2)),
          completionTokens: Math.max(1, Math.floor(totalTokens / 2)),
          totalTokens,
          ...(costUsd !== undefined ? { cost: { amount: costUsd, currency: 'USD' } } : {}),
        },
      },
    ],
  };
}

/** In-memory scripted provider (per-call scripts, counts consumption). */
export function createMockProvider(args: {
  readonly modelId: string;
  readonly scripts: ReadonlyArray<MockScript>;
}): Provider & { readonly scriptsConsumed: () => number } {
  let cursor = 0;
  const provider: Provider = {
    name: 'mock',
    modelId: args.modelId,
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
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const idx = cursor++;
      const script = args.scripts[idx];
      if (script === undefined) {
        yield {
          type: 'error',
          error: { kind: 'unknown', message: `mock provider: no script for call #${idx}` },
        };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate(_req: ProviderRequest): Promise<ProviderResponse> {
      throw new Error('mock provider: generate(...) not implemented; use stream(...).');
    },
  };
  return Object.assign(provider, { scriptsConsumed: () => cursor });
}

interface FakeTimer {
  readonly id: number;
  readonly fireAt: number;
  readonly cb: () => void;
}

/** Deterministic clock + timer wheel (the triggers test pattern). */
export class FakeClock {
  #now = 0;
  #pending: FakeTimer[] = [];
  #nextId = 1;

  now = (): number => this.#now;

  setTimeout = (cb: () => void, ms: number): unknown => {
    const id = this.#nextId++;
    this.#pending.push({ id, fireAt: this.#now + ms, cb });
    this.#pending.sort((a, b) => a.fireAt - b.fireAt);
    return id;
  };

  clearTimeout = (handle: unknown): void => {
    const id = handle as number;
    this.#pending = this.#pending.filter((t) => t.id !== id);
  };

  async advance(ms: number): Promise<void> {
    const target = this.#now + ms;
    for (;;) {
      await this.#settle();
      const next = this.#pending[0];
      if (next === undefined || next.fireAt > target) break;
      this.#pending.shift();
      this.#now = next.fireAt;
      next.cb();
    }
    this.#now = target;
    await this.#settle();
  }

  async #settle(): Promise<void> {
    for (let i = 0; i < 25; i++) await Promise.resolve();
  }

  pending(): readonly FakeTimer[] {
    return this.#pending;
  }
}

/**
 * Minimal Scheduler stub: captures registrations, lets the test fire
 * the callback directly. The real scheduler is covered by the
 * integration test.
 */
export function createStubScheduler(): Scheduler & {
  readonly declarations: Map<string, TriggerDeclaration>;
} {
  const declarations = new Map<string, TriggerDeclaration>();
  const stub: Scheduler = {
    async register(declaration: TriggerDeclaration): Promise<TriggerState> {
      declarations.set(declaration.id, declaration);
      return {
        id: declaration.id,
        kind: declaration.kind,
        spec: declaration.spec,
        callbackRef: declaration.id,
        missedFires: 0,
        disabled: false,
        catchupPolicy: 'none',
        maxCatchupRuns: 1,
        catchupWindowMs: 0,
        createdAt: new Date(0).toISOString(),
      };
    },
    async unregister(id: string): Promise<void> {
      declarations.delete(id);
    },
    async list(): Promise<readonly TriggerState[]> {
      return [];
    },
    async start(): Promise<void> {},
    async stop(): Promise<void> {},
    async emit(): Promise<void> {},
    async fire(id: string, payload?: unknown): Promise<void> {
      await declarations.get(id)?.callback(payload);
    },
    async setDisabled(): Promise<TriggerState> {
      throw new Error('stub scheduler: setDisabled not implemented');
    },
    events(): AsyncIterable<SchedulerEvent> {
      return {
        [Symbol.asyncIterator]() {
          return {
            async next(): Promise<IteratorResult<SchedulerEvent>> {
              return { done: true, value: undefined };
            },
          };
        },
      };
    },
    recordActivity(): void {},
    async orphans(): Promise<readonly TriggerState[]> {
      return [];
    },
  };
  return Object.assign(stub, { declarations });
}

/**
 * Poll until `cond()` holds. Fixed microtask hops are NOT enough when a
 * fake-clock timer kicks off a REAL agent run (the wave-B lesson);
 * polling on the real event loop is race-free.
 */
export async function waitFor(cond: () => boolean, timeoutMs = 5_000): Promise<void> {
  const start = Date.now();
  while (!cond()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor: condition not met in time');
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}
