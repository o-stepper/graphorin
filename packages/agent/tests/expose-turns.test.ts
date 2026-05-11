import type { Tool } from '@graphorin/core';
import { describe, expect, it } from 'vitest';
import { createAgent } from '../src/index.js';
import { createMockProvider, textOnlyScript } from './fixtures/mock-provider.js';

describe('Agent.toTool — exposeTurns semantics', () => {
  const subProvider = () =>
    createMockProvider({ modelId: 's', scripts: [textOnlyScript('sub-final-output', 4)] });

  it("default 'final' returns just the final output", async () => {
    const sub = createAgent({ name: 'sub', instructions: 'noop', provider: subProvider() });
    const t = sub.toTool() as Tool<{ readonly input: string }, string, unknown>;
    const exec = t.execute as (input: { readonly input: string }, ctx: unknown) => Promise<string>;
    const result = await exec({ input: 'go' }, undefined);
    expect(result).toBe('sub-final-output');
  });

  it("'none' returns an empty string", async () => {
    const sub = createAgent({ name: 'sub', instructions: 'noop', provider: subProvider() });
    const t = sub.toTool({ exposeTurns: 'none' }) as Tool<
      { readonly input: string },
      string,
      unknown
    >;
    const exec = t.execute as (input: { readonly input: string }, ctx: unknown) => Promise<string>;
    const result = await exec({ input: 'go' }, undefined);
    expect(result).toBe('');
  });

  it("'all' returns the joined per-turn text", async () => {
    const sub = createAgent({ name: 'sub', instructions: 'noop', provider: subProvider() });
    const t = sub.toTool({ exposeTurns: 'all' }) as Tool<
      { readonly input: string },
      string,
      unknown
    >;
    const exec = t.execute as (input: { readonly input: string }, ctx: unknown) => Promise<string>;
    const result = await exec({ input: 'go' }, undefined);
    expect(result).toBe('sub-final-output');
  });
});
