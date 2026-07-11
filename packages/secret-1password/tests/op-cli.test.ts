import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';

import { createDefaultOpCli, createOpCli, OpCliError } from '../src/op-cli.js';

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

/**
 * Fake `spawn` that emits the given stderr and exits with the given code.
 * Lets the exit-classifier be exercised with realistic `op` stderr lines
 * without a real subprocess (cross-platform, deterministic).
 */
function spawnWithStderr(stderr: string, exitCode = 1): typeof import('node:child_process').spawn {
  return ((..._args: unknown[]) => {
    const proc = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      kill: (signal?: string) => boolean;
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => true;
    setImmediate(() => {
      proc.stderr.emit('data', Buffer.from(stderr));
      proc.emit('close', exitCode);
    });
    return proc;
  }) as unknown as typeof import('node:child_process').spawn;
}

describe('createOpCli - exit-error classification', () => {
  it("classifies the op CLI v2 'not currently signed in' message as signed-out (E-15)", async () => {
    const cli = createOpCli({
      spawn: spawnWithStderr(
        '[ERROR] 2026/07/11 14:00:00 you are not currently signed in. Please run `op signin --help` for instructions\n',
      ),
    });
    await expect(cli.read('op://Personal/Item/field', { timeoutMs: 5000 })).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'signed-out',
      hint: "run 'eval $(op signin)' (interactive) or set OP_SERVICE_ACCOUNT_TOKEN (headless).",
    });
  });

  it("still classifies the legacy 'not signed in' message as signed-out", async () => {
    const cli = createOpCli({
      spawn: spawnWithStderr('[ERROR] you are not signed in, please run `op signin`\n'),
    });
    await expect(cli.read('op://Personal/Item/field', { timeoutMs: 5000 })).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'signed-out',
    });
  });

  it('classifies a session-expired message as signed-out', async () => {
    const cli = createOpCli({
      spawn: spawnWithStderr(
        '[ERROR] 2026/07/11 14:00:00 session expired, sign in to create a new session\n',
      ),
    });
    await expect(cli.read('op://Personal/Item/field', { timeoutMs: 5000 })).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'signed-out',
    });
  });

  it('classifies the op CLI v2 "couldn\'t find" message as reference-not-found', async () => {
    const cli = createOpCli({
      spawn: spawnWithStderr(
        '[ERROR] 2026/07/11 14:00:00 could not read secret \'op://Personal/Item/field\': couldn\'t find item "Item" in vault "Personal"\n',
      ),
    });
    await expect(cli.read('op://Personal/Item/field', { timeoutMs: 5000 })).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'reference-not-found',
    });
  });

  it('keeps unrecognized stderr as unknown', async () => {
    const cli = createOpCli({
      spawn: spawnWithStderr('[ERROR] 2026/07/11 14:00:00 something inscrutable happened\n'),
    });
    await expect(cli.read('op://Personal/Item/field', { timeoutMs: 5000 })).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'unknown',
    });
  });
});

describe('createOpCli - SPL-22 timeout escalation', () => {
  it('escalates to SIGKILL and rejects when the child ignores SIGTERM', async () => {
    const signals: string[] = [];
    // A fake child that ignores SIGTERM (never closes) but dies on SIGKILL.
    // Cross-platform: no real subprocess, so the hang/escalation path is
    // exercised deterministically.
    const fakeSpawn = ((..._args: unknown[]) => {
      const proc = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: (signal?: string) => boolean;
      };
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.kill = (signal?: string): boolean => {
        signals.push(signal ?? 'SIGTERM');
        if (signal === 'SIGKILL') setImmediate(() => proc.emit('close', null));
        return true;
      };
      return proc;
    }) as unknown as typeof import('node:child_process').spawn;

    const cli = createOpCli({ spawn: fakeSpawn });
    await expect(
      cli.read('op://Personal/Item/field', { binary: 'op', timeoutMs: 20 }),
    ).rejects.toMatchObject({ name: 'OpCliError', kind: 'timeout' });
    // SIGTERM is tried first, then the SIGKILL escalation fires.
    expect(signals).toContain('SIGTERM');
    expect(signals).toContain('SIGKILL');
  }, 10_000);
});
