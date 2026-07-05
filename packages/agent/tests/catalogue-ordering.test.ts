/**
 * A7: prompt-cache-aware tool catalogue. Deferred tools promoted by `tool_search`
 * must join the per-step catalogue in PROMOTION order (append-only), not the
 * registry's `listDeferred` order - otherwise a later promotion can land before
 * an earlier one, shifting the serialized suffix and invalidating the provider's
 * prompt-cache prefix on every subsequent step (the worst case for a
 * long-running assistant).
 */

import { describe, expect, it } from 'vitest';
import { orderPromotedTools } from '../src/tooling/catalogue.js';

// Registry order is alpha, bravo, charlie - deliberately NOT promotion order.
const deferred = [{ name: 'alpha' }, { name: 'bravo' }, { name: 'charlie' }];

describe('A7: append-only promoted-tool ordering', () => {
  it('orders promoted tools by promotion order, not registry order', () => {
    // charlie promoted first, then alpha (registry order would be alpha, charlie).
    const ordered = orderPromotedTools(['charlie', 'alpha'], deferred);
    expect(ordered.map((t) => t.name)).toEqual(['charlie', 'alpha']);
  });

  it('appends a newly promoted tool at the END - earlier promotions keep their position', () => {
    const afterStep1 = orderPromotedTools(['bravo'], deferred);
    const afterStep2 = orderPromotedTools(['bravo', 'alpha'], deferred);
    expect(afterStep1.map((t) => t.name)).toEqual(['bravo']);
    expect(afterStep2.map((t) => t.name)).toEqual(['bravo', 'alpha']);
    // bravo is still first ⇒ the catalogue prefix [eager…, bravo] is byte-stable.
    expect(afterStep2[0]?.name).toBe('bravo');
  });

  it('skips promotion names absent from the deferred pool', () => {
    expect(orderPromotedTools(['bravo', 'ghost'], deferred).map((t) => t.name)).toEqual(['bravo']);
  });
});
