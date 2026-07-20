import { EventEmitter } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
 * Fake `spawn` that records the argv it was invoked with and succeeds.
 * Deep-retest 0.13.7 P1: `op read --reveal` shipped broken because no
 * test ever looked at the spawned argv - the real `op read` has no
 * `--reveal` flag (`op item get` does), so every resolve failed with
 * `unknown flag` at the CLI's parser. These tests pin the exact argv.
 */
function spawnCapturingArgs(sink: string[][]): typeof import('node:child_process').spawn {
  return ((_cmd: string, args: string[]) => {
    sink.push([...args]);
    const proc = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
      kill: (signal?: string) => boolean;
    };
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.kill = () => true;
    setImmediate(() => {
      proc.stdout.emit('data', Buffer.from('value\n'));
      proc.emit('close', 0);
    });
    return proc;
  }) as unknown as typeof import('node:child_process').spawn;
}

describe('createOpCli - argv contract (deep-retest 0.13.7 P1)', () => {
  it('spawns exactly `read --no-color <uri>` - only flags the real `op read` accepts', async () => {
    const sink: string[][] = [];
    const cli = createOpCli({ spawn: spawnCapturingArgs(sink) });
    const result = await cli.read('op://personal/item/field', { timeoutMs: 5000 });
    expect(result.value).toBe('value');
    expect(sink).toEqual([['read', '--no-color', 'op://personal/item/field']]);
    expect(sink[0]).not.toContain('--reveal');
  });

  it('appends --account before the uri when configured', async () => {
    const sink: string[][] = [];
    const cli = createOpCli({ spawn: spawnCapturingArgs(sink) });
    await cli.read('op://personal/item/field', { timeoutMs: 5000, account: 'work' });
    expect(sink).toEqual([['read', '--no-color', '--account', 'work', 'op://personal/item/field']]);
  });

  it('drops --no-color when preserveColor is set', async () => {
    const sink: string[][] = [];
    const cli = createOpCli({ spawn: spawnCapturingArgs(sink) });
    await cli.read('op://personal/item/field', { timeoutMs: 5000, preserveColor: true });
    expect(sink).toEqual([['read', 'op://personal/item/field']]);
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

  it("classifies op 2.35's 'No accounts configured' as signed-out with a setup hint (deep-retest 0.13.7 P2)", async () => {
    // Verbatim stderr shape of op CLI 2.35.0 on a machine with the CLI
    // installed but no account wired (captured live 2026-07-20).
    const cli = createOpCli({
      spawn: spawnWithStderr(
        'No accounts configured for use with 1Password CLI.\n' +
          '\n' +
          " - Turn on the 1Password desktop app integration to sign in with the accounts you've added to the app: https://www.1password.dev/cli/app-integration/ for details.\n" +
          " - Add an account manually with 'op account add' and sign in by entering your password on the command line.\n" +
          "[ERROR] 2026/07/20 20:55:23 could not read secret 'op://x/y/z': error initializing client: \n",
      ),
    });
    await expect(cli.read('op://x/y/z', { timeoutMs: 5000 })).rejects.toMatchObject({
      name: 'OpCliError',
      kind: 'signed-out',
      hint: expect.stringContaining('op account add'),
    });
  });
});

const RUN_OP_INTEGRATION = process.env.GRAPHORIN_RUN_OP_INTEGRATION === '1';

describe.skipIf(!RUN_OP_INTEGRATION)(
  'real `op` binary contract (GRAPHORIN_RUN_OP_INTEGRATION=1)',
  () => {
    it('reaches the account/auth stage - the argv parses, no unknown-flag error', async () => {
      // Isolated OP_CONFIG_DIR forces the deterministic 'no accounts
      // configured' state even on a machine where the operator DOES use
      // 1Password, and the explicit env keeps OP_SERVICE_ACCOUNT_TOKEN /
      // OP_CONNECT_* from leaking in. No 1Password secret is needed: the
      // leg exists to prove the spawn contract against the real parser
      // (the 0.13.7 `--reveal` failure mode died at flag parsing, before
      // any auth check).
      const configDir = await mkdtemp(join(tmpdir(), 'graphorin-op-config-'));
      try {
        const cli = createDefaultOpCli();
        const err = await cli
          .read('op://graphorin-audit/nonexistent-item/field', {
            timeoutMs: 30_000,
            env: {
              ...(process.env.PATH !== undefined ? { PATH: process.env.PATH } : {}),
              ...(process.env.HOME !== undefined ? { HOME: process.env.HOME } : {}),
              OP_CONFIG_DIR: configDir,
            },
          })
          .then(() => undefined)
          .catch((e: unknown) => e);
        expect(err).toBeInstanceOf(OpCliError);
        const opErr = err as OpCliError;
        expect(opErr.stderr ?? '').not.toMatch(/unknown flag/i);
        expect(opErr.kind).toBe('signed-out');
        expect(opErr.stderr ?? '').toMatch(/no accounts configured/i);
        expect(opErr.hint ?? '').toContain('op account add');
      } finally {
        await rm(configDir, { recursive: true, force: true });
      }
    }, 60_000);
  },
);

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
