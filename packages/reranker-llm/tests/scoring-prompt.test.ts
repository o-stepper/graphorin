import { describe, expect, it } from 'vitest';

import { defaultScoringPrompt } from '../src/scoring-prompt.js';

describe('defaultScoringPrompt', () => {
  it('emits a system message that constrains the output to a single integer', () => {
    const prompt = defaultScoringPrompt({
      query: 'best restaurants in Lisbon',
      passage: 'A restaurant guide for Lisbon, Portugal.',
      maxScore: 10,
    });
    expect(prompt.system).toMatch(/0 to 10/);
    expect(prompt.system).toMatch(/ONLY the integer/);
    expect(prompt.user).toContain('best restaurants in Lisbon');
    expect(prompt.user).toContain('A restaurant guide for Lisbon');
    expect(prompt.user).toContain('INTEGER SCORE (0-10)');
  });

  it('respects a custom maxScore', () => {
    const prompt = defaultScoringPrompt({
      query: 'q',
      passage: 'p',
      maxScore: 100,
    });
    expect(prompt.system).toMatch(/0 to 100/);
    expect(prompt.user).toMatch(/INTEGER SCORE \(0-100\)/);
  });
});
