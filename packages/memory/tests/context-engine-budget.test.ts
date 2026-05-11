import { describe, expect, it } from 'vitest';
import { allocateTokenBudget, HEURISTIC_TOKEN_COUNTER, truncateToTokens } from '../src/index.js';

describe('context-engine — token budget allocator (Phase 10d)', () => {
  it('allocates within budget when every layer fits', async () => {
    const result = await allocateTokenBudget(
      [
        { id: 'identity', text: 'X'.repeat(40) },
        { id: 'memoryMetadata', text: 'Y'.repeat(40) },
      ],
      1000,
      HEURISTIC_TOKEN_COUNTER,
    );
    expect(result.layers).toHaveLength(2);
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.totalTokens).toBeLessThanOrEqual(result.budgetTokens);
    expect(result.overflowDropped).toEqual([]);
  });

  it('truncates the lowest priority layer first when the global budget is tight', async () => {
    const result = await allocateTokenBudget(
      [
        { id: 'identity', text: 'I'.repeat(80) },
        { id: 'autoRecall', text: 'R'.repeat(800) },
      ],
      40, // ~10 tokens via heuristic chars/4
      HEURISTIC_TOKEN_COUNTER,
    );
    const identity = result.layers.find((l) => l.id === 'identity');
    const autoRecall = result.layers.find((l) => l.id === 'autoRecall');
    expect(identity?.text.length).toBeGreaterThan(0);
    expect(autoRecall?.text.length ?? 0).toBeLessThan(autoRecall === undefined ? 0 : 800);
  });

  it('always preserves the identity layer (truncated last)', async () => {
    const result = await allocateTokenBudget(
      [
        { id: 'identity', text: 'I'.repeat(40) },
        { id: 'autoRecall', text: 'R'.repeat(8000) },
      ],
      20, // ~5 tokens
      HEURISTIC_TOKEN_COUNTER,
    );
    const identity = result.layers.find((l) => l.id === 'identity');
    expect(identity).toBeDefined();
    expect(identity?.text.length).toBeGreaterThan(0);
  });

  it('honours per-layer caps independently of global budget', async () => {
    const result = await allocateTokenBudget(
      [
        { id: 'identity', text: 'I'.repeat(40) },
        { id: 'workingBlocks', text: 'W'.repeat(8000), cap: 5 },
      ],
      10000,
      HEURISTIC_TOKEN_COUNTER,
    );
    const wb = result.layers.find((l) => l.id === 'workingBlocks');
    expect(wb?.tokens).toBeLessThanOrEqual(6); // cap + truncation marker tolerance
    expect(wb?.truncated).toBe(true);
  });

  it('drops overflow when overflowMode === drop', async () => {
    const result = await allocateTokenBudget(
      [
        { id: 'identity', text: 'I'.repeat(40) },
        { id: 'autoRecall', text: 'R'.repeat(800) },
      ],
      11,
      HEURISTIC_TOKEN_COUNTER,
      { overflowMode: 'drop' },
    );
    expect(result.overflowDropped).toContain('autoRecall');
    const ar = result.layers.find((l) => l.id === 'autoRecall');
    expect(ar?.text).toBe('');
    expect(ar?.droppedTokens).toBeGreaterThan(0);
  });

  it('truncateToTokens respects the requested cap and appends marker', async () => {
    const out = await truncateToTokens('A'.repeat(1000), 5, HEURISTIC_TOKEN_COUNTER);
    expect(out.text).toContain('[...truncated]');
    expect(out.tokens).toBeLessThanOrEqual(6);
    expect(out.truncated).toBe(true);
  });

  it('truncateToTokens returns input unchanged when within budget', async () => {
    const out = await truncateToTokens('hello', 999, HEURISTIC_TOKEN_COUNTER);
    expect(out.text).toBe('hello');
    expect(out.truncated).toBe(false);
  });
});
