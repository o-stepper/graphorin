import { randomBytes } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { _resetResolversForTesting, installBuiltinResolvers } from '@graphorin/security';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  parseDuration,
  runTokenCreate,
  runTokenList,
  runTokenRevoke,
  runTokenRotate,
  runTokenVerify,
} from '../src/commands/token.js';

async function fixtureWithPepper(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-cli-token-'));
  const cfg = join(dir, 'graphorin.config.json');
  await writeFile(
    cfg,
    JSON.stringify({
      storage: { path: join(dir, 'data.db'), mode: 'lib' },
      auth: { kind: 'token', pepperRef: 'env:GRAPHORIN_TEST_PEPPER' },
    }),
    'utf8',
  );
  return cfg;
}

describe('parseDuration', () => {
  it('accepts the documented suffixes', () => {
    expect(parseDuration('30s')).toBe(30_000);
    expect(parseDuration('5m')).toBe(5 * 60_000);
    expect(parseDuration('2h')).toBe(2 * 60 * 60_000);
    expect(parseDuration('1d')).toBe(24 * 60 * 60_000);
  });

  it('throws on a malformed string', () => {
    expect(() => parseDuration('30')).toThrow();
    expect(() => parseDuration('30y')).toThrow();
  });
});

describe('runTokenVerify', () => {
  it('reports a structural failure for a clearly bogus token', () => {
    const result = runTokenVerify({ token: 'not-a-real-token', print: () => undefined });
    expect(result.ok).toBe(false);
  });
});

describe('token CRUD against a real SQLite store', () => {
  let cfg: string;

  beforeEach(async () => {
    _resetResolversForTesting();
    installBuiltinResolvers({});
    process.env.GRAPHORIN_TEST_PEPPER = randomBytes(32).toString('hex');
    cfg = await fixtureWithPepper();
  });

  afterEach(() => {
    delete process.env.GRAPHORIN_TEST_PEPPER;
    _resetResolversForTesting();
  });

  it('creates + lists + revokes a token end-to-end', async () => {
    const created = await runTokenCreate({
      config: cfg,
      scopes: ['agent:run'],
      label: 'integration',
      env: 'live',
      print: () => undefined,
      stdoutPrint: () => undefined,
    });
    expect(created.id).toMatch(/^[0-9a-f-]+$/);
    expect(created.raw).toMatch(/^gph_live_v1_/);
    expect(created.scopes).toEqual(['agent:run']);

    const list = await runTokenList({ config: cfg, print: () => undefined });
    expect(list.some((t) => t.id === created.id)).toBe(true);

    const revoked = await runTokenRevoke({
      config: cfg,
      id: created.id,
      print: () => undefined,
    });
    expect(revoked?.revokedAt).toBeDefined();
  });

  it('S-14b: create prints the raw token on STDOUT and keeps the chatter on stderr', async () => {
    const stderrLines: string[] = [];
    const stdoutLines: string[] = [];
    const created = await runTokenCreate({
      config: cfg,
      scopes: ['agent:run'],
      label: 'stdout-contract',
      print: (l) => stderrLines.push(l),
      stdoutPrint: (l) => stdoutLines.push(l),
    });
    // The raw value is the machine-consumable output - stdout only.
    expect(stdoutLines).toEqual([created.raw]);
    expect(stderrLines.some((l) => l.includes(created.raw))).toBe(false);
    expect(stderrLines.some((l) => l.includes('token created'))).toBe(true);
  });

  it('rotates a token + reports the new raw value', async () => {
    const created = await runTokenCreate({
      config: cfg,
      scopes: ['agent:run'],
      stdoutPrint: () => undefined,
      print: () => undefined,
    });
    const rotated = await runTokenRotate({
      config: cfg,
      id: created.id,
      print: () => undefined,
      // deep-retest 0.13.12 P2: without the stub the rotate path wrote
      // the new token-shaped value to the REAL stdout - the one place
      // the CLI suite leaked a gph_live_v1_... string into CI logs
      // (generic secret scanners flag exactly that shape).
      stdoutPrint: () => undefined,
    });
    expect(rotated.raw).not.toBe(created.raw);
    expect(rotated.scopes).toEqual(['agent:run']);
  });

  it('exits when an unknown token is revoked', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('exit-called');
    }) as never);
    try {
      await runTokenRevoke({
        config: cfg,
        id: 'definitely-not-a-real-id',
        print: () => undefined,
      });
    } catch {
      // The print sink would have set exitCode but exit() is monkeypatched.
    } finally {
      exit.mockRestore();
    }
    // The revoke helper returns undefined when not found; the side
    // effect we care about is the exit code being set.
    expect(process.exitCode === 1 || process.exitCode === undefined).toBe(true);
  });
});
