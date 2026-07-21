import { describe, expect, it } from 'vitest';

import { createDockerSandbox } from '../../src/sandbox/docker.js';

/**
 * Phase 03c DoD: "DockerSandbox integration test (CI gated; skipped
 * on machines without Docker)." The integration body is gated
 * behind the explicit `GRAPHORIN_DOCKER_TEST=1` opt-in so it never
 * runs by accident - set the env var only where the daemon, the
 * optional `dockerode` peer dependency, AND the required image are
 * all available (no CI leg sets it today; operators opt in
 * locally). Without the opt-in the body surfaces as a `skipped` row
 * so the DoD line "skipped on machines without Docker" stays
 * verifiable.
 */
const dockerOptIn = process.env.GRAPHORIN_DOCKER_TEST === '1';

describe('DockerSandbox', () => {
  it('returns sandbox-violation when the dockerode peer dependency is unavailable', async () => {
    const sandbox = createDockerSandbox({
      peerLoader: async () => {
        throw new Error('dockerode missing');
      },
    });
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('sandbox-violation');
      expect(result.error.message).toContain('dockerode');
    }
  });

  it('refuses unsupported code kinds', async () => {
    const noop = createDockerSandbox({
      // Provide a stub client that never reaches createContainer.
      peerLoader: async () => ({
        default: class {
          async createContainer(): Promise<never> {
            throw new Error('should not be reached');
          }
        } as unknown as new () => never,
      }),
    });
    // The 'kind: file' arm is not implemented; expect a sandbox-violation.
    const result = await noop.run({ kind: 'file', path: '/tmp/x.js' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('exposes Docker-tier capabilities', () => {
    const sandbox = createDockerSandbox({
      peerLoader: async () => {
        throw new Error('dockerode missing');
      },
    });
    expect(sandbox.kind).toBe('docker');
    expect(sandbox.capabilities.canBlockNetwork).toBe(true);
    expect(sandbox.capabilities.canBlockFilesystem).toBe(true);
    expect(sandbox.capabilities.canEnforceTimeout).toBe(true);
    expect(sandbox.capabilities.canEnforceMemoryLimit).toBe(true);
  });

  // Regression for e2e finding D-02/14: with `Tty: false` the daemon
  // multiplexes container logs into 8-byte-framed records; run() must
  // strip the frame headers before JSON.parse. These stubs feed
  // synthetic multiplexed buffers through the real parsing path
  // without needing a live daemon.
  describe('multiplexed (Tty: false) log stream demultiplexing', () => {
    const frame = (streamType: number, payload: Buffer): Buffer => {
      const header = Buffer.alloc(8);
      header[0] = streamType;
      header.writeUInt32BE(payload.length, 4);
      return Buffer.concat([header, payload]);
    };

    const sandboxWithLogs = (logs: Buffer | string) =>
      createDockerSandbox({
        peerLoader: async () => ({
          default: class {
            async createContainer(): Promise<unknown> {
              return {
                id: 'stub-container',
                start: async () => {},
                wait: async () => ({ StatusCode: 0 }),
                logs: async () => logs,
                remove: async () => {},
              };
            }
          } as unknown as new () => never,
        }),
      });

    it('parses JSON out of a single stdout frame', async () => {
      const payload = Buffer.from(JSON.stringify({ ok: true, n: 42 }), 'utf8');
      const sandbox = sandboxWithLogs(frame(1, payload));
      const result = await sandbox.run(
        { kind: 'source', source: 'return { ok: true, n: 42 };' },
        { input: undefined },
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toEqual({ ok: true, n: 42 });
    });

    it('reassembles a payload split across frames and ignores stderr frames', async () => {
      const json = JSON.stringify({ ok: true, list: [1, 2, 3] });
      const logs = Buffer.concat([
        frame(1, Buffer.from(json.slice(0, 7), 'utf8')),
        frame(2, Buffer.from('noise on stderr', 'utf8')),
        frame(1, Buffer.from(json.slice(7), 'utf8')),
      ]);
      const sandbox = sandboxWithLogs(logs);
      const result = await sandbox.run(
        { kind: 'source', source: 'return { ok: true, list: [1, 2, 3] };' },
        { input: undefined },
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toEqual({ ok: true, list: [1, 2, 3] });
    });

    it('still accepts an unframed plain-text buffer (stub / TTY compatibility)', async () => {
      const sandbox = sandboxWithLogs(Buffer.from('{"plain":true}', 'utf8'));
      const result = await sandbox.run(
        { kind: 'source', source: 'return { plain: true };' },
        { input: undefined },
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toEqual({ plain: true });
    });
  });

  // deep-retest-0.13.9 P1: the stable SandboxRunOptions contract
  // (env allowlist, per-call maxMemoryMb, signal, stderr diagnostics)
  // must actually be executed by the Docker adapter, not just typed.
  // These stubs capture the createContainer payload and drive the
  // real run() path without a live daemon.
  describe('SandboxRunOptions contract (stub-verified)', () => {
    const frame = (streamType: number, payload: Buffer): Buffer => {
      const header = Buffer.alloc(8);
      header[0] = streamType;
      header.writeUInt32BE(payload.length, 4);
      return Buffer.concat([header, payload]);
    };

    interface StubHarness {
      readonly createCalls: Array<Record<string, unknown>>;
      readonly removeCalls: Array<{ force?: boolean } | undefined>;
    }

    const makeStubSandbox = (args: {
      harness: StubHarness;
      statusCode?: number;
      logs?: Buffer;
      wait?: () => Promise<{ StatusCode: number }>;
      onStart?: () => void;
    }) =>
      createDockerSandbox({
        peerLoader: async () => ({
          default: class {
            async createContainer(opts: Record<string, unknown>): Promise<unknown> {
              args.harness.createCalls.push(opts);
              return {
                id: 'stub-container',
                start: async () => {
                  args.onStart?.();
                },
                wait: args.wait ?? (async () => ({ StatusCode: args.statusCode ?? 0 })),
                logs: async () => args.logs ?? frame(1, Buffer.from('null', 'utf8')),
                remove: async (opts?: { force?: boolean }) => {
                  args.harness.removeCalls.push(opts);
                },
              };
            }
          } as unknown as new () => never,
        }),
      });

    it('forwards the env allowlist as container Env', async () => {
      const harness: StubHarness = { createCalls: [], removeCalls: [] };
      const sandbox = makeStubSandbox({ harness });
      await sandbox.run(
        { kind: 'source', source: 'return null;' },
        { input: undefined, env: { GRAPHORIN_AUDIT_MARKER: 'VISIBLE', SECOND: 'x' } },
      );
      expect(harness.createCalls[0]?.Env).toEqual(['GRAPHORIN_AUDIT_MARKER=VISIBLE', 'SECOND=x']);
    });

    it('sends an empty Env when no allowlist is given', async () => {
      const harness: StubHarness = { createCalls: [], removeCalls: [] };
      const sandbox = makeStubSandbox({ harness });
      await sandbox.run({ kind: 'source', source: 'return null;' }, { input: undefined });
      expect(harness.createCalls[0]?.Env).toEqual([]);
    });

    it('per-call maxMemoryMb overrides the constructor default in HostConfig.Memory', async () => {
      const harness: StubHarness = { createCalls: [], removeCalls: [] };
      const sandbox = makeStubSandbox({ harness });
      await sandbox.run(
        { kind: 'source', source: 'return null;' },
        { input: undefined, maxMemoryMb: 128 },
      );
      await sandbox.run({ kind: 'source', source: 'return null;' }, { input: undefined });
      const hostConfigOf = (i: number) =>
        (harness.createCalls[i]?.HostConfig ?? {}) as { Memory?: number };
      expect(hostConfigOf(0).Memory).toBe(128 * 1024 * 1024);
      // Second call falls back to the 512 MB constructor default.
      expect(hostConfigOf(1).Memory).toBe(512 * 1024 * 1024);
    });

    it('an already-aborted signal short-circuits before the container is created', async () => {
      const harness: StubHarness = { createCalls: [], removeCalls: [] };
      const sandbox = makeStubSandbox({ harness });
      const controller = new AbortController();
      controller.abort();
      const result = await sandbox.run(
        { kind: 'source', source: 'return null;' },
        { input: undefined, signal: controller.signal },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe('aborted');
      expect(harness.createCalls).toHaveLength(0);
    });

    it('an abort during the run resolves kind aborted and force-removes the container', async () => {
      const harness: StubHarness = { createCalls: [], removeCalls: [] };
      const controller = new AbortController();
      const sandbox = makeStubSandbox({
        harness,
        // wait() never settles - the abort must decide the race.
        wait: () => new Promise<never>(() => {}),
        onStart: () => {
          setTimeout(() => controller.abort(), 10);
        },
      });
      const result = await sandbox.run(
        { kind: 'source', source: 'return null;' },
        { input: undefined, signal: controller.signal },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe('aborted');
      expect(harness.removeCalls).toEqual([{ force: true }]);
    });

    it('an abort racing container start is not missed by the late listener', async () => {
      const harness: StubHarness = { createCalls: [], removeCalls: [] };
      const controller = new AbortController();
      const sandbox = makeStubSandbox({
        harness,
        wait: () => new Promise<never>(() => {}),
        // Abort synchronously inside start(): the adapter attaches its
        // listener only afterwards, so it must check signal.aborted.
        onStart: () => controller.abort(),
      });
      const result = await sandbox.run(
        { kind: 'source', source: 'return null;' },
        { input: undefined, signal: controller.signal },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe('aborted');
    });

    it('a non-zero exit surfaces the stderr diagnostics in message and cause', async () => {
      const harness: StubHarness = { createCalls: [], removeCalls: [] };
      const stderrText = 'ReferenceError: input is not defined\n    at [eval]:1:1';
      const sandbox = makeStubSandbox({
        harness,
        statusCode: 1,
        logs: Buffer.concat([
          frame(1, Buffer.from('', 'utf8')),
          frame(2, Buffer.from(stderrText, 'utf8')),
        ]),
      });
      const result = await sandbox.run(
        { kind: 'source', source: 'return input;' },
        { input: undefined },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('execution-failed');
        expect(result.error.message).toContain('ReferenceError: input is not defined');
        expect(result.error.cause).toEqual({ stdout: '', stderr: stderrText });
      }
    });
  });

  // Opt-in integration: only runs when GRAPHORIN_DOCKER_TEST=1 is
  // set on the runner. Whoever exports the env var is responsible
  // for installing the optional `dockerode` peer dependency and
  // pulling the required image first.
  describe.runIf(dockerOptIn)('with a live Docker daemon', () => {
    // The vitest timeout must outlive the sandbox's own 60s budget: a cold
    // one-shot container (create + start + wait + logs) takes longer than
    // the 5s default on CI runners, which failed the first scheduled
    // integration-real run.
    it('runs a one-shot container and returns the JSON output', async () => {
      const sandbox = createDockerSandbox({
        image: process.env.GRAPHORIN_DOCKER_TEST_IMAGE ?? 'node:22-alpine',
        defaultTimeoutMs: 60_000,
      });
      const result = await sandbox.run<unknown, { ok: true; pid: number }>(
        {
          kind: 'source',
          source: 'return { ok: true, pid: process.pid };',
        },
        { input: undefined },
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output.ok).toBe(true);
    }, 90_000);

    it('the env allowlist and the input binding are visible inside the container', async () => {
      const sandbox = createDockerSandbox({
        image: process.env.GRAPHORIN_DOCKER_TEST_IMAGE ?? 'node:22-alpine',
        defaultTimeoutMs: 60_000,
      });
      const result = await sandbox.run<{ n: number }, { marker: string | null; doubled: number }>(
        {
          kind: 'source',
          source:
            'return { marker: process.env.GRAPHORIN_AUDIT_MARKER ?? null, doubled: __INPUT__.n * 2 };',
        },
        { input: { n: 21 }, env: { GRAPHORIN_AUDIT_MARKER: 'VISIBLE' } },
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toEqual({ marker: 'VISIBLE', doubled: 42 });
    }, 90_000);

    it('a thrown exception comes back through stderr diagnostics', async () => {
      const sandbox = createDockerSandbox({
        image: process.env.GRAPHORIN_DOCKER_TEST_IMAGE ?? 'node:22-alpine',
        defaultTimeoutMs: 60_000,
      });
      const result = await sandbox.run(
        { kind: 'source', source: 'throw new Error("live-stderr-probe");' },
        { input: undefined },
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe('execution-failed');
        expect(result.error.message).toContain('live-stderr-probe');
        expect((result.error.cause as { stderr: string }).stderr).toContain('live-stderr-probe');
      }
    }, 90_000);

    it('an abort mid-run force-stops the container and reports kind aborted', async () => {
      const sandbox = createDockerSandbox({
        image: process.env.GRAPHORIN_DOCKER_TEST_IMAGE ?? 'node:22-alpine',
        defaultTimeoutMs: 60_000,
      });
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3_000);
      const result = await sandbox.run(
        {
          kind: 'source',
          source: 'await new Promise((resolve) => setTimeout(resolve, 55_000)); return null;',
        },
        { input: undefined, signal: controller.signal },
      );
      clearTimeout(t);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe('aborted');
    }, 90_000);
  });

  describe.skipIf(dockerOptIn)('without an opt-in (default - DoD `skipped` row)', () => {
    it('reports the CI-gated path as skipped (DoD compliance row)', () => {
      // Marker test that the suite is correctly skipping when the
      // operator has not opted into Docker integration. Keeps the
      // DoD line "skipped on machines without Docker" verifiable.
      expect(dockerOptIn).toBe(false);
    });
  });
});
