import { describe, expect, it } from 'vitest';
import { answerQuestion } from '../src/runner.js';

describe('W-093 - the retriever uses the real single-query path', () => {
  it('performs exactly ONE semantic.search per question (no harness fan-out)', async () => {
    const calls: Array<{ query: string; topK?: number }> = [];
    const memory = {
      semantic: {
        search: async (_scope: unknown, query: string, opts?: { topK?: number }) => {
          calls.push({ query, ...(opts?.topK !== undefined ? { topK: opts.topK } : {}) });
          return [
            { record: { id: 'f1', text: 'Alex lives in Berlin' } },
            { record: { id: 'f2', text: 'The user prefers tea' } },
          ];
        },
      },
    } as never;
    const out = await answerQuestion(memory, { userId: 'u' }, 'What city does Alex live in?');
    expect(calls).toEqual([{ query: 'What city does Alex live in?', topK: 24 }]);
    expect(out).toBe('Alex lives in Berlin\nThe user prefers tea');
  });
});
