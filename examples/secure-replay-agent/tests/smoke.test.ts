/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Smoke coverage for `examples/secure-replay-agent`. Exercises every
 * stage against the hand-rolled scripted stub provider (no API keys, no
 * daemon, no network):
 *
 * - the CLI entry exits 0 and prints the `secure-replay-agent: OK` line
 *   plus a line containing the `sink blocked` substring;
 * - dataFlowPolicy shadow mode allows the sink but audits the violation;
 * - enforce mode blocks the sink with `dataflow_policy_blocked`;
 * - `declassifySinks` lets the audited sink through under enforce;
 * - the `createReplayProvider(state)` replay transcript is identical;
 * - the read-only `toTool` child blocks its writer tool while the
 *   read-only tool works.
 */

import { describe, expect, it } from 'vitest';
import testPkg from '../package.json' with { type: 'json' };
import {
  main,
  runCacheStage,
  runDeclassifyStage,
  runEnforceStage,
  runReplayStage,
  runSecureReplayShowcase,
  runShadowStage,
  runStubStage,
  runSubAgentStage,
  STAGE1_REPLY,
  VERSION,
} from '../src/main.js';

const pkgVersion: string = testPkg.version;

describe('examples/secure-replay-agent - smoke', () => {
  it('exposes the package.json version', () => {
    expect(VERSION).toBe(pkgVersion);
  });

  it('main exits 0 and prints the OK line plus the sink-blocked line', async () => {
    const chunks: string[] = [];
    const exitCode = await main({
      write: (chunk) => {
        chunks.push(chunk);
      },
    });
    expect(exitCode).toBe(0);
    const output = chunks.join('');
    expect(output).toContain('sink blocked');
    expect(output).toContain('secure-replay-agent: OK');
    // Compact stats ride on the final line.
    expect(output).toContain('enforceBlocked=yes');
    expect(output).toContain('declassifiedPass=yes');
    expect(output).toContain('replayIdentical=yes');
    expect(output).toContain('childBlocked=yes');
  }, 20_000);

  it('the showcase aggregates per-stage stats and reports ok', async () => {
    const outcome = await runSecureReplayShowcase({ write: () => {} });
    expect(outcome.ok).toBe(true);
    const okLine = outcome.lines[outcome.lines.length - 1];
    expect(okLine).toContain('secure-replay-agent: OK');
    expect(outcome.lines.some((line) => line.includes('sink blocked'))).toBe(true);
  }, 20_000);

  it('stage 1: the scripted stub provider drives createAgent to completion', async () => {
    const stub = await runStubStage();
    expect(stub.completed).toBe(true);
    expect(stub.turns).toBe(1);
    expect(stub.reply).toBe(STAGE1_REPLY);
  });

  it('stage 2a: shadow mode allows the sink but flags + counts the violation', async () => {
    const shadow = await runShadowStage();
    expect(shadow.status).toBe('completed');
    expect(shadow.sinkRan).toBe(true); // shadow never blocks
    expect(shadow.flaggedAudits).toBe(1); // tool:dataflow:flagged audit row
    expect(shadow.flaggedCounterDelta).toBe(1); // tool.dataflow.decision.total counter
    expect(shadow.blockedAudits).toBe(0);
    expect(shadow.flow).toBe('untrusted-to-sink'); // verbatim carry wins over trifecta
  });

  it('stage 2b: enforce mode blocks the sink with dataflow_policy_blocked', async () => {
    const enforce = await runEnforceStage();
    expect(enforce.status).toBe('completed'); // the run survives; only the sink fails
    expect(enforce.sinkRan).toBe(false); // the tool body never executed
    expect(enforce.errorKind).toBe('dataflow_policy_blocked');
    expect(enforce.blockedAudits).toBe(1);
    expect(enforce.flow).toBe('untrusted-to-sink');
  });

  it('stage 2c: declassifySinks lets the audited sink through under enforce', async () => {
    const declassify = await runDeclassifyStage();
    expect(declassify.status).toBe('completed');
    expect(declassify.sinkRan).toBe(true); // the declassified sink executed
    expect(declassify.declassifiedAudits).toBe(1); // audited escape hatch
    expect(declassify.blockedAudits).toBe(0);
  });

  it('stage 3: cachePolicy anchors are forwarded and the usage carries cache legs', async () => {
    const cache = await runCacheStage();
    expect(cache.status).toBe('completed');
    expect(cache.anchoredRequests).toBe(2); // breakpoints: 'auto' on every request
    expect(cache.cacheWriteTokens).toBe(512);
    expect(cache.cachedReadTokens).toBe(512);
  });

  it('stage 4: the replayed transcript is identical to the recorded run', async () => {
    const replay = await runReplayStage();
    expect(replay.originalStatus).toBe('completed');
    expect(replay.replayStatus).toBe('completed');
    expect(replay.recordedSteps).toBe(2); // one journaled response per step
    expect(replay.identical).toBe(true);
  });

  it('stage 5: the read-only child blocks the writer tool and allows the reader', async () => {
    const subAgent = await runSubAgentStage();
    expect(subAgent.parentStatus).toBe('completed');
    expect(subAgent.writerBlocked).toBe(true);
    expect(subAgent.writerErrorKind).toBe('capability_blocked');
    expect(subAgent.writerRan).toBe(false); // the writer body never executed
    expect(subAgent.readerRan).toBe(true); // the read-only tool worked
  });
});
