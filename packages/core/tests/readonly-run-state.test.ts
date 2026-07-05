import { describe, expect, expectTypeOf, it } from 'vitest';

import type { ReadonlyRunState, RunContext, RunState } from '../src/index.js';

describe('ReadonlyRunState (W-047)', () => {
  it('RunState is assignable to ReadonlyRunState (structural mirror)', () => {
    expectTypeOf<RunState>().toExtend<ReadonlyRunState>();
    // Drift gate: the mirror must carry EXACTLY the same keys in both
    // directions - adding a field to RunState without mirroring it here
    // fails this test at typecheck time.
    expectTypeOf<keyof RunState>().toEqualTypeOf<keyof ReadonlyRunState>();
  });

  it('mutation surfaces are typed away', () => {
    // Arrays are ReadonlyArray: no push.
    expectTypeOf<ReadonlyRunState['pendingApprovals']>().not.toHaveProperty('push');
    expectTypeOf<ReadonlyRunState['steps']>().not.toHaveProperty('push');
    const probe = (state: ReadonlyRunState): void => {
      // @ts-expect-error - status is readonly on the tool-facing projection
      state.status = 'completed';
      // @ts-expect-error - finishedAt is readonly on the tool-facing projection
      state.finishedAt = 'now';
    };
    void probe;
    expect(true).toBe(true);
  });

  it('RunContext.state is the readonly projection', () => {
    expectTypeOf<RunContext['state']>().toEqualTypeOf<ReadonlyRunState>();
    const probe = (ctx: RunContext): void => {
      // @ts-expect-error - tools cannot flip run status through the context
      ctx.state.status = 'completed';
      // @ts-expect-error - tools cannot splice approval bookkeeping
      ctx.state.pendingApprovals.push({} as never);
    };
    void probe;
    expect(true).toBe(true);
  });
});
