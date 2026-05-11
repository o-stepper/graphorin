/**
 * `graphorin skills` — install + audit + migrate operator-managed
 * skill packages.
 *
 * Surface (per Phase 15 § Skills):
 *
 *  - `graphorin skills install <source>` — `npm:` or `git:` source.
 *    Honours allowlist / denylist + signature verification (DEC-140 /
 *    ADR-034). Refuses when `GRAPHORIN_OFFLINE=1` is set.
 *  - `graphorin skills inspect <name>` — frontmatter + signature +
 *    supply-chain status of an installed skill.
 *  - `graphorin skills audit` — full audit of every recorded
 *    installation.
 *  - `graphorin skills migrate-frontmatter [--apply] [--recursive]`
 *    — DEC-156: rewrites legacy `graphorin-*` frontmatter fields onto
 *    their upstream equivalents.
 *
 * @packageDocumentation
 */

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

import {
  auditInstalledSkills,
  type InstallSkillFromGitOptions,
  type InstallSkillFromNpmOptions,
  installSkillFromGit,
  installSkillFromNpm,
  type SkillInstallationStatus,
} from '@graphorin/security';
import { loadSkills, type MigrationResult, migrateFrontmatter } from '@graphorin/skills';

import { EXIT_CODES } from '../internal/exit.js';
import { checkOfflineModeBlocked } from '../internal/offline.js';
import {
  brand,
  type CommonOutputOptions,
  defaultPrintSink,
  emitReport,
  statusMarker,
} from '../internal/output.js';

/** @stable */
export interface SkillsCommonOptions extends CommonOutputOptions {}

/** @stable */
export type SkillTrustLevelInput = 'trusted' | 'trusted-with-scripts' | 'untrusted';

/** @stable */
export interface SkillsInstallOptions extends SkillsCommonOptions {
  /** `npm:<name>[@version]` or `git:<url>` source. */
  readonly source: string;
  /** Optional explicit version pin (npm sources only). */
  readonly version?: string;
  /** Optional git ref (git sources only). */
  readonly ref?: string;
  /** Trust level for the operator's project. Defaults to the helper's own default. */
  readonly trustLevel?: SkillTrustLevelInput;
  /** Working directory for npm installs. */
  readonly cwd?: string;
  readonly dryRun?: boolean;
}

/** @stable */
export async function runSkillsInstall(
  options: SkillsInstallOptions,
): Promise<SkillInstallationStatus> {
  if (
    !checkOfflineModeBlocked('skills install', {
      ...(options.print !== undefined ? { print: options.print } : {}),
    })
  ) {
    process.exit(EXIT_CODES.RECOVERABLE_FAILURE);
  }
  const print = options.print ?? defaultPrintSink;
  const parsed = parseSource(options.source);
  let result: SkillInstallationStatus;
  if (parsed.kind === 'npm') {
    const installOpts: InstallSkillFromNpmOptions = {
      packageName: parsed.value,
      ...(options.version !== undefined ? { version: options.version } : {}),
      ...(options.trustLevel !== undefined ? { trustLevel: options.trustLevel } : {}),
      ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
      ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
    };
    result = await installSkillFromNpm(installOpts);
  } else {
    const installOpts: InstallSkillFromGitOptions = {
      repoUrl: parsed.value,
      ...(options.ref !== undefined ? { ref: options.ref } : {}),
      ...(options.trustLevel !== undefined ? { trustLevel: options.trustLevel } : {}),
      ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
    };
    result = await installSkillFromGit(installOpts);
  }
  emitReport(options, result, () => {
    print(
      brand(
        `installed skill '${result.id}' (${result.source.kind}, signatureVerified=${result.signatureVerified})`,
      ),
    );
    if (result.signature !== undefined) {
      print(`  signature valid: ${result.signature.valid}`);
    }
  });
  return result;
}

/** @stable */
export interface SkillsInspectOptions extends SkillsCommonOptions {
  readonly name: string;
}

/** @stable */
export async function runSkillsInspect(
  options: SkillsInspectOptions,
): Promise<SkillInstallationStatus | null> {
  const all = auditInstalledSkills();
  const match = all.find((s) => s.id === options.name) ?? null;
  emitReport(options, match, () => {
    const print = options.print ?? defaultPrintSink;
    if (match === null) {
      print(brand(`skill '${options.name}' not found in this process registry.`));
      process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
      return;
    }
    print(brand(`skill ${match.id}`));
    print(`  source: ${match.source.kind}`);
    print(`  trust level: ${match.trustLevel}`);
    print(`  ignoreScripts: ${match.ignoreScripts}`);
    print(`  signatureVerified: ${match.signatureVerified}`);
    print(`  installedAt: ${new Date(match.installedAt).toISOString()}`);
    if (match.installPath !== undefined) print(`  installPath: ${match.installPath}`);
    if (match.publisher !== undefined) print(`  publisher: ${match.publisher}`);
  });
  return match;
}

/** @stable */
export interface SkillsAuditOptions extends SkillsCommonOptions {}

/** @stable */
export function runSkillsAudit(options: SkillsAuditOptions = {}) {
  const all = auditInstalledSkills();
  emitReport(options, all, () => {
    const print = options.print ?? defaultPrintSink;
    if (all.length === 0) {
      print(brand('no skills installed in this process registry.'));
      return;
    }
    print(brand(`${all.length} installed skill(s):`));
    for (const s of all) {
      const mark = s.signatureVerified ? statusMarker('ok') : statusMarker('warn');
      print(
        `  ${mark} ${s.id} (${s.source.kind}, trust=${s.trustLevel}, signatureVerified=${s.signatureVerified})`,
      );
    }
  });
  return all;
}

/** @stable */
export interface SkillsMigrateFrontmatterOptions extends SkillsCommonOptions {
  /** Directory to walk. Defaults to `process.cwd()`. */
  readonly path?: string;
  readonly recursive?: boolean;
  readonly apply?: boolean;
}

/** @stable */
export interface SkillsMigrateFrontmatterResult {
  readonly directory: string;
  readonly visited: number;
  readonly migrated: ReadonlyArray<{
    readonly file: string;
    readonly result: MigrationResult;
  }>;
  readonly applied: boolean;
}

/** @stable */
export async function runSkillsMigrateFrontmatter(
  options: SkillsMigrateFrontmatterOptions = {},
): Promise<SkillsMigrateFrontmatterResult> {
  const root = resolve(options.path ?? process.cwd());
  const recursive = options.recursive === true;
  const apply = options.apply === true;
  const files = await collectSkillMd(root, recursive);
  const migrated: Array<{ file: string; result: MigrationResult }> = [];
  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    let result: MigrationResult;
    try {
      result = migrateFrontmatter(raw, { apply, skillId: file });
    } catch {
      continue;
    }
    if (result.changed) {
      if (apply) {
        await writeFile(file, result.migratedSkillMd, { mode: 0o600 });
      }
      migrated.push({ file, result });
    }
  }
  const out: SkillsMigrateFrontmatterResult = Object.freeze({
    directory: root,
    visited: files.length,
    migrated: Object.freeze(migrated),
    applied: apply,
  });
  emitReport(options, out, () => {
    const print = options.print ?? defaultPrintSink;
    print(
      brand(`migrate-frontmatter visited ${out.visited} SKILL.md file(s) under ${out.directory}.`),
    );
    if (out.migrated.length === 0) {
      print(brand('no rewrites required.'));
      return;
    }
    print(
      brand(
        `${out.migrated.length} file(s) ${apply ? 'rewritten' : 'would be rewritten (dry-run)'}:`,
      ),
    );
    for (const m of out.migrated) print(`  - ${m.file}`);
  });
  return out;
}

function parseSource(input: string): { readonly kind: 'npm' | 'git'; readonly value: string } {
  if (input.startsWith('npm:')) return { kind: 'npm', value: input.slice(4) };
  if (input.startsWith('git:')) return { kind: 'git', value: input.slice(4) };
  if (input.includes('://')) return { kind: 'git', value: input };
  return { kind: 'npm', value: input };
}

async function collectSkillMd(root: string, recursive: boolean): Promise<string[]> {
  const out: string[] = [];
  await walk(root, recursive, out);
  return out;
}

async function walk(dir: string, recursive: boolean, acc: string[]): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const full = join(dir, name);
    let s: import('node:fs').Stats;
    try {
      s = await stat(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      if (recursive) await walk(full, recursive, acc);
    } else if (name === 'SKILL.md') {
      acc.push(full);
    }
  }
}

// Touch the loader once so the import is preserved (downstream callers
// that want to re-load the migrated skill consume `loadSkills(...)`).
void loadSkills;
