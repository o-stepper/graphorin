import { describe, expect, it, vi } from 'vitest';

import { createIsolatedVMSandbox } from '../../src/sandbox/isolated-vm.js';
import { createWorkerThreadsSandbox } from '../../src/sandbox/worker-threads.js';

interface FakeContext {
  global: { setSync: (k: string, v: unknown) => void };
  release: () => void;
}
interface FakeScript {
  run: (
    ctx: FakeContext,
    opts?: { timeout?: number; promise?: boolean; copy?: boolean },
  ) => Promise<unknown>;
  release: () => void;
}
interface FakeIsolate {
  createContext: () => Promise<FakeContext>;
  compileScript: (source: string) => Promise<FakeScript>;
  dispose: () => void;
}

function createFakePeer(behaviour: {
  exec?: (input: unknown) => Promise<unknown>;
  fail?: 'timed out' | 'memory' | 'boom';
}): { Isolate: new (opts?: { memoryLimit?: number }) => FakeIsolate } {
  return {
    Isolate: class implements FakeIsolate {
      private readonly stored: { input?: unknown } = {};
      async createContext(): Promise<FakeContext> {
        const stored = this.stored;
        return {
          global: {
            setSync: (key: string, value: unknown): void => {
              if (key === '__GRAPHORIN_INPUT__') stored.input = JSON.parse(value as string);
            },
          },
          release: (): void => {
            /* noop */
          },
        };
      }
      async compileScript(_source: string): Promise<FakeScript> {
        const stored = this.stored;
        return {
          run: async (): Promise<unknown> => {
            if (behaviour.fail === 'timed out') {
              throw new Error('Script execution timed out');
            }
            if (behaviour.fail === 'memory') {
              throw new Error('Script terminated for memory limit');
            }
            if (behaviour.fail === 'boom') {
              throw new Error('boom');
            }
            return behaviour.exec ? behaviour.exec(stored.input) : stored.input;
          },
          release: (): void => {
            /* noop */
          },
        };
      }
      dispose(): void {
        /* noop */
      }
    },
  };
}

describe('IsolatedVMSandbox', () => {
  it('runs source code via the peer dependency', async () => {
    const peer = createFakePeer({ exec: async (i) => ({ doubled: (i as number) * 2 }) });
    const sandbox = createIsolatedVMSandbox({ peerLoader: async () => peer });
    const result = await sandbox.run<number, { doubled: number }>(
      { kind: 'source', source: 'return __GRAPHORIN_INPUT__ * 2' },
      { input: 21 },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output).toEqual({ doubled: 42 });
  });

  it('falls back to worker-threads + WARN once when the peer is unavailable', async () => {
    const fallback = createWorkerThreadsSandbox();
    const warn = vi.fn();
    const sandbox = createIsolatedVMSandbox({
      peerLoader: async () => {
        throw new Error('isolated-vm not installable on this host');
      },
      fallbackAdapter: fallback,
      fallback: 'fallback-to-worker-threads',
      warn,
    });
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    // Source kind isn't supported by worker-threads, so the fallback
    // returns sandbox-violation; the test is asserting the fallback
    // path engaged, not its output.
    expect(result.ok).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('falling back');

    // Second call must not WARN again.
    await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(warn).toHaveBeenCalledOnce();
  });

  it('throws sandbox-violation when fallback is "throw" and the peer is unavailable', async () => {
    const sandbox = createIsolatedVMSandbox({
      peerLoader: async () => {
        throw new Error('peer missing');
      },
      fallback: 'throw',
    });
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('sandbox-violation');
      expect(result.error.message).toContain('isolated-vm peer dependency is not installed');
    }
  });

  it('refuses non-source code kinds', async () => {
    const peer = createFakePeer({});
    const sandbox = createIsolatedVMSandbox({ peerLoader: async () => peer });
    const result = await sandbox.run(
      { kind: 'handler', module: 'm', export: 'h' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('reports timeout error from the peer', async () => {
    const peer = createFakePeer({ fail: 'timed out' });
    const sandbox = createIsolatedVMSandbox({ peerLoader: async () => peer });
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('timeout');
  });

  it('reports memory-exceeded errors from the peer', async () => {
    const peer = createFakePeer({ fail: 'memory' });
    const sandbox = createIsolatedVMSandbox({ peerLoader: async () => peer });
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('memory-exceeded');
  });

  it('reports execution-failed for unknown errors', async () => {
    const peer = createFakePeer({ fail: 'boom' });
    const sandbox = createIsolatedVMSandbox({ peerLoader: async () => peer });
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('execution-failed');
  });
});
