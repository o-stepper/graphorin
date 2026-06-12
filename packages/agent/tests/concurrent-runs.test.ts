import type { AgentEvent, Message, Provider, ProviderRequest } from '@graphorin/core';
import type { Memory } from '@graphorin/memory';
import { describe, expect, it } from 'vitest';
import { AgentRuntimeError, createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

/** A manual gate: `stream()` blocks until the test calls `release()`. */
function gatedProvider(base: Provider): {
  readonly provider: Provider;
  readonly release: () => void;
} {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const provider: Provider = {
    ...base,
    stream(req: ProviderRequest) {
      const inner = base.stream(req);
      return (async function* () {
        await gate;
        yield* inner;
      })();
    },
  } as Provider;
  return { provider, release };
}

/** Wrap a provider to record every request's message list. */
function recordingProvider(base: Provider): {
  readonly provider: Provider;
  readonly requests: ReadonlyArray<Message>[];
} {
  const requests: ReadonlyArray<Message>[] = [];
  const provider: Provider = {
    ...base,
    stream(req: ProviderRequest) {
      requests.push(req.messages.map((m) => ({ ...m })));
      return base.stream(req);
    },
  } as Provider;
  return { provider, requests };
}

describe('AG-11 — one in-flight run per Agent instance', () => {
  it('rejects a second concurrent run with a typed concurrent-run error; the first run is unaffected', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('first done'), textOnlyScript('never')],
    });
    const { provider, release } = gatedProvider(base);
    const agent = createAgent({ name: 'one-at-a-time', instructions: 'I', provider });

    const first = agent.run('go');
    // Let the first run enter the provider call.
    await new Promise((resolve) => setTimeout(resolve, 10));

    await expect(agent.run('overlap')).rejects.toMatchObject({
      name: expect.any(String),
      code: 'concurrent-run',
    });
    await expect(agent.run('overlap-2')).rejects.toBeInstanceOf(AgentRuntimeError);

    release();
    const result = await first;
    expect(result.status).toBe('completed');
    expect(String(result.output)).toBe('first done');
  });

  it('does not leak a late steer() into the next run', async () => {
    const base = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('one'), textOnlyScript('two')],
    });
    const { provider, requests } = recordingProvider(base);
    const agent = createAgent({ name: 'no-steer-leak', instructions: 'I', provider });

    const first = await agent.run('run-1');
    expect(first.status).toBe('completed');

    // The run is over — this steer has no run to attach to and must NOT
    // surface in a later, unrelated run.
    agent.steer('LEAKED STEER');

    await agent.run('run-2');
    const lastRequest = requests.at(-1);
    expect(lastRequest).toBeDefined();
    expect(
      (lastRequest ?? []).some(
        (m) => typeof m.content === 'string' && m.content.includes('LEAKED STEER'),
      ),
    ).toBe(false);
  });

  it('clears the active-run reference on the FAILURE path too', async () => {
    const failing: Provider = {
      modelId: 'mock-fail',
      stream() {
        return (async function* (): AsyncGenerator<never, void, void> {
          throw new Error('provider exploded');
        })();
      },
    } as unknown as Provider;
    const fakeEngine = {
      async shouldCompact() {
        return false;
      },
      async compactNow() {
        throw new Error('must not be called');
      },
    };
    const agent = createAgent({
      name: 'fail-cleanup',
      instructions: 'I',
      provider: failing,
      memory: { contextEngine: fakeEngine } as unknown as Memory,
    });

    const result = await agent.run('boom');
    expect(result.status).toBe('failed');

    // Stale activeRunState would enqueue this request forever (no loop
    // left to service it). The fixed path resolves an explicit no-op.
    const raced = await Promise.race([
      agent.compact(),
      new Promise<'HUNG'>((resolve) => setTimeout(() => resolve('HUNG'), 1500)),
    ]);
    expect(raced).not.toBe('HUNG');
    if (raced === 'HUNG') throw new Error('unreachable');
    expect(raced.applied).toBe(false);
    expect(raced.skippedReason).toBe('no-active-run');
  });

  it('an abandoned stream releases the instance for the next run', async () => {
    const provider = createMockProvider({
      modelId: 'mock',
      scripts: [textOnlyScript('abandoned'), textOnlyScript('second ok')],
    });
    const agent = createAgent({ name: 'abandon', instructions: 'I', provider });

    // Abandon AFTER the provider call so script 1 is consumed, but
    // before the run finishes (no step.end / agent.end observed).
    const events: AgentEvent[] = [];
    for await (const ev of agent.stream('first')) {
      events.push(ev);
      if (ev.type === 'text.complete') break;
    }
    expect(events.some((ev) => ev.type === 'agent.end')).toBe(false);

    const second = await agent.run('second');
    expect(second.status).toBe('completed');
    expect(String(second.output)).toBe('second ok');
  });
});
