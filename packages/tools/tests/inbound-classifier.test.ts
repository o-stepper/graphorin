/**
 * B4 (D-12) - the classifier leg of inbound sanitization: consulted
 * after the regex pass, appends an audit hit, never fatal.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  applyInboundSanitization,
  applyInboundSanitizationWithClassifier,
  type InjectionClassifier,
} from '../src/inbound/index.js';

const BASE = {
  body: 'please schedule dinner for tomorrow',
  policy: 'detect-and-strip-and-wrap' as const,
  trustClass: 'channel-inbound' as const,
  toolName: 'channel:telegram',
  contentOrigin: 'channel:telegram',
};

/** Drop the wall-clock scan timing before structural comparison. */
function stable<T extends { scanDurationUs: number }>(outcome: T): Omit<T, 'scanDurationUs'> {
  const { scanDurationUs, ...rest } = outcome;
  void scanDurationUs;
  return rest;
}

describe('applyInboundSanitizationWithClassifier', () => {
  it('is byte-identical to the sync pass when no classifier is supplied', async () => {
    const sync = applyInboundSanitization(BASE);
    const wrapped = await applyInboundSanitizationWithClassifier(BASE);
    expect(stable(wrapped)).toEqual(stable(sync));
  });

  it('a flagged classification appends classifier:<id> to patternsHit', async () => {
    const classifier: InjectionClassifier = {
      id: 'stub',
      classify: vi.fn(async ({ text, surface, origin }) => {
        expect(surface).toBe('tool-inbound');
        expect(origin).toBe('channel:telegram');
        expect(text.length).toBeGreaterThan(0);
        return { flagged: true };
      }),
    };
    const outcome = await applyInboundSanitizationWithClassifier({ ...BASE, classifier });
    expect(classifier.classify).toHaveBeenCalledTimes(1);
    expect(outcome.patternsHit).toContain('classifier:stub');
    // The body itself is untouched by the classifier (no spans to strip).
    const sync = applyInboundSanitization(BASE);
    expect(outcome.body).toBe(sync.body);
  });

  it('a throwing classifier degrades to the regex outcome (never fatal)', async () => {
    const classifier: InjectionClassifier = {
      id: 'boom',
      classify: async () => {
        throw new Error('engine crashed');
      },
    };
    const outcome = await applyInboundSanitizationWithClassifier({ ...BASE, classifier });
    expect(stable(outcome)).toEqual(stable(applyInboundSanitization(BASE)));
  });
});
