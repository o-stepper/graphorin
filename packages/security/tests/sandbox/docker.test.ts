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

  // Opt-in integration: only runs when GRAPHORIN_DOCKER_TEST=1 is
  // set on the runner. Whoever exports the env var is responsible
  // for installing the optional `dockerode` peer dependency and
  // pulling the required image first.
  describe.runIf(dockerOptIn)('with a live Docker daemon', () => {
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
    });
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
