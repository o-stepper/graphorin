/**
 * W-100 compile gate: a concretely-typed Tool goes into
 * `createAgent({ tools })` WITHOUT a cast. Before AnyTool, the
 * invariance of `Tool.needsApproval` in TInput forced
 * `expenseTool as unknown as Tool<unknown, unknown, undefined>`
 * at every collection seam.
 */

import type { Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

interface ExpenseInput {
  readonly amount: number;
  readonly memo: string;
}

const expenseSchema = {
  parse: (v: unknown) => v as ExpenseInput,
  safeParse: (v: unknown) => ({ success: true as const, data: v as ExpenseInput }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<ExpenseInput, string, unknown>['inputSchema'];

// Concretely typed - including the contravariant needsApproval predicate
// that makes Tool invariant in TInput.
const expenseTool: Tool<ExpenseInput, string, unknown> = {
  name: 'file_expense',
  description: 'File an expense report',
  inputSchema: expenseSchema,
  sideEffectClass: 'side-effecting',
  needsApproval: (input) => input.amount > 100,
  execute: async (input) => `filed ${input.amount} for ${input.memo}`,
};

describe('AnyTool collection seam (W-100)', () => {
  it('createAgent accepts a typed tool array without a cast', async () => {
    const agent = createAgent({
      name: 'caster',
      instructions: 'use tools',
      provider: createMockProvider({ modelId: 'mock', scripts: [textOnlyScript('done')] }),
      // No `as unknown as Tool<...>` - this line IS the test.
      tools: [expenseTool],
    });
    const result = await agent.run('hello');
    expect(result.status).toBe('completed');
  });
});
