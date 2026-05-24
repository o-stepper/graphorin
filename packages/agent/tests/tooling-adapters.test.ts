import type { Memory } from '@graphorin/memory';
import type { ResolvedSandboxPolicy, SandboxImpl } from '@graphorin/security/sandbox';
import { SecretValue } from '@graphorin/security/secrets';
import { countTokensHeuristic } from '@graphorin/tools/result';
import { describe, expect, it, vi } from 'vitest';

import {
  buildMemoryGuard,
  buildSandboxResolver,
  buildSecretResolver,
  buildToolTokenCounter,
  createExecutorEventBridge,
  createMemoryRegionReader,
} from '../src/tooling/adapters.js';

// --- shared fakes -----------------------------------------------------------

function policy(kind: string): ResolvedSandboxPolicy {
  return {
    kind,
    noNetwork: true,
    noFilesystem: true,
    timeoutMs: 5_000,
    maxMemoryMb: 128,
    forced: false,
    reason: 'test',
  };
}

function fakeSandbox(id: string): SandboxImpl {
  return {
    id,
    kind: id,
    capabilities: {
      canBlockNetwork: true,
      canBlockFilesystem: true,
      canEnforceTimeout: true,
      canEnforceMemoryLimit: true,
    },
    run: async () => ({ ok: true as const, output: undefined, durationMs: 0 }),
  };
}

/** A scope-free `Memory` stand-in — the adapters only check presence. */
const fakeMemory = {} as unknown as Memory;

/** Yield a macrotask so a parked `drain()` consumer can resume + re-park. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

// --- Adapter A --------------------------------------------------------------

describe('Adapter A — buildSecretResolver', () => {
  it('resolves a key via an injected backend', async () => {
    const value = SecretValue.fromString('hunter2');
    const backend = vi.fn(async (key: string) => (key === 'env://OK' ? value : null));
    const resolver = buildSecretResolver({ backend });

    await expect(resolver.resolve('env://OK')).resolves.toBe(value);
    expect(backend).toHaveBeenCalledWith('env://OK');
  });

  it('returns null when the backend has no value for the key', async () => {
    const resolver = buildSecretResolver({ backend: async () => null });
    await expect(resolver.resolve('env://MISSING')).resolves.toBeNull();
  });

  it('does not enforce ACL itself — it forwards every key to the backend', async () => {
    // ACL lives in the executor's accessor (`enforceSecretAcl`), not here.
    const backend = vi.fn(async () => null);
    const resolver = buildSecretResolver({ backend });
    await resolver.resolve('env://ANY_KEY_AT_ALL');
    expect(backend).toHaveBeenCalledWith('env://ANY_KEY_AT_ALL');
  });

  it('default backend rejects (never sync-throws) for a malformed ref', async () => {
    const resolver = buildSecretResolver();
    await expect(resolver.resolve('plain-string-no-scheme')).rejects.toThrow();
  });
});

// --- Adapter B --------------------------------------------------------------

describe('Adapter B — buildSandboxResolver', () => {
  it('returns null for the "none" kind and any unrecognised kind', () => {
    const resolve = buildSandboxResolver();
    expect(resolve(policy('none'))).toBeNull();
    expect(resolve(policy('firecracker'))).toBeNull();
  });

  it('maps each isolation kind to its factory', () => {
    const wt = fakeSandbox('wt');
    const iv = fakeSandbox('iv');
    const dk = fakeSandbox('dk');
    const resolve = buildSandboxResolver({
      factories: {
        'worker-threads': () => wt,
        'isolated-vm': () => iv,
        docker: () => dk,
      },
    });
    expect(resolve(policy('worker-threads'))).toBe(wt);
    expect(resolve(policy('isolated-vm'))).toBe(iv);
    expect(resolve(policy('docker'))).toBe(dk);
  });

  it('caches one instance per kind (lazy, single construction)', () => {
    const factory = vi.fn(() => fakeSandbox('wt'));
    const resolve = buildSandboxResolver({ factories: { 'worker-threads': factory } });

    const first = resolve(policy('worker-threads'));
    const second = resolve(policy('worker-threads'));

    expect(first).toBe(second);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('does not construct any real sandbox at build time', () => {
    // Constructing the default resolver + resolving "none" must not spawn
    // worker threads / containers (offline; R4).
    const resolve = buildSandboxResolver();
    expect(resolve(policy('none'))).toBeNull();
  });
});

// --- Adapter C --------------------------------------------------------------

const ALL_TIERS = [
  'pure',
  'side-effecting-no-memory',
  'memory-aware',
  'unknown',
  'untrusted',
] as const;

describe('Adapter C — buildMemoryGuard', () => {
  it('returns a null factory and no reader when memory is undefined', () => {
    const wiring = buildMemoryGuard(undefined);
    expect(wiring.memoryRegionReader).toBeUndefined();
    for (const tier of ALL_TIERS) {
      expect(wiring.memoryGuardFactory(tier)).toBeNull();
    }
  });

  it('builds a guard for each tier when memory is configured', () => {
    const wiring = buildMemoryGuard(fakeMemory, {
      apiBoundary: { allowedOps: ['session.set'], observedOps: () => [] },
    });

    const pure = wiring.memoryGuardFactory('pure');
    expect(pure).not.toBeNull();
    expect(typeof pure?.snapshot).toBe('function');
    expect(typeof pure?.verify).toBe('function');

    expect(wiring.memoryGuardFactory('side-effecting-no-memory')).not.toBeNull();
    expect(wiring.memoryGuardFactory('unknown')?.tier).toBe('unknown');
    expect(wiring.memoryGuardFactory('untrusted')?.tier).toBe('untrusted');
    expect(wiring.memoryGuardFactory('memory-aware')?.tier).toBe('memory-aware');
  });

  it('returns null for the memory-aware tier when no apiBoundary options are supplied', () => {
    const wiring = buildMemoryGuard(fakeMemory);
    expect(wiring.memoryGuardFactory('memory-aware')).toBeNull();
    // Other tiers still build — only memory-aware needs the recorder.
    expect(wiring.memoryGuardFactory('unknown')).not.toBeNull();
  });

  it('passes through an injected region reader', () => {
    const reader = createMemoryRegionReader(['session'], async () => 'x');
    const wiring = buildMemoryGuard(fakeMemory, { regionReader: reader });
    expect(wiring.memoryRegionReader).toBe(reader);
  });
});

describe('createMemoryRegionReader', () => {
  it('builds a frozen reader from a region list + read fn', async () => {
    const read = vi.fn(async (region: string) => `bytes:${region}`);
    const reader = createMemoryRegionReader(['a', 'b'], read);

    expect(reader.regions).toEqual(['a', 'b']);
    expect(Object.isFrozen(reader)).toBe(true);
    expect(Object.isFrozen(reader.regions)).toBe(true);
    await expect(reader.read('a')).resolves.toBe('bytes:a');
  });

  it('copies the region list so later mutation of the source does not leak in', () => {
    const source = ['x'];
    const reader = createMemoryRegionReader(source, async () => '');
    source.push('y');
    expect(reader.regions).toEqual(['x']);
  });
});

// --- Adapter D --------------------------------------------------------------

describe('Adapter D — buildToolTokenCounter', () => {
  it('defaults to the @graphorin/tools heuristic (4 chars/token)', () => {
    const counter = buildToolTokenCounter();
    expect(counter).toBe(countTokensHeuristic);
    expect(counter.count('aaaa')).toBe(1);
    expect(counter.count('a'.repeat(8))).toBe(2);
    expect(counter.count('')).toBe(0);
  });

  it('uses an injected synchronous tokenizer deterministically', () => {
    const tokenize = vi.fn((text: string) => text.split(/\s+/).filter(Boolean));
    const counter = buildToolTokenCounter({ tokenize });

    expect(counter.count('a b c')).toBe(3);
    expect(counter.count('a b c')).toBe(3); // determinism
    expect(tokenize).toHaveBeenCalled();
  });
});

// --- Adapter E --------------------------------------------------------------

describe('Adapter E — createExecutorEventBridge', () => {
  it('drains buffered events in arrival order after close', async () => {
    const bridge = createExecutorEventBridge<number>();
    bridge.sink(1);
    bridge.sink(2);
    bridge.sink(3);
    bridge.close();

    const out: number[] = [];
    for await (const event of bridge.drain()) {
      out.push(event);
    }
    expect(out).toEqual([1, 2, 3]);
    expect(bridge.dropped).toBe(0);
  });

  it('hands events off directly to a parked consumer', async () => {
    const bridge = createExecutorEventBridge<number>();
    const out: number[] = [];
    const consumer = (async () => {
      for await (const event of bridge.drain()) {
        out.push(event);
      }
    })();

    await tick(); // let the consumer park
    bridge.sink(10);
    await tick();
    bridge.sink(20);
    await tick();
    bridge.close();
    await consumer;

    expect(out).toEqual([10, 20]);
  });

  it('drops the oldest events under backpressure and reports the count', async () => {
    const bridge = createExecutorEventBridge<number>({ queueDepth: 2 });
    bridge.sink(1);
    bridge.sink(2);
    bridge.sink(3);
    bridge.sink(4);
    expect(bridge.dropped).toBe(2);

    bridge.close();
    const out: number[] = [];
    for await (const event of bridge.drain()) {
      out.push(event);
    }
    expect(out).toEqual([3, 4]); // most-recent window preserved
  });

  it('ends the drain iterator when closed while the consumer is parked', async () => {
    const bridge = createExecutorEventBridge<number>();
    const out: number[] = [];
    const consumer = (async () => {
      for await (const event of bridge.drain()) {
        out.push(event);
      }
    })();

    await tick(); // park
    bridge.close();
    await consumer;

    expect(out).toEqual([]);
  });

  it('drops events emitted after close', async () => {
    const bridge = createExecutorEventBridge<number>();
    bridge.close();
    bridge.sink(99);
    expect(bridge.dropped).toBe(0);

    const out: number[] = [];
    for await (const event of bridge.drain()) {
      out.push(event);
    }
    expect(out).toEqual([]);
  });
});
