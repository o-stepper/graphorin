import { describe, expect, it } from 'vitest';

import { createDefaultOpCli, OpCliError } from '../src/op-cli.js';

describe('OpCliError', () => {
  it('captures the kind, exit code, stderr, and hint', () => {
    const cause = new Error('underlying');
    const err = new OpCliError('signed-out', 'op CLI says no', {
      cause,
      exitCode: 6,
      stderr: 'session expired',
      hint: 'op signin',
    });
    expect(err.name).toBe('OpCliError');
    expect(err.kind).toBe('signed-out');
    expect(err.exitCode).toBe(6);
    expect(err.stderr).toBe('session expired');
    expect(err.hint).toBe('op signin');
    expect(err.cause).toBe(cause);
  });

  it('omits optional fields when not provided', () => {
    const err = new OpCliError('unknown', 'boom');
    expect(err.exitCode).toBeUndefined();
    expect(err.stderr).toBeUndefined();
    expect(err.hint).toBeUndefined();
  });
});

describe('createDefaultOpCli', () => {
  it('reports binary-missing when the configured binary cannot be spawned', async () => {
    const cli = createDefaultOpCli();
    await expect(
      cli.read('op://Personal/Item/field', {
        binary: '/var/empty/graphorin-test-no-such-binary',
        timeoutMs: 1000,
      }),
    ).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'binary-missing',
    });
  });

  it('classifies non-zero exit codes as unknown when the stderr does not match a known kind', async () => {
    const cli = createDefaultOpCli();
    // `false` is a POSIX builtin that always exits 1 with empty stderr.
    await expect(
      cli.read('op://Personal/Item/field', {
        binary: 'false',
        timeoutMs: 5000,
      }),
    ).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'unknown',
    });
  });

  it('captures stdout from a successful invocation', async () => {
    const cli = createDefaultOpCli();
    // `printf` writes the value without a trailing newline so the
    // wrapper's `replace(/\r?\n$/, '')` does not need to do anything.
    const result = await cli.read('op://Personal/Item/field', {
      binary: 'true',
      timeoutMs: 5000,
    });
    expect(result.exitCode).toBe(0);
    expect(typeof result.value).toBe('string');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
