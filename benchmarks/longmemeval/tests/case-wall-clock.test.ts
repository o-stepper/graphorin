/**
 * Coverage for `withCaseWallClock`: a subject call that outlives the
 * per-case wall clock rejects (the library runner then tags it with
 * `AGENT_RUN_THREW_MARKER` and the classifier stamps it
 * INFRASTRUCTURE_FAILED); fast calls and subject errors pass through
 * untouched.
 */
import { describe, expect, it } from 'vitest';

import { withCaseWallClock } from '../src/runner.js';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('withCaseWallClock', () => {
  it('rejects when the subject outlives the wall clock', async () => {
    const slow = {
      run: async () => {
        await sleep(120);
        return 'too late';
      },
    };
    await expect(withCaseWallClock(slow, 20).run('q')).rejects.toThrow(
      /case wall-clock timeout after 20ms/,
    );
  });

  it('passes fast results through untouched', async () => {
    const fast = { run: async (input: string) => `echo:${input}` };
    await expect(withCaseWallClock(fast, 1000).run('q')).resolves.toBe('echo:q');
  });

  it('propagates subject errors verbatim (no reclassification)', async () => {
    const broken = {
      run: async (): Promise<string> => {
        throw new Error('provider exploded');
      },
    };
    await expect(withCaseWallClock(broken, 1000).run('q')).rejects.toThrow('provider exploded');
  });
});
