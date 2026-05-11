import { describe, expect, it } from 'vitest';

import { classifyTool, DEFAULT_MEMORY_TAG_PATTERNS } from '../../src/guard/classifier.js';

describe('classifyTool', () => {
  it("returns 'untrusted' when trustLevel === 'untrusted' regardless of opt-in", () => {
    expect(classifyTool({ trustLevel: 'untrusted' })).toBe('untrusted');
    expect(classifyTool({ trustLevel: 'untrusted', memoryGuardTier: 'pure' })).toBe('pure');
  });

  it('honours operator opt-in', () => {
    expect(classifyTool({ memoryGuardTier: 'pure' })).toBe('pure');
    expect(classifyTool({ memoryGuardTier: 'side-effecting-no-memory' })).toBe(
      'side-effecting-no-memory',
    );
    expect(classifyTool({ memoryGuardTier: 'memory-aware' })).toBe('memory-aware');
  });

  it('recognises memory-aware tools by tag', () => {
    expect(classifyTool({ tags: ['memory'] })).toBe('memory-aware');
    expect(classifyTool({ tags: ['memory:write'] })).toBe('memory-aware');
    expect(classifyTool({ tags: ['network'] })).toBe('unknown');
  });

  it('recognises memory-aware tools by name and secretsAllowed key', () => {
    expect(classifyTool({ name: 'remember' })).toBe('memory-aware');
    expect(classifyTool({ name: 'recall' })).toBe('memory-aware');
    expect(classifyTool({ secretsAllowed: ['memory:scope'] })).toBe('memory-aware');
  });

  it("falls through to 'unknown' for everything else", () => {
    expect(classifyTool({})).toBe('unknown');
    expect(classifyTool({ name: 'fetch' })).toBe('unknown');
    expect(classifyTool({ tags: ['network'] })).toBe('unknown');
  });

  it('exposes the default pattern catalogue', () => {
    expect(DEFAULT_MEMORY_TAG_PATTERNS.length).toBeGreaterThan(0);
    for (const p of DEFAULT_MEMORY_TAG_PATTERNS) expect(p).toBeInstanceOf(RegExp);
  });
});
