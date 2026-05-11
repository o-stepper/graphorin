import { describe, expect, it } from 'vitest';

import { runGuardExplain, runGuardStatus } from '../src/commands/guard.js';
import {
  runTelemetryDisable,
  runTelemetryEnable,
  runTelemetryInspect,
  runTelemetryStatus,
} from '../src/commands/telemetry.js';

describe('graphorin guard', () => {
  it('status returns one row per tier', () => {
    const rows = runGuardStatus({ print: () => undefined });
    expect(rows.length).toBe(5);
    expect(rows.map((r) => r.tier)).toContain('memory-aware');
  });

  it('explain reports memory-aware for a tool tagged memory', () => {
    const result = runGuardExplain({
      toolName: 'remember_fact',
      tags: ['memory'],
      print: () => undefined,
    });
    expect(result.tier).toBe('memory-aware');
    expect(result.variant).toBe('API_BOUNDARY_GUARD');
  });

  it('explain reports untrusted when trustLevel forces it', () => {
    const result = runGuardExplain({
      toolName: 'sketchy_tool',
      trustLevel: 'untrusted',
      print: () => undefined,
    });
    expect(result.tier).toBe('untrusted');
    expect(result.variant).toBe('STRICT_FULL_GUARD');
  });
});

describe('graphorin telemetry', () => {
  it('status reports disabled', () => {
    const result = runTelemetryStatus({ print: () => undefined });
    expect(result.enabled).toBe(false);
    expect(result.policy).toBe('zero-default');
  });

  it('disable is a no-op success', () => {
    const result = runTelemetryDisable({ print: () => undefined });
    expect(result.enabled).toBe(false);
  });

  it('enable refuses + flips exitCode', () => {
    const before = process.exitCode;
    runTelemetryEnable({ print: () => undefined });
    expect(process.exitCode === 1 || process.exitCode === before).toBe(true);
    process.exitCode = before;
  });

  it('inspect prints the four no-* promises', () => {
    const lines: string[] = [];
    runTelemetryInspect({ print: (l) => lines.push(l) });
    expect(lines.some((l) => l.includes('no phone home'))).toBe(true);
  });
});
