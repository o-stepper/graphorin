/**
 * Skill installer surface. Wraps the package-manager runner with the
 * trust-policy resolver, the deny / allow list resolver, and the
 * signature-verification step so callers only need a single entry
 * point.
 *
 * Two transports are supported:
 *
 * - {@link installSkillFromNpm} — `pnpm add` / `npm install` /
 *   `yarn add` with `--ignore-scripts` enforcement.
 * - {@link installSkillFromGit} — shallow clone into the OS temp
 *   directory; identical trust-policy resolution.
 *
 * @packageDocumentation
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recordInstallation } from './audit.js';
import { emitSupplyChainAudit, type SupplyChainAuditActor } from './audit-emitter.js';
import {
  SkillInstallError,
  SkillSignatureInvalidError,
  SkillSignatureMissingError,
} from './errors.js';
import {
  buildInstallInvocation,
  detectPackageManager,
  runPackageManager,
} from './package-manager.js';
import { assertPolicyAllows, resolveTrustPolicy } from './policy.js';
import { verifySkillSignature } from './signature.js';
import type {
  SkillInstallationStatus,
  SkillSignatureVerificationResult,
  SkillSource,
  SkillTrustLevel,
  SupplyChainPolicy,
} from './types.js';

/**
 * Options accepted by {@link installSkillFromNpm}.
 *
 * @stable
 */
export interface InstallSkillFromNpmOptions {
  readonly packageName: string;
  readonly version?: string;
  readonly trustLevel?: SkillTrustLevel;
  readonly policy?: SupplyChainPolicy;
  /** Where to install the package. Defaults to a fresh temp dir. */
  readonly cwd?: string;
  /** Forwarded to the package-manager runner. */
  readonly env?: NodeJS.ProcessEnv;
  /** Cancellation. */
  readonly signal?: AbortSignal;
  /** Skip the actual install; runs the policy + audit pipeline only. */
  readonly dryRun?: boolean;
  /** Optional pre-fetched SKILL.md content for offline verification. */
  readonly skillMd?: string;
  /** Override actor recorded in the audit event. */
  readonly actor?: SupplyChainAuditActor;
}

/**
 * Install a skill from the npm registry.
 *
 * @stable
 */
export async function installSkillFromNpm(
  options: InstallSkillFromNpmOptions,
): Promise<SkillInstallationStatus> {
  const source: SkillSource =
    options.version === undefined
      ? { kind: 'npm-package', packageName: options.packageName }
      : { kind: 'npm-package', packageName: options.packageName, version: options.version };
  assertPolicyAllows(options.packageName, options.policy ?? {});
  const trust = resolveTrustPolicy(source, options.trustLevel);
  const cwd = options.cwd ?? mkdtempSync(join(tmpdir(), 'graphorin-skills-'));
  const skillId = `skill:${options.packageName}@${options.version ?? 'latest'}`;

  const signature = await maybeVerifySignature(skillId, trust, options.skillMd);

  if (options.dryRun !== true) {
    const manager = detectPackageManager(options.env);
    const spec =
      options.version === undefined
        ? options.packageName
        : `${options.packageName}@${options.version}`;
    const invocation = buildInstallInvocation({
      manager,
      packageSpec: spec,
      ignoreScripts: trust.ignoreScripts,
    });
    const runArgs: {
      command: string;
      args: ReadonlyArray<string>;
      cwd?: string;
      env?: NodeJS.ProcessEnv;
      signal?: AbortSignal;
    } = {
      command: invocation.command,
      args: invocation.args,
      cwd,
      env: {
        ...(options.env ?? process.env),
        npm_config_ignore_scripts: trust.ignoreScripts ? 'true' : 'false',
      },
    };
    if (options.signal !== undefined) runArgs.signal = options.signal;
    const result = await runPackageManager(runArgs);
    if (result.exitCode !== 0) {
      emitSupplyChainAudit({
        action: 'skill:installed',
        decision: 'error',
        ts: Date.now(),
        source: 'skills-supply-chain',
        target: skillId,
        ...(options.actor === undefined ? {} : { actor: options.actor }),
        metadata: {
          source: 'npm',
          trustLevel: trust.level,
          ignoreScripts: trust.ignoreScripts,
          exitCode: result.exitCode,
        },
      });
      throw new SkillInstallError(skillId, `Package manager exited with code ${result.exitCode}.`, {
        exitCode: result.exitCode,
        stderr: result.stderr,
      });
    }
  }

  const status: SkillInstallationStatus = Object.freeze({
    id: skillId,
    source,
    trustLevel: trust.level,
    ignoreScripts: trust.ignoreScripts,
    signatureVerified: signature?.valid === true,
    ...(signature === undefined ? {} : { signature }),
    installedAt: Date.now(),
    ...(options.version === undefined ? {} : { version: options.version }),
    installPath: cwd,
    ...(signature?.publisher === undefined ? {} : { publisher: signature.publisher }),
  });
  recordInstallation(status);
  emitSupplyChainAudit({
    action: 'skill:installed',
    decision: 'success',
    ts: Date.now(),
    source: 'skills-supply-chain',
    target: skillId,
    ...(options.actor === undefined ? {} : { actor: options.actor }),
    metadata: buildAuditMetadata(status),
  });
  return status;
}

/**
 * Options accepted by {@link installSkillFromGit}.
 *
 * @stable
 */
export interface InstallSkillFromGitOptions {
  readonly repoUrl: string;
  readonly ref?: string;
  readonly trustLevel?: SkillTrustLevel;
  readonly policy?: SupplyChainPolicy;
  /** Cancellation. */
  readonly signal?: AbortSignal;
  /** Skip the clone; runs the policy + audit pipeline only. */
  readonly dryRun?: boolean;
  /** Optional pre-fetched SKILL.md content for offline verification. */
  readonly skillMd?: string;
  readonly actor?: SupplyChainAuditActor;
}

/**
 * Install a skill from a git repository (shallow clone). The
 * resulting clone lives in the OS temp directory; consumers are
 * responsible for cleanup.
 *
 * @stable
 */
export async function installSkillFromGit(
  options: InstallSkillFromGitOptions,
): Promise<SkillInstallationStatus> {
  const source: SkillSource =
    options.ref === undefined
      ? { kind: 'git-repo', url: options.repoUrl }
      : { kind: 'git-repo', url: options.repoUrl, ref: options.ref };
  assertPolicyAllows(options.repoUrl, options.policy ?? {});
  const trust = resolveTrustPolicy(source, options.trustLevel);
  const dest = mkdtempSync(join(tmpdir(), 'graphorin-skills-git-'));
  const skillId = `skill:${options.repoUrl}@${options.ref ?? 'HEAD'}`;
  const signature = await maybeVerifySignature(skillId, trust, options.skillMd);

  if (options.dryRun !== true) {
    const args = ['clone', '--depth=1'];
    if (options.ref !== undefined) args.push('--branch', options.ref);
    args.push(options.repoUrl, dest);
    const result = await spawnGit(args, options.signal);
    if (result.exitCode !== 0) {
      emitSupplyChainAudit({
        action: 'skill:installed',
        decision: 'error',
        ts: Date.now(),
        source: 'skills-supply-chain',
        target: skillId,
        ...(options.actor === undefined ? {} : { actor: options.actor }),
        metadata: {
          source: 'git',
          trustLevel: trust.level,
          ignoreScripts: trust.ignoreScripts,
          exitCode: result.exitCode,
        },
      });
      throw new SkillInstallError(skillId, `git clone exited with code ${result.exitCode}.`, {
        exitCode: result.exitCode,
        stderr: result.stderr,
      });
    }
  }

  const status: SkillInstallationStatus = Object.freeze({
    id: skillId,
    source,
    trustLevel: trust.level,
    ignoreScripts: trust.ignoreScripts,
    signatureVerified: signature?.valid === true,
    ...(signature === undefined ? {} : { signature }),
    installedAt: Date.now(),
    installPath: dest,
    ...(signature?.publisher === undefined ? {} : { publisher: signature.publisher }),
  });
  recordInstallation(status);
  emitSupplyChainAudit({
    action: 'skill:installed',
    decision: 'success',
    ts: Date.now(),
    source: 'skills-supply-chain',
    target: skillId,
    ...(options.actor === undefined ? {} : { actor: options.actor }),
    metadata: buildAuditMetadata(status),
  });
  return status;
}

async function maybeVerifySignature(
  skillId: string,
  trust: ReturnType<typeof resolveTrustPolicy>,
  skillMd: string | undefined,
): Promise<SkillSignatureVerificationResult | undefined> {
  if (!trust.signature.required) return undefined;
  if (skillMd === undefined) {
    if (trust.signature.rejectIfMissing) {
      throw new SkillSignatureMissingError(skillId);
    }
    return undefined;
  }
  const result = await verifySkillSignature({ skillMd });
  // When the operator-resolved trust policy mandates rejection on a
  // failed signature, surface the rejection through the typed
  // exception so callers can branch on `instanceof
  // SkillSignatureInvalidError`. The `valid: false` shape is reserved
  // for callers that opt into a softer policy by passing a trust
  // level that does not require signature verification (none in v0.1
  // — kept here for forward-compatibility).
  if (!result.valid && trust.signature.rejectIfMissing) {
    throw new SkillSignatureInvalidError(
      skillId,
      result.reason ?? 'ed25519 verification failed',
      result.publisher,
    );
  }
  return result;
}

function buildAuditMetadata(status: SkillInstallationStatus): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    source: status.source.kind === 'npm-package' ? 'npm' : status.source.kind,
    trustLevel: status.trustLevel,
    ignoreScripts: status.ignoreScripts,
    signatureVerified: status.signatureVerified,
  };
  if (status.signature !== undefined) {
    metadata.signatureAlgorithm = 'ed25519-sha256';
    metadata.publisher = status.signature.publisher;
    metadata.publicKeySource = status.signature.publicKeySource;
  }
  if (status.version !== undefined) metadata.version = status.version;
  return metadata;
}

interface GitResult {
  readonly exitCode: number;
  readonly stderr: string;
}

async function spawnGit(args: ReadonlyArray<string>, signal?: AbortSignal): Promise<GitResult> {
  return new Promise<GitResult>((resolve, reject) => {
    const child = spawn('git', [...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    const stderrChunks: Buffer[] = [];
    child.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    const onAbort = (): void => {
      child.kill('SIGTERM');
    };
    if (signal !== undefined) signal.addEventListener('abort', onAbort, { once: true });
    child.once('error', (err) => {
      if (signal !== undefined) signal.removeEventListener('abort', onAbort);
      reject(err);
    });
    child.once('close', (code) => {
      if (signal !== undefined) signal.removeEventListener('abort', onAbort);
      resolve({
        exitCode: code ?? 0,
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      });
    });
  });
}

void readFileSync;
