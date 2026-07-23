/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * CLI-argument regression tests (e2e 2026-07-11, S-03-04-01b + O-02):
 *
 * - a bare run used to exit 1 on the shipped fixture (gate-on=all vs the
 *   intentionally failing abstention case); it must now gate on regressions
 *   against the committed stub baseline and exit 0;
 * - `--help` and unknown flags used to silently run the FULL benchmark with
 *   defaults and overwrite RESULTS.md; they must now print usage / a clear
 *   error without running anything.
 */

import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CliUsageError, main, parseArgs, USAGE } from '../src/runner.js';

describe('benchmarks/longmemeval CLI args', () => {
  it('parses --help and -h without running', () => {
    expect(parseArgs(['node', 'runner.js', '--help']).help).toBe(true);
    expect(parseArgs(['node', 'runner.js', '-h']).help).toBe(true);
    expect(parseArgs(['node', 'runner.js']).help).toBe(false);
  });

  it('rejects unknown flags instead of silently running the benchmark', () => {
    // The O-02 repro: a typoed flag must error, not run with defaults.
    expect(() => parseArgs(['node', 'runner.js', '--judge-provder', 'x'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--no-such-flag'])).toThrow(/--no-such-flag/);
    expect(() => parseArgs(['node', 'runner.js', 'stray'])).toThrow(/argument 'stray'/);
  });

  it('rejects a value-taking flag with no value', () => {
    expect(() => parseArgs(['node', 'runner.js', '--dataset'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--judge-model'])).toThrow(/requires a value/);
  });

  // deep-retest 0.13.12 P2: the subject-leg think override and the
  // per-request timeout were programmatic-only; both must parse (and
  // reject garbage loudly - a typo must never run the full benchmark).
  it('parses --think as a boolean or effort level for the subject leg', () => {
    expect(parseArgs(['node', 'runner.js', '--think', 'false']).think).toBe(false);
    expect(parseArgs(['node', 'runner.js', '--think', 'true']).think).toBe(true);
    expect(parseArgs(['node', 'runner.js', '--think', 'low']).think).toBe('low');
    expect(parseArgs(['node', 'runner.js', '--think', 'medium']).think).toBe('medium');
    expect(parseArgs(['node', 'runner.js', '--think', 'high']).think).toBe('high');
    expect(parseArgs(['node', 'runner.js']).think).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--think', 'nope'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--think'])).toThrow(/requires a value/);
  });

  it('parses --case-timeout-ms as a positive integer', () => {
    expect(parseArgs(['node', 'runner.js', '--case-timeout-ms', '600000']).caseTimeoutMs).toBe(
      600000,
    );
    expect(parseArgs(['node', 'runner.js']).caseTimeoutMs).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--case-timeout-ms', '0'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--case-timeout-ms', 'long'])).toThrow(
      CliUsageError,
    );
  });

  it('parses --num-ctx as a positive integer for the subject leg', () => {
    expect(parseArgs(['node', 'runner.js', '--num-ctx', '40960']).numCtx).toBe(40960);
    expect(parseArgs(['node', 'runner.js']).numCtx).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--num-ctx', '0'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--num-ctx', 'big'])).toThrow(CliUsageError);
  });

  // OpenAI matrix campaign 2026-07-22: multi-hour live runs need a bounded
  // worker pool and reasoning-model output headroom, both CLI-reachable.
  it('parses --concurrency as a positive integer', () => {
    expect(parseArgs(['node', 'runner.js', '--concurrency', '6']).concurrency).toBe(6);
    expect(parseArgs(['node', 'runner.js']).concurrency).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--concurrency', '0'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--concurrency', 'many'])).toThrow(CliUsageError);
  });

  it('parses --max-output-tokens as a positive integer for the subject leg', () => {
    expect(parseArgs(['node', 'runner.js', '--max-output-tokens', '2048']).maxOutputTokens).toBe(
      2048,
    );
    expect(parseArgs(['node', 'runner.js']).maxOutputTokens).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--max-output-tokens', '0'])).toThrow(
      CliUsageError,
    );
    expect(() => parseArgs(['node', 'runner.js', '--max-output-tokens', 'lots'])).toThrow(
      CliUsageError,
    );
  });

  it('parses --subject-tpm as a positive integer (client-side TPM pacing)', () => {
    expect(parseArgs(['node', 'runner.js', '--subject-tpm', '150000']).subjectTpm).toBe(150000);
    expect(parseArgs(['node', 'runner.js']).subjectTpm).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--subject-tpm', '0'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--subject-tpm', 'lots'])).toThrow(CliUsageError);
  });

  it('parses --timeout-ms as a positive integer', () => {
    expect(parseArgs(['node', 'runner.js', '--timeout-ms', '300000']).timeoutMs).toBe(300000);
    expect(parseArgs(['node', 'runner.js']).timeoutMs).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--timeout-ms', '0'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--timeout-ms', '-5'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--timeout-ms', 'soon'])).toThrow(CliUsageError);
  });

  it('documents --think, --timeout-ms and --num-ctx in USAGE', () => {
    expect(USAGE).toContain('--think <mode>');
    expect(USAGE).toContain('--timeout-ms <n>');
    expect(USAGE).toContain('--num-ctx <n>');
    expect(USAGE).toContain('--concurrency <n>');
    expect(USAGE).toContain('--max-output-tokens <n>');
    expect(USAGE).toContain('--subject-tpm <n>');
    expect(USAGE).toContain('OPENAI_API_KEY');
  });

  it('skips the literal -- separator pnpm 10 forwards into argv', () => {
    const args = parseArgs(['node', 'runner.js', '--', '--results', '/tmp/r.md']);
    expect(args.results).toBe('/tmp/r.md');
    expect(args.bareRun).toBe(true);
  });

  it('classifies a run as bare only when nothing but --results/--help is given', () => {
    expect(parseArgs(['node', 'runner.js']).bareRun).toBe(true);
    expect(parseArgs(['node', 'runner.js', '--results', '/tmp/r.md']).bareRun).toBe(true);
    expect(parseArgs(['node', 'runner.js', '--smoke']).bareRun).toBe(false);
    expect(parseArgs(['node', 'runner.js', '--gate-on', 'all']).bareRun).toBe(false);
    expect(parseArgs(['node', 'runner.js', '--json', '/tmp/seed.json']).bareRun).toBe(false);
  });

  it('documents every accepted flag in USAGE', () => {
    const flags = [
      '--dataset',
      '--loader',
      '--variant',
      '--ability',
      '--smoke',
      '--results',
      '--baseline',
      '--json',
      '--top-k',
      '--consolidate',
      '--gate-on',
      '--provider',
      '--model',
      '--base-url',
      '--mode',
      '--judge-provider',
      '--judge-model',
      '--judge-base-url',
      '--allow-self-judge',
      '--retrieval',
      '--embedder',
      '--conflict-pipeline',
      '--max-cost-usd',
      '--allow-unpriced-model',
      '--iterations',
      '--help',
    ];
    for (const flag of flags) {
      expect(USAGE).toContain(flag);
    }
  });

  it('deep-retest 0.13.8 P1: --allow-unpriced-model parses and defaults to fail-closed', () => {
    expect(parseArgs(['node', 'runner.js']).allowUnpricedModel).toBe(false);
    expect(parseArgs(['node', 'runner.js', '--allow-unpriced-model']).allowUnpricedModel).toBe(
      true,
    );
  });

  it('D1: validates --conflict-pipeline and --max-cost-usd values', () => {
    expect(parseArgs(['node', 'runner.js', '--conflict-pipeline', 'on']).conflictPipeline).toBe(
      'on',
    );
    expect(parseArgs(['node', 'runner.js', '--conflict-pipeline', 'off']).conflictPipeline).toBe(
      'off',
    );
    expect(parseArgs(['node', 'runner.js']).conflictPipeline).toBeUndefined();
    expect(() => parseArgs(['node', 'runner.js', '--conflict-pipeline', 'auto'])).toThrow(
      CliUsageError,
    );
    expect(parseArgs(['node', 'runner.js', '--max-cost-usd', '2.5']).maxCostUsd).toBe(2.5);
    expect(() => parseArgs(['node', 'runner.js', '--max-cost-usd', '-1'])).toThrow(CliUsageError);
    expect(() => parseArgs(['node', 'runner.js', '--max-cost-usd', 'free'])).toThrow(CliUsageError);
  });
});

describe('benchmarks/longmemeval main() gate behavior', () => {
  let dir: string;
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'longmemeval-cli-'));
  });

  afterEach(async () => {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it('--help prints usage and does not run the benchmark or write results', async () => {
    const results = join(dir, 'RESULTS.md');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.argv = ['node', 'runner.js', '--help', '--results', results];
    await main();
    expect(process.exitCode ?? 0).toBe(0);
    expect(log).toHaveBeenCalledWith(USAGE);
    expect(existsSync(results)).toBe(false);
  });

  it('an unknown flag exits 1 with a clear error and does not write results', async () => {
    const results = join(dir, 'RESULTS.md');
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.argv = ['node', 'runner.js', '--no-such-flag', '--results', results];
    await main();
    expect(process.exitCode).toBe(1);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("unknown flag '--no-such-flag'"));
    expect(existsSync(results)).toBe(false);
  });

  it('a bare run is a green smoke: regressions-gated against the committed stub baseline', async () => {
    const results = join(dir, 'RESULTS.md');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.argv = ['node', 'runner.js', '--results', results];
    await main();
    // Pre-fix: gate-on=all failed the fixture's known-failing abstention
    // case and set exitCode 1. The bare run must exit 0.
    expect(process.exitCode ?? 0).toBe(0);
    expect(existsSync(results)).toBe(true);
  });

  it('an explicit --gate-on all keeps the strict gate (fixture fails by design)', async () => {
    const results = join(dir, 'RESULTS.md');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    process.argv = ['node', 'runner.js', '--gate-on', 'all', '--results', results];
    await main();
    expect(process.exitCode).toBe(1);
  });
});
