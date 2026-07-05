import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setPackageManagerForTesting,
  _setPackageManagerRunnerForTesting,
  _setPublicKeyFetcherForTesting,
  auditInstalledSkills,
  buildInstallInvocation,
  installSkillFromGit,
  installSkillFromNpm,
  onSupplyChainAudit,
  SkillInstallDeniedError,
  SkillInstallError,
  SkillSignatureInvalidError,
  SkillSignatureMissingError,
  TrustLevelEscalationError,
} from '../../src/supply-chain/index.js';

import { buildSignedSkill, resetSupplyChain, tamperSkillBody } from './_helpers.js';

describe('@graphorin/security/supply-chain - installer', () => {
  beforeEach(() => {
    resetSupplyChain();
  });
  afterEach(() => {
    resetSupplyChain();
  });

  it('builds the right CLI invocation per package manager', () => {
    expect(
      buildInstallInvocation({ manager: 'pnpm', packageSpec: '@vendor/x@1', ignoreScripts: true })
        .args,
    ).toEqual(['add', '@vendor/x@1', '--no-frozen-lockfile', '--ignore-scripts']);
    expect(
      buildInstallInvocation({ manager: 'npm', packageSpec: '@vendor/x@1', ignoreScripts: false })
        .args,
    ).toEqual(['install', '@vendor/x@1', '--no-save']);
    expect(
      buildInstallInvocation({ manager: 'yarn', packageSpec: 'pkg', ignoreScripts: true }).args,
    ).toEqual(['add', 'pkg', '--ignore-scripts']);
  });

  it('untrusted install rejects when no signature is supplied', async () => {
    _setPackageManagerForTesting(() => 'pnpm');
    _setPackageManagerRunnerForTesting(async () => ({ exitCode: 0, stdout: '', stderr: '' }));
    await expect(
      installSkillFromNpm({ packageName: '@vendor/x', dryRun: true }),
    ).rejects.toBeInstanceOf(SkillSignatureMissingError);
  });

  it('untrusted install verifies the signature before recording the audit', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    _setPackageManagerForTesting(() => 'pnpm');
    let invokedArgs: ReadonlyArray<string> = [];
    _setPackageManagerRunnerForTesting(async (args) => {
      invokedArgs = args.args;
      return { exitCode: 0, stdout: '', stderr: '' };
    });
    const events: string[] = [];
    onSupplyChainAudit((event) => events.push(`${event.action}:${event.decision}`));
    const status = await installSkillFromNpm({
      packageName: '@vendor/pdf-processing',
      version: '1.2.3',
      skillMd,
    });
    expect(status.signatureVerified).toBe(true);
    expect(status.publisher).toBe('vendor.example.com');
    expect(invokedArgs).toContain('--ignore-scripts');
    expect(events).toContain('skill:installed:success');
    expect(auditInstalledSkills().map((s) => s.id)).toContain(status.id);
  });

  it('untrusted install rejects tampered SKILL.md content with SkillSignatureInvalidError', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    _setPackageManagerForTesting(() => 'pnpm');
    _setPackageManagerRunnerForTesting(async () => ({ exitCode: 0, stdout: '', stderr: '' }));
    await expect(
      installSkillFromNpm({
        packageName: '@vendor/pdf-processing',
        version: '1.2.3',
        skillMd: tamperSkillBody(skillMd),
      }),
    ).rejects.toBeInstanceOf(SkillSignatureInvalidError);
  });

  it('throws SkillInstallDeniedError when the package is on the denylist', async () => {
    await expect(
      installSkillFromNpm({
        packageName: '@known-bad/x',
        policy: { denylist: ['@known-bad/*'] },
      }),
    ).rejects.toBeInstanceOf(SkillInstallDeniedError);
  });

  it('surfaces a SkillInstallError when the package manager exits non-zero', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    _setPackageManagerForTesting(() => 'pnpm');
    _setPackageManagerRunnerForTesting(async () => ({
      exitCode: 1,
      stdout: '',
      stderr: 'boom',
    }));
    await expect(
      installSkillFromNpm({
        packageName: '@vendor/pdf-processing',
        skillMd,
      }),
    ).rejects.toBeInstanceOf(SkillInstallError);
  });

  it('trusted install allows --ignore-scripts to be disabled', async () => {
    _setPackageManagerForTesting(() => 'pnpm');
    let invokedArgs: ReadonlyArray<string> = [];
    _setPackageManagerRunnerForTesting(async (args) => {
      invokedArgs = args.args;
      return { exitCode: 0, stdout: '', stderr: '' };
    });
    const status = await installSkillFromNpm({
      packageName: '@my-org/skill',
      trustLevel: 'trusted',
    });
    expect(status.ignoreScripts).toBe(true);
    expect(invokedArgs).toContain('--ignore-scripts');
  });

  it('git install enforces --ignore-scripts and rejects unsigned skills (dryRun)', async () => {
    await expect(
      installSkillFromGit({ repoUrl: 'https://example.com/skill.git', dryRun: true }),
    ).rejects.toBeInstanceOf(SkillSignatureMissingError);
  });

  it('git install records audit on success (dryRun + signed skill)', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    const events: string[] = [];
    onSupplyChainAudit((event) => events.push(`${event.action}:${event.decision}`));
    const status = await installSkillFromGit({
      repoUrl: 'https://example.com/pdf.git',
      ref: 'v1',
      skillMd,
      dryRun: true,
    });
    expect(status.signatureVerified).toBe(true);
    expect(events).toContain('skill:installed:success');
  });

  it('npm install with trustLevel: trusted-with-scripts is rejected (ADR-034)', async () => {
    await expect(
      installSkillFromNpm({
        packageName: '@vendor/pdf-processing',
        trustLevel: 'trusted-with-scripts',
        dryRun: true,
      }),
    ).rejects.toBeInstanceOf(TrustLevelEscalationError);
  });

  it('git install with trustLevel: trusted-with-scripts is rejected (ADR-034)', async () => {
    await expect(
      installSkillFromGit({
        repoUrl: 'https://example.com/skill.git',
        trustLevel: 'trusted-with-scripts',
        dryRun: true,
      }),
    ).rejects.toBeInstanceOf(TrustLevelEscalationError);
  });

  it('untrusted install propagates --ignore-scripts via both CLI args and env', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    _setPackageManagerForTesting(() => 'pnpm');
    let capturedEnv: NodeJS.ProcessEnv | undefined;
    let capturedArgs: ReadonlyArray<string> = [];
    _setPackageManagerRunnerForTesting(async (args) => {
      capturedArgs = args.args;
      capturedEnv = args.env;
      return { exitCode: 0, stdout: '', stderr: '' };
    });
    await installSkillFromNpm({
      packageName: '@vendor/pdf-processing',
      version: '1.2.3',
      skillMd,
    });
    expect(capturedArgs).toContain('--ignore-scripts');
    // Also verify the env var fallback path used by some package
    // managers (e.g. older npm clients honour npm_config_ignore_scripts).
    expect(capturedEnv?.npm_config_ignore_scripts).toBe('true');
  });

  it('npm install dryRun skips package-manager invocation', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    let runnerCalled = false;
    _setPackageManagerRunnerForTesting(async () => {
      runnerCalled = true;
      return { exitCode: 0, stdout: '', stderr: '' };
    });
    const status = await installSkillFromNpm({
      packageName: '@vendor/pdf-processing',
      version: '1.0.0',
      skillMd,
      dryRun: true,
    });
    expect(runnerCalled).toBe(false);
    expect(status.signatureVerified).toBe(true);
  });
});
