import { describe, expect, it, vi } from 'vitest';

import {
  composeGuardrails,
  defineInputGuardrail,
  defineOutputGuardrail,
} from '../../src/guardrails/builders.js';
import type { GuardrailContext } from '../../src/guardrails/types.js';

const ctx: GuardrailContext = { stage: 'input' };

describe('defineInputGuardrail / defineOutputGuardrail', () => {
  it('tags the kind correctly', () => {
    const i = defineInputGuardrail({ name: 'i', check: () => ({ ok: true }) });
    const o = defineOutputGuardrail({ name: 'o', check: () => ({ ok: true }) });
    expect(i.kind).toBe('input');
    expect(o.kind).toBe('output');
  });
});

describe('composeGuardrails', () => {
  it('returns ok=true when every guardrail passes', async () => {
    const a = defineInputGuardrail({ name: 'a', check: () => ({ ok: true }) });
    const b = defineInputGuardrail({ name: 'b', check: () => ({ ok: true }) });
    const result = await composeGuardrails([a, b], 'hi', ctx);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hi');
  });

  it("short-circuits on the first 'block'", async () => {
    const evaluated: string[] = [];
    const a = defineInputGuardrail({
      name: 'a',
      check: () => {
        evaluated.push('a');
        return { ok: true };
      },
    });
    const b = defineInputGuardrail({
      name: 'b',
      check: () => {
        evaluated.push('b');
        return { ok: false, action: 'block', message: 'nope' };
      },
    });
    const c = defineInputGuardrail({
      name: 'c',
      check: () => {
        evaluated.push('c');
        return { ok: true };
      },
    });
    const result = await composeGuardrails([a, b, c], 'x', ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.action).toBe('block');
      expect(result.name).toBe('b');
    }
    expect(evaluated).toEqual(['a', 'b']);
  });

  it("accumulates 'warn' decisions and continues", async () => {
    const warn = vi.fn();
    const a = defineInputGuardrail({
      name: 'a',
      check: () => ({ ok: false, action: 'warn', message: 'meh' }),
    });
    const b = defineInputGuardrail({ name: 'b', check: () => ({ ok: true }) });
    const result = await composeGuardrails([a, b], 'x', { ...ctx, warn });
    expect(result.ok).toBe(true);
    expect(warn).toHaveBeenCalledOnce();
  });

  it("applies 'rewrite' to the in-flight value and continues", async () => {
    const a = defineInputGuardrail<string>({
      name: 'a',
      check: (v) => ({ ok: false, action: 'rewrite', rewrite: `${v}!`, message: 'rewritten' }),
    });
    const b = defineInputGuardrail<string>({
      name: 'b',
      check: (v) =>
        v.endsWith('!') ? { ok: true } : { ok: false, action: 'block', message: 'no rewrite' },
    });
    const result = await composeGuardrails([a, b], 'hi', ctx);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('hi!');
  });

  it('honours async checks', async () => {
    const guard = defineInputGuardrail<string>({
      name: 'async',
      check: async (v) => {
        await new Promise((r) => setTimeout(r, 1));
        return v === 'hi' ? { ok: true } : { ok: false, action: 'block', message: 'no' };
      },
    });
    expect((await composeGuardrails([guard], 'hi', ctx)).ok).toBe(true);
    expect((await composeGuardrails([guard], 'no', ctx)).ok).toBe(false);
  });
});
