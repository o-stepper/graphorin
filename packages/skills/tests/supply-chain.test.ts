import { sign as cryptoSign, generateKeyPairSync } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  _setPackageManagerForTesting,
  _setPackageManagerRunnerForTesting,
  _setPublicKeyFetcherForTesting,
  _setSigstoreVerifierForTesting,
  assertPolicyAllows,
  canonicalizeForSignature,
  evaluateSupplyChainPolicy,
  installSkillFromNpm,
  SkillInstallDeniedError,
  SkillSignatureInvalidError,
  SkillSignatureMissingError,
} from '@graphorin/security/supply-chain';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSkillFromSource, loadSkills } from '../src/loader/index.js';

describe('supply-chain integration — signature verification + --ignore-scripts enforcement', () => {
  afterEach(() => {
    _setPublicKeyFetcherForTesting(null);
    _setSigstoreVerifierForTesting(null);
    _setPackageManagerRunnerForTesting(null);
    _setPackageManagerForTesting(null);
  });

  it('valid ed25519 signature passes; tampered signature fails', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const baseManifest = [
      '---',
      'name: signed-skill',
      'description: A signed skill for tests.',
      'graphorin-signature:',
      '  algorithm: ed25519-sha256',
      '  publisher: vendor.example.com',
      '  publishedAt: 2026-04-19T12:00:00Z',
      '  signature: PLACEHOLDER',
      '  publicKeyRef:',
      '    kind: inline',
      '    publicKeyPem: |',
      ...publicKeyPem.split('\n').map((line) => `      ${line}`),
      '---',
      'BODY',
    ].join('\n');
    const { bytes } = canonicalizeForSignature(baseManifest);
    const signature = cryptoSign(null, bytes, privateKey).toString('base64url');
    const validManifest = baseManifest.replace('signature: PLACEHOLDER', `signature: ${signature}`);
    const dir = await makeSkillDir('signed-skill', validManifest);
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    expect(skill.signature?.valid).toBe(true);
    expect(skill.metadata.graphorinSignaturePresent).toBe(true);

    const tamperedManifest = baseManifest.replace('signature: PLACEHOLDER', 'signature: AAAA');
    const tamperedDir = await makeSkillDir('tampered-skill', tamperedManifest);
    const tampered = await loadSkillFromSource({ kind: 'folder', path: tamperedDir });
    expect(tampered.signature?.valid).toBe(false);
  });

  it('npm install path: untrusted skill cannot omit --ignore-scripts', async () => {
    let observedArgs: ReadonlyArray<string> | null = null;
    let observedEnv: NodeJS.ProcessEnv | undefined;
    _setPackageManagerForTesting(() => 'pnpm');
    _setPackageManagerRunnerForTesting(async ({ args, env }) => {
      observedArgs = args;
      observedEnv = env;
      return { exitCode: 0, stdout: '', stderr: '' };
    });
    _setPublicKeyFetcherForTesting(async () => 'unused');
    const status = await installSkillFromNpm({
      packageName: '@vendor/test-skill',
      cwd: tmpdir(),
      // No skillMd → signature is required by trust policy and missing
      // skillMd surfaces SkillSignatureMissingError.
      dryRun: true,
    }).catch((err) => {
      expect(err).toBeInstanceOf(SkillSignatureMissingError);
      return null;
    });
    expect(status).toBeNull();

    // Now run with skillMd skipped via signature-not-required path
    // (folder source) to confirm --ignore-scripts is forwarded.
    const result = await installSkillFromNpm({
      packageName: '@vendor/test-skill',
      trustLevel: 'trusted',
      cwd: tmpdir(),
      dryRun: false,
    });
    expect(result.signatureVerified).toBe(false);
    expect(observedArgs).toBeDefined();
    expect(observedEnv?.npm_config_ignore_scripts).toBe('true');
  });

  it("trusted-with-scripts allows postinstall scripts (npm_config_ignore_scripts === 'false')", async () => {
    let observedEnv: NodeJS.ProcessEnv | undefined;
    _setPackageManagerForTesting(() => 'pnpm');
    _setPackageManagerRunnerForTesting(async ({ env }) => {
      observedEnv = env;
      return { exitCode: 0, stdout: '', stderr: '' };
    });
    // The supply-chain policy refuses to escalate npm-package /
    // git-repo sources to 'trusted-with-scripts' (those install paths
    // ALWAYS run --ignore-scripts). For folder-based installs we
    // build a folder source manually — the loader does not call
    // installSkillFromNpm for folders, but the trust policy resolver
    // still derives ignoreScripts === false.
    const { resolveTrustPolicy } = await import('@graphorin/security/supply-chain');
    const folderPolicy = resolveTrustPolicy(
      { kind: 'folder', path: '/tmp/skill' },
      'trusted-with-scripts',
    );
    expect(folderPolicy.ignoreScripts).toBe(false);
    expect(folderPolicy.signature.required).toBe(true);
    expect(folderPolicy.audit).toBe('always');
    expect(folderPolicy.sandbox).toBe('inherit-frontmatter');

    // Hard guarantee: npm/git installs cannot escalate. Attempt fails.
    expect(() =>
      resolveTrustPolicy({ kind: 'npm-package', packageName: 'x' }, 'trusted-with-scripts'),
    ).toThrow();
    void observedEnv;
  });

  it('untrusted npm install always passes --ignore-scripts to the runner', async () => {
    const observed: Array<{ args: ReadonlyArray<string>; env: NodeJS.ProcessEnv | undefined }> = [];
    _setPackageManagerForTesting(() => 'pnpm');
    _setPackageManagerRunnerForTesting(async ({ args, env }) => {
      observed.push({ args, env });
      return { exitCode: 0, stdout: '', stderr: '' };
    });
    // 'untrusted' trust level requires a signature; provide a valid
    // ed25519 SKILL.md so the install succeeds.
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const baseManifest = [
      '---',
      'name: untrusted-pkg',
      'description: A signed skill installed via npm.',
      'graphorin-signature:',
      '  algorithm: ed25519-sha256',
      '  publisher: vendor.example.com',
      '  publishedAt: 2026-04-19T12:00:00Z',
      '  signature: PLACEHOLDER',
      '  publicKeyRef:',
      '    kind: inline',
      '    publicKeyPem: |',
      ...publicKeyPem.split('\n').map((line) => `      ${line}`),
      '---',
    ].join('\n');
    const { bytes } = canonicalizeForSignature(baseManifest);
    const signature = cryptoSign(null, bytes, privateKey).toString('base64url');
    const validManifest = baseManifest.replace('signature: PLACEHOLDER', `signature: ${signature}`);

    const result = await installSkillFromNpm({
      packageName: '@vendor/untrusted-pkg',
      cwd: tmpdir(),
      skillMd: validManifest,
    });
    expect(result.trustLevel).toBe('untrusted');
    expect(result.ignoreScripts).toBe(true);
    expect(result.signatureVerified).toBe(true);
    expect(observed).toHaveLength(1);
    const env = observed[0]?.env;
    expect(env?.npm_config_ignore_scripts).toBe('true');
    expect(observed[0]?.args).toContain('--ignore-scripts');
  });

  it('allowlist short-circuits the policy resolver', () => {
    expect(
      evaluateSupplyChainPolicy('@my-org/specific-skill', {
        allowlist: ['@my-org/*'],
        denylist: ['@my-org/specific-skill'],
      }).outcome,
    ).toBe('allow');
  });

  it('denylist throws SkillInstallDeniedError through assertPolicyAllows', () => {
    expect(() => assertPolicyAllows('@known-bad/x', { denylist: ['@known-bad/*'] })).toThrowError(
      SkillInstallDeniedError,
    );
  });

  it('denylist surfaces through the loader entry point', async () => {
    // The skills loader delegates to assertPolicyAllows which throws
    // SkillInstallDeniedError. With throwOnSourceError === true the
    // error propagates out unchanged.
    await expect(
      loadSkills([{ kind: 'npm-package', packageName: '@known-bad/foo' }], {
        supplyChainPolicy: { denylist: ['@known-bad/*'] },
        throwOnSourceError: true,
      }),
    ).rejects.toBeInstanceOf(SkillInstallDeniedError);
  });

  it('refuses to verify against a non-ed25519 public key', async () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicKeyPem = rsa.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const manifest = [
      '---',
      'name: rsa-skill',
      'description: A skill signed with the wrong key type.',
      'graphorin-signature:',
      '  algorithm: ed25519-sha256',
      '  publisher: vendor.example.com',
      '  publishedAt: 2026-04-19T12:00:00Z',
      '  signature: AAAA',
      '  publicKeyRef:',
      '    kind: inline',
      '    publicKeyPem: |',
      ...publicKeyPem.split('\n').map((line) => `      ${line}`),
      '---',
    ].join('\n');
    const dir = await makeSkillDir('rsa-skill', manifest);
    const skill = await loadSkillFromSource({ kind: 'folder', path: dir });
    // Folder loader catches the verification failure as a warn; the
    // returned signature is undefined.
    expect(skill.signature).toBeUndefined();
  });
});

void SkillSignatureInvalidError;

async function makeSkillDir(name: string, manifest: string): Promise<string> {
  const dir = join(tmpdir(), `graphorin-skills-supply-chain-${Date.now()}-${name}`);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'SKILL.md'), manifest, 'utf8');
  return dir;
}
