import { describe, expect, it } from 'vitest';

import { createDockerSandbox } from '../../src/sandbox/docker.js';

/**
 * Phase 03c DoD: "DockerSandbox integration test (CI gated; skipped
 * on machines without Docker)." The integration body is gated
 * behind the explicit `GRAPHORIN_DOCKER_TEST=1` opt-in so it never
 * runs by accident — CI sets the env var only on runners where the
 * daemon, the optional `dockerode` peer dependency, AND the
 * required image have been pre-pulled. Without the opt-in the body
 * surfaces as a `skipped` row so the DoD line "skipped on machines
 * without Docker" stays verifiable.
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
    const result = await noop.run(
      // @ts-expect-error — exercising the unsupported branch on purpose.
      { kind: 'file', path: '/tmp/x.js' },
      { input: undefined },
    );
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

  // CI-gated integration: only runs when GRAPHORIN_DOCKER_TEST=1 is
  // set on the runner. CI is responsible for installing the
  // optional `dockerode` peer dependency and pulling the required
  // image before exporting the env var.
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

  describe.skipIf(dockerOptIn)('without an opt-in (default — DoD `skipped` row)', () => {
    it('reports the CI-gated path as skipped (DoD compliance row)', () => {
      // Marker test that the suite is correctly skipping when the
      // operator has not opted into Docker integration. Keeps the
      // DoD line "skipped on machines without Docker" verifiable.
      expect(dockerOptIn).toBe(false);
    });
  });
});
