import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setPackageManagerForTesting,
  _setPackageManagerRunnerForTesting,
  buildInstallInvocation,
  detectPackageManager,
  runPackageManager,
} from '../../src/supply-chain/index.js';

describe('@graphorin/security/supply-chain — package manager helpers', () => {
  beforeEach(() => {
    _setPackageManagerForTesting(null);
    _setPackageManagerRunnerForTesting(null);
  });
  afterEach(() => {
    _setPackageManagerForTesting(null);
    _setPackageManagerRunnerForTesting(null);
  });

  it('detectPackageManager honours the override', () => {
    _setPackageManagerForTesting(() => 'yarn');
    expect(detectPackageManager()).toBe('yarn');
  });

  it('detectPackageManager falls back to npm when nothing is on PATH', () => {
    expect(detectPackageManager({ PATH: '/nonexistent/path' })).toBe('npm');
  });

  it('runPackageManager forwards to the injected runner', async () => {
    let captured: { command: string; args: ReadonlyArray<string> } | undefined;
    _setPackageManagerRunnerForTesting(async (args) => {
      captured = { command: args.command, args: args.args };
      return { exitCode: 0, stdout: 'ok', stderr: '' };
    });
    const result = await runPackageManager({ command: 'pnpm', args: ['add', 'pkg'] });
    expect(result.exitCode).toBe(0);
    expect(captured?.command).toBe('pnpm');
    expect(captured?.args).toEqual(['add', 'pkg']);
  });

  it('buildInstallInvocation preserves --ignore-scripts', () => {
    expect(
      buildInstallInvocation({ manager: 'pnpm', packageSpec: 'p', ignoreScripts: true }).args,
    ).toContain('--ignore-scripts');
    expect(
      buildInstallInvocation({ manager: 'npm', packageSpec: 'p', ignoreScripts: true }).args,
    ).toContain('--ignore-scripts');
  });

  it('buildInstallInvocation rejects unsupported managers', () => {
    expect(() =>
      buildInstallInvocation({
        manager: 'foo' as never,
        packageSpec: 'p',
        ignoreScripts: false,
      }),
    ).toThrow(/Unsupported package manager/u);
  });
});
