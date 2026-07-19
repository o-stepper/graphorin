/**
 * Skill installer surface. Wraps the package-manager runner with the
 * trust-policy resolver, the deny / allow list resolver, and the
 * signature-verification step so callers only need a single entry
 * point.
 *
 * Two transports are supported:
 *
 * - {@link installSkillFromNpm} - `pnpm add` / `npm install` /
 *   `yarn add` with `--ignore-scripts` enforcement.
 * - {@link installSkillFromGit} - shallow clone into the OS temp
 *   directory; identical trust-policy resolution.
 *
 * @packageDocumentation
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
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
import { type SkillTrustRoot, verifySkillSignature } from './signature.js';
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
  /**
   * Operator trust root threaded into signature
   * verification: a valid signature from a key not in the root is
   * rejected. See {@link SkillTrustRoot}.
   */
  readonly trustRoot?: SkillTrustRoot;
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
  // RP-10: the install path is a quarantine directory we own when the caller
  // did not pin a `cwd`. On a verification failure we remove it so a rejected
  // (unsigned / tampered) package leaves nothing on disk.
  const createdCwd = options.cwd === undefined;
  const cwd = options.cwd ?? mkdtempSync(join(tmpdir(), 'graphorin-skills-'));
  const skillId = `skill:${options.packageName}@${options.version ?? 'latest'}`;

  // RP-10: install FIRST, then verify the signature against the SKILL.md that
  // landed in the install path. The pre-install verification used to throw
  // `SkillSignatureMissingError` before anything was downloaded, so the
  // default (untrusted) load was impossible without a pre-fetched `skillMd`.
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
      if (createdCwd) safeRemoveDir(cwd);
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

  const signature = await verifyAfterInstall({
    skillId,
    trust,
    ...(options.trustRoot !== undefined ? { trustRoot: options.trustRoot } : {}),
    resolveSkillMd: () =>
      resolveInstalledSkillMd(options.skillMd, options.dryRun === true, cwd, source, {
        packageName: options.packageName,
      }),
    onReject: () => {
      if (createdCwd) safeRemoveDir(cwd);
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
          signatureRejected: true,
        },
      });
    },
  });

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
  /** Operator trust root. See {@link SkillTrustRoot}. */
  readonly trustRoot?: SkillTrustRoot;
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
  // RP-10: the shallow clone always lands in a quarantine directory we own,
  // so a rejected (unsigned / tampered) repo is removed on failure.
  const dest = mkdtempSync(join(tmpdir(), 'graphorin-skills-git-'));
  const skillId = `skill:${options.repoUrl}@${options.ref ?? 'HEAD'}`;

  // RP-10: clone FIRST, then verify against the cloned SKILL.md.
  if (options.dryRun !== true) {
    const args = ['clone', '--depth=1'];
    if (options.ref !== undefined) args.push('--branch', options.ref);
    args.push(options.repoUrl, dest);
    const result = await spawnGit(args, options.signal);
    if (result.exitCode !== 0) {
      safeRemoveDir(dest);
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

  const signature = await verifyAfterInstall({
    skillId,
    trust,
    ...(options.trustRoot !== undefined ? { trustRoot: options.trustRoot } : {}),
    resolveSkillMd: () =>
      resolveInstalledSkillMd(options.skillMd, options.dryRun === true, dest, source, {}),
    onReject: () => {
      safeRemoveDir(dest);
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
          signatureRejected: true,
        },
      });
    },
  });

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

/**
 * Verify the signature of an already-installed skill (install-then-
 * verify). The `resolveSkillMd` thunk is only invoked when the trust policy
 * requires a signature, so a softer policy never touches the install path.
 * On a rejection (missing / tampered signature under a strict policy) the
 * `onReject` hook fires - used to remove the quarantine directory + emit an
 * error audit - before the typed exception propagates to the caller.
 */
async function verifyAfterInstall(args: {
  skillId: string;
  trust: ReturnType<typeof resolveTrustPolicy>;
  resolveSkillMd: () => string | undefined;
  onReject: () => void;
  trustRoot?: SkillTrustRoot;
}): Promise<SkillSignatureVerificationResult | undefined> {
  const { skillId, trust, resolveSkillMd, onReject, trustRoot } = args;
  if (!trust.signature.required) return undefined;
  const skillMd = resolveSkillMd();
  if (skillMd === undefined) {
    if (trust.signature.rejectIfMissing) {
      onReject();
      throw new SkillSignatureMissingError(skillId);
    }
    return undefined;
  }
  // `verifySkillSignature` throws (e.g. `SkillSignatureMissingError` for a
  // manifest with no `graphorin-signature` block) rather than always
  // returning a `valid: false` shape, so the cleanup hook must fire on a
  // throw too - otherwise a rejected package would leave the quarantine dir
  // behind.
  let result: SkillSignatureVerificationResult;
  try {
    result = await verifySkillSignature({
      skillMd,
      ...(trustRoot !== undefined ? { trustRoot } : {}),
    });
  } catch (err) {
    onReject();
    throw err;
  }
  // When the operator-resolved trust policy mandates rejection on a
  // failed signature, surface the rejection through the typed
  // exception so callers can branch on `instanceof
  // SkillSignatureInvalidError`. The `valid: false` shape is reserved
  // for callers that opt into a softer policy by passing a trust
  // level that does not require signature verification (none in v0.1
  // - kept here for forward-compatibility).
  if (!result.valid && trust.signature.rejectIfMissing) {
    onReject();
    throw new SkillSignatureInvalidError(
      skillId,
      result.reason ?? 'ed25519 verification failed',
      result.publisher,
    );
  }
  return result;
}

const SKILL_MANIFEST_FILENAME = 'SKILL.md';

/**
 * Resolve the SKILL.md used for signature verification. A caller-
 * supplied `provided` value (offline / pre-fetch) wins; otherwise - and only
 * for a real install - the manifest is read from the install path. In
 * `dryRun` mode nothing was installed, so there is nothing to read.
 */
function resolveInstalledSkillMd(
  provided: string | undefined,
  dryRun: boolean,
  installPath: string,
  source: SkillSource,
  ctx: { packageName?: string },
): string | undefined {
  if (provided !== undefined) return provided;
  if (dryRun) return undefined;
  return readInstalledManifest(installPath, source, ctx.packageName);
}

/**
 * Best-effort search for SKILL.md inside a freshly installed package. Probes
 * the install root, the npm `node_modules/<packageName>` layout, and one
 * directory deep (covering git clones with a nested skill folder).
 */
function readInstalledManifest(
  installPath: string,
  source: SkillSource,
  packageName: string | undefined,
): string | undefined {
  const candidates: string[] = [join(installPath, SKILL_MANIFEST_FILENAME)];
  if (source.kind === 'npm-package' && packageName !== undefined) {
    candidates.push(join(installPath, 'node_modules', packageName, SKILL_MANIFEST_FILENAME));
  }
  for (const candidate of candidates) {
    const content = tryReadFile(candidate);
    if (content !== undefined) return content;
  }
  try {
    for (const entry of readdirSync(installPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const content = tryReadFile(join(installPath, entry.name, SKILL_MANIFEST_FILENAME));
        if (content !== undefined) return content;
      }
    }
  } catch {
    // Install path unreadable - treat as no manifest.
  }
  return undefined;
}

function tryReadFile(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
}

function safeRemoveDir(path: string): void {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup - a leftover quarantine dir is not worth failing on.
  }
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
