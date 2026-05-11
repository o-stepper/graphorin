import { describe, expect, it } from 'vitest';

import { createAsyncContext } from '../src/utils/async-context.js';

describe('createAsyncContext', () => {
  it('threads a value through nested calls', () => {
    const ctx = createAsyncContext<{ runId: string }>('test');
    const result = ctx.run({ runId: 'r-1' }, () => {
      const inner = (): string => ctx.get()?.runId ?? '';
      return inner();
    });
    expect(result).toBe('r-1');
    expect(ctx.get()).toBeUndefined();
  });

  it('isolates concurrent async scopes', async () => {
    const ctx = createAsyncContext<number>('n');

    const seen: number[] = [];
    await Promise.all([
      ctx.runAsync(1, async () => {
        await new Promise((r) => setTimeout(r, 10));
        seen.push(ctx.get() ?? -1);
      }),
      ctx.runAsync(2, async () => {
        await new Promise((r) => setTimeout(r, 5));
        seen.push(ctx.get() ?? -1);
      }),
    ]);
    expect(seen.sort()).toEqual([1, 2]);
  });
});
