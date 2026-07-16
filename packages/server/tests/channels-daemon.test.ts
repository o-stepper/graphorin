/**
 * B1.6: the channels daemon binds a channel gateway to the server
 * lifecycle through structural typing (no dependency on
 * @graphorin/channels): started last, stopped first, surfaced on
 * /v1/health, and bridged into scheduler.recordActivity on inbound.
 */
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';
import { buildDaemons } from '../src/app-daemons.js';
import {
  type ChannelGatewayLike,
  type ChannelGatewayStatusLike,
  createChannelsDaemon,
} from '../src/channels/daemon.js';
import { collectHealth } from '../src/health/checks.js';
import type { TriggersDaemon } from '../src/triggers/daemon.js';
import type { WorkflowTimerDriverLike } from '../src/workflows/timer-daemon.js';

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;

afterEach(async () => {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  if (store !== undefined) {
    await store.close().catch(() => {});
    store = undefined;
  }
});

async function makeStore(): Promise<GraphorinSqliteStore> {
  return createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
}

interface FakeGateway extends ChannelGatewayLike {
  readonly calls: string[];
  listener: (() => void) | undefined;
  running: boolean;
}

function fakeGateway(sequence?: string[]): FakeGateway {
  const gateway: FakeGateway = {
    calls: [],
    listener: undefined,
    running: false,
    async start() {
      gateway.running = true;
      gateway.calls.push('start');
      sequence?.push('gateway:start');
    },
    async stop() {
      gateway.running = false;
      gateway.calls.push('stop');
      sequence?.push('gateway:stop');
    },
    async status(): Promise<ChannelGatewayStatusLike> {
      return {
        running: gateway.running,
        channels: [
          {
            id: 'loopback',
            queued: 1,
            dropped: 2,
            processed: 5,
            denied: 1,
            failed: 3,
            delivered: 4,
            deliveryFailures: 0,
          },
        ],
      };
    },
    setActivityListener(listener) {
      gateway.listener = listener;
    },
  };
  return gateway;
}

describe('B1.6 - channels daemon lifecycle', () => {
  it('createServer({ channels: { gateway } }) starts and stops the gateway with the server', async () => {
    store = await makeStore();
    const gateway = fakeGateway();
    server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        server: { port: 0 },
      },
      channels: { gateway },
    });
    expect(server.channels).toBeDefined();
    await server.start();
    expect(gateway.calls).toContain('start');
    expect((await server.channels?.status())?.running).toBe(true);
    await server.stop();
    expect(gateway.calls).toContain('stop');
    expect(gateway.running).toBe(false);
  });

  it('the gateway starts AFTER the timer driver and stops BEFORE it (front door last/first)', async () => {
    store = await makeStore();
    const sequence: string[] = [];
    const gateway = fakeGateway(sequence);
    const driver: WorkflowTimerDriverLike = {
      start() {
        sequence.push('timers:start');
      },
      stop() {
        sequence.push('timers:stop');
      },
      status() {
        return { running: true, sweeps: 0, fired: 0, errors: 0 };
      },
      async sweep() {
        return 0;
      },
    };
    server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        server: { port: 0 },
      },
      channels: { gateway },
      workflowTimers: { driver },
    });
    await server.start();
    await server.stop();
    expect(sequence.indexOf('gateway:start')).toBeGreaterThan(sequence.indexOf('timers:start'));
    expect(sequence.indexOf('gateway:stop')).toBeLessThan(sequence.indexOf('timers:stop'));
  });

  it('SERVER-CH-01: a gateway start failure unwinds earlier daemons and stop() is a safe no-op', async () => {
    store = await makeStore();
    const sequence: string[] = [];
    const broken: ChannelGatewayLike = {
      async start() {
        throw new Error('vendor webhook registration failed');
      },
      async stop() {
        sequence.push('gateway:stop');
      },
      async status(): Promise<ChannelGatewayStatusLike> {
        return { running: false, channels: [] };
      },
      setActivityListener() {},
    };
    const driver: WorkflowTimerDriverLike = {
      start() {
        sequence.push('timers:start');
      },
      stop() {
        sequence.push('timers:stop');
      },
      status() {
        return { running: true, sweeps: 0, fired: 0, errors: 0 };
      },
      async sweep() {
        return 0;
      },
    };
    server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        server: { port: 0 },
      },
      channels: { gateway: broken },
      workflowTimers: { driver },
    });
    // start() rejects with the gateway error.
    await expect(server.start()).rejects.toThrow('vendor webhook registration failed');
    // The timer driver started BEFORE the gateway (which starts last) and must
    // be unwound on failure - not left running as a zombie.
    expect(sequence).toContain('timers:start');
    expect(sequence).toContain('timers:stop');
    // stop() after a failed start is a safe no-op, not LifecycleNotStartedError.
    await expect(server.stop()).resolves.toBeUndefined();
  });

  it('bridges accepted inbound into scheduler.recordActivity (A2)', async () => {
    store = await makeStore();
    const gateway = fakeGateway();
    const recordActivity = vi.fn();
    const triggersDaemon = {
      async start() {},
      async stop() {},
      async status() {
        return { running: true, active: 0, disabled: 0, deferred: 0 };
      },
      metrics() {
        return {};
      },
      scheduler: { recordActivity },
    } as unknown as TriggersDaemon;
    server = await createServer({
      store,
      skipHardening: true,
      config: {
        auth: { kind: 'none' },
        storage: { path: ':memory:', mode: 'lib' },
        server: { port: 0 },
      },
      channels: { gateway },
      triggers: { daemon: triggersDaemon },
    });
    // createServer wired the single listener slot at construction.
    expect(gateway.listener).toBeDefined();
    gateway.listener?.();
    gateway.listener?.();
    expect(recordActivity).toHaveBeenCalledTimes(2);
  });

  it('buildDaemons adopts a pre-built daemon and wraps a bare gateway', () => {
    const gateway = fakeGateway();
    const wrapped = buildDaemons({ channels: { gateway } });
    expect(wrapped.channelsDaemon).toBeDefined();
    const daemon = createChannelsDaemon({ gateway });
    const adopted = buildDaemons({ channels: { daemon } });
    expect(adopted.channelsDaemon).toBe(daemon);
    expect(buildDaemons({}).channelsDaemon).toBeUndefined();
  });
});

describe('B1.6 - channels health aggregation', () => {
  it('aggregates per-channel counters into one check', async () => {
    const gateway = fakeGateway();
    const daemon = createChannelsDaemon({ gateway });
    await daemon.start();
    const summary = await collectHealth({ channels: daemon });
    expect(summary.checks.channels).toEqual({
      status: 'ok',
      running: true,
      channels: 1,
      queued: 1,
      dropped: 2,
      failed: 3,
    });
    expect(summary.status).toBe('ok');
  });

  it('a stopped gateway degrades, a throwing status fails', async () => {
    const gateway = fakeGateway();
    const daemon = createChannelsDaemon({ gateway });
    const stopped = await collectHealth({ channels: daemon });
    expect(stopped.checks.channels?.status).toBe('warn');
    expect(stopped.status).toBe('degraded');

    const broken = createChannelsDaemon({
      gateway: {
        async start() {},
        async stop() {},
        async status(): Promise<ChannelGatewayStatusLike> {
          throw new Error('gateway exploded');
        },
      },
    });
    const failing = await collectHealth({ channels: broken });
    expect(failing.checks.channels?.status).toBe('fail');
    expect(failing.status).toBe('failing');
    expect(failing.checks.channels?.message).toContain('gateway exploded');
  });

  it('daemon stop is bounded by stopTimeoutMs (hung gateway does not hang shutdown)', async () => {
    const warns: string[] = [];
    const daemon = createChannelsDaemon({
      gateway: {
        async start() {},
        stop: () => new Promise(() => {}),
        async status(): Promise<ChannelGatewayStatusLike> {
          return { running: true, channels: [] };
        },
      },
      stopTimeoutMs: 20,
      warn: (line) => warns.push(line),
    });
    await daemon.start();
    await daemon.stop();
    expect(warns.some((w) => w.includes('exceeded 20ms'))).toBe(true);
  });
});
