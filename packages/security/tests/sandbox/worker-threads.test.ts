import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createWorkerThreadsSandbox } from '../../src/sandbox/worker-threads.js';

const HANDLERS = fileURLToPath(new URL('./__fixtures__/handlers.mjs', import.meta.url));

describe('WorkerThreadsSandbox', () => {
  it('runs a handler and returns the typed output', async () => {
    const sandbox = createWorkerThreadsSandbox();
    const result = await sandbox.run<{ greeting: string }, { hello: { greeting: string } }>(
      { kind: 'handler', module: HANDLERS, export: 'echo' },
      { input: { greeting: 'hi' } },
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output).toEqual({ hello: { greeting: 'hi' } });
  });

  it('enforces a wall-clock timeout', async () => {
    const sandbox = createWorkerThreadsSandbox({ defaultTimeoutMs: 200 });
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'sleepForever' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('timeout');
  }, 5_000);

  it('blocks node:fs/promises when noFilesystem is set', async () => {
    const sandbox = createWorkerThreadsSandbox({ noFilesystem: true });
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'readPackageJson' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('sandbox-violation');
      expect(result.error.message).toContain('filesystem access denied');
    }
  });

  it('blocks fetch() when noNetwork is set', async () => {
    const sandbox = createWorkerThreadsSandbox({ noNetwork: true });
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'tryFetch' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('sandbox-violation');
      expect(result.error.message).toContain('network access denied');
    }
  });

  it('blocks node:http imports when noNetwork is set', async () => {
    const sandbox = createWorkerThreadsSandbox({ noNetwork: true });
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'tryHttp' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('does not expose host environment variables to the handler (TL-9)', async () => {
    process.env.GRAPHORIN_TL9_PROBE = 'host-secret';
    try {
      const sandbox = createWorkerThreadsSandbox();
      const result = await sandbox.run(
        { kind: 'handler', module: HANDLERS, export: 'readEnv' },
        { input: { name: 'GRAPHORIN_TL9_PROBE' } },
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.output).toEqual({ value: null, keys: [] });
    } finally {
      delete process.env.GRAPHORIN_TL9_PROBE;
    }
  });

  it('exposes only the explicitly allowlisted env entries', async () => {
    const sandbox = createWorkerThreadsSandbox({ noFilesystem: true });
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'readEnv' },
      { input: { name: 'GRAPHORIN_TL9_ALLOWED' }, env: { GRAPHORIN_TL9_ALLOWED: 'yes' } },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toEqual({ value: 'yes', keys: ['GRAPHORIN_TL9_ALLOWED'] });
    }
  });

  it('returns aborted when the signal aborts before dispatch', async () => {
    const sandbox = createWorkerThreadsSandbox();
    const controller = new AbortController();
    controller.abort();
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'echo' },
      { input: 'x', signal: controller.signal },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('aborted');
  });

  it('terminates the worker when the signal aborts mid-run', async () => {
    const sandbox = createWorkerThreadsSandbox({ abortGraceMs: 50 });
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'sleepForever' },
      { input: undefined, signal: controller.signal, timeoutMs: 5_000 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('aborted');
  }, 5_000);

  it('forwards execution-failed errors with the original message', async () => {
    const sandbox = createWorkerThreadsSandbox();
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'alwaysThrow' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('execution-failed');
      expect(result.error.message).toBe('fixture intentionally throws');
    }
  });

  it('returns sandbox-violation when the export is not a function', async () => {
    const sandbox = createWorkerThreadsSandbox();
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'nonExistent' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('refuses inline source-code dispatch', async () => {
    const sandbox = createWorkerThreadsSandbox();
    const result = await sandbox.run({ kind: 'source', source: 'return 1' }, { input: undefined });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('sandbox-violation');
  });

  it('advertises the canonical kind and capabilities', () => {
    const sandbox = createWorkerThreadsSandbox();
    expect(sandbox.id).toBe('worker-threads');
    expect(sandbox.kind).toBe('worker-threads');
    expect(sandbox.capabilities.canBlockNetwork).toBe(true);
    expect(sandbox.capabilities.canBlockFilesystem).toBe(true);
    expect(sandbox.capabilities.canEnforceTimeout).toBe(true);
    expect(sandbox.capabilities.canEnforceMemoryLimit).toBe(true);
  });
});

describe('SDF-9 - process-escape hardening', () => {
  it('blocks node:child_process even when fs/network are not restricted (always-blocked escape)', async () => {
    const sandbox = createWorkerThreadsSandbox();
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'trySpawnEsm' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message.toLowerCase()).toContain('denied');
  });

  it('blocks the CJS require() escape for an always-blocked module', async () => {
    const sandbox = createWorkerThreadsSandbox();
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'trySpawnRequire' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message.toLowerCase()).toContain('denied');
  });

  it('blocks the CJS require() escape for fs when noFilesystem is set', async () => {
    const sandbox = createWorkerThreadsSandbox({ noFilesystem: true });
    const result = await sandbox.run(
      { kind: 'handler', module: HANDLERS, export: 'tryFsRequire' },
      { input: undefined },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message.toLowerCase()).toContain('denied');
  });
});
