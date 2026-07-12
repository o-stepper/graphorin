import { describe, expect, it } from 'vitest';
import {
  PROACTIVE_OUTCOME_LADDER,
  type ProactiveOutcome,
  proactiveOutcomeWithinGrant,
} from '../src/index.js';

describe('proactive outcome ladder (C3)', () => {
  it('pins the ladder order - the single source for rung comparisons', () => {
    expect(PROACTIVE_OUTCOME_LADDER).toEqual(['notify', 'question', 'review', 'act']);
    expect(Object.isFrozen(PROACTIVE_OUTCOME_LADDER)).toBe(true);
  });

  it('proactiveOutcomeWithinGrant compares rungs deterministically', () => {
    // Everything fits under 'act'.
    for (const kind of PROACTIVE_OUTCOME_LADDER) {
      expect(proactiveOutcomeWithinGrant(kind, 'act')).toBe(true);
    }
    // Only 'notify' fits under the default grant.
    expect(proactiveOutcomeWithinGrant('notify', 'notify')).toBe(true);
    expect(proactiveOutcomeWithinGrant('question', 'notify')).toBe(false);
    expect(proactiveOutcomeWithinGrant('review', 'notify')).toBe(false);
    expect(proactiveOutcomeWithinGrant('act', 'notify')).toBe(false);
    // Middle rung: at-or-below semantics.
    expect(proactiveOutcomeWithinGrant('question', 'review')).toBe(true);
    expect(proactiveOutcomeWithinGrant('act', 'review')).toBe(false);
  });

  it('outcomes are JSON-safe data', () => {
    const outcome: ProactiveOutcome = {
      kind: 'question',
      taskId: 'morning-brief',
      firedAt: '2026-07-12T08:00:00.000Z',
      text: 'Need a decision on the flight change.',
      ref: 'wf:travel:thread-1:decision',
      options: [
        { label: 'Accept', value: 'yes' },
        { label: 'Decline', value: 'no' },
      ],
    };
    expect(JSON.parse(JSON.stringify(outcome))).toEqual(outcome);
  });
});
