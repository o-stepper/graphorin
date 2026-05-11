import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';

describe('tool() builder', () => {
  it('produces a frozen Tool with a Zod-typed input schema', () => {
    const t = tool({
      name: 'greet',
      description: 'Greet the user.',
      inputSchema: z.object({ name: z.string() }),
      sideEffectClass: 'pure',
      async execute({ name }) {
        return `Hello, ${name}!`;
      },
    });
    expect(t.name).toBe('greet');
    expect(t.description).toBe('Greet the user.');
    expect(Object.isFrozen(t)).toBe(true);
  });

  it('rejects names with characters outside the wire grammar', () => {
    expect(() =>
      tool({
        name: 'bad name with spaces',
        description: 'x',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        async execute() {
          return null;
        },
      }),
    ).toThrow(/must match/);
  });

  it('rejects empty name and description', () => {
    expect(() =>
      tool({
        name: '',
        description: 'x',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        async execute() {
          return null;
        },
      }),
    ).toThrow();
    expect(() =>
      tool({
        name: 'a',
        description: '',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        async execute() {
          return null;
        },
      }),
    ).toThrow();
  });

  it('rejects names longer than 128 characters', () => {
    expect(() =>
      tool({
        name: 'a'.repeat(129),
        description: 'x',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        async execute() {
          return null;
        },
      }),
    ).toThrow(/at most 128/);
  });
});
