import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { tool } from '../src/builder/index.js';
import {
  InvalidExampleError,
  InvalidPreferredModelError,
  InvalidSideEffectClassError,
} from '../src/errors/index.js';
import { normaliseTool } from '../src/registry/normalize.js';

describe('normaliseTool', () => {
  it('attaches the trust class derived from the source', () => {
    const t = tool({
      name: 'a',
      description: 'a',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      async execute() {
        return null;
      },
    });
    const { resolved } = normaliseTool(t, { kind: 'mcp', serverIdentity: 'linear' });
    expect(resolved.__trustClass).toBe('mcp-derived');
  });

  it('applies the per-trust-class default inboundSanitization policy when absent', () => {
    const t = tool({
      name: 'a',
      description: 'a',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      async execute() {
        return null;
      },
    });
    expect(normaliseTool(t, { kind: 'first-party' }).resolved.inboundSanitization).toBe(
      'detect-and-flag',
    );
    expect(
      normaliseTool(t, { kind: 'mcp', serverIdentity: 'x' }).resolved.inboundSanitization,
    ).toBe('detect-and-strip-and-wrap');
    expect(
      normaliseTool(t, { kind: 'built-in', subsystem: 'core' }).resolved.inboundSanitization,
    ).toBe('pass-through');
  });

  it("emits 'classification:missing' WARN with deferred-default 'side-effecting'", () => {
    const t = {
      name: 'unannotated',
      description: 'no class',
      inputSchema: z.object({}),
      async execute() {
        return null;
      },
    };
    const outcome = normaliseTool(t, { kind: 'first-party' });
    expect(outcome.deferredDefaultApplied).toBe(true);
    expect(outcome.resolved.__sideEffectClass).toBe('side-effecting');
    expect(outcome.warnings.some((w) => w.kind === 'classification:missing')).toBe(true);
  });

  it("emits 'classification:idempotency-key-missing' WARN for side-effecting-without-key", () => {
    const t = tool({
      name: 'risky',
      description: 'risky',
      inputSchema: z.object({}),
      sideEffectClass: 'external-stateful',
      async execute() {
        return null;
      },
    });
    const outcome = normaliseTool(t, { kind: 'first-party' });
    expect(outcome.warnings.some((w) => w.kind === 'classification:idempotency-key-missing')).toBe(
      true,
    );
  });

  it("does NOT emit 'idempotency-key-missing' when the key is present", () => {
    const t = tool({
      name: 'risky2',
      description: 'risky2',
      inputSchema: z.object({ x: z.string() }),
      sideEffectClass: 'external-stateful',
      idempotencyKey: ({ x }: { x: string }) => x,
      async execute() {
        return null;
      },
    });
    const outcome = normaliseTool(t, { kind: 'first-party' });
    expect(outcome.warnings.some((w) => w.kind === 'classification:idempotency-key-missing')).toBe(
      false,
    );
    expect(outcome.resolved.__hasIdempotencyKey).toBe(true);
  });

  it('throws InvalidSideEffectClassError on invalid value', () => {
    const t = {
      name: 'invalid',
      description: 'x',
      inputSchema: z.object({}),
      sideEffectClass: 'cosmic-ray' as never,
      async execute() {
        return null;
      },
    };
    expect(() => normaliseTool(t, { kind: 'first-party' })).toThrow(InvalidSideEffectClassError);
  });

  it('throws InvalidPreferredModelError on invalid hint', () => {
    const t = tool({
      name: 'bad',
      description: 'x',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      preferredModel: 'cosmic' as never,
      async execute() {
        return null;
      },
    });
    expect(() => normaliseTool(t, { kind: 'first-party' })).toThrow(InvalidPreferredModelError);
  });

  it("accepts ModelHint literals 'fast' | 'balanced' | 'smart'", () => {
    for (const hint of ['fast', 'balanced', 'smart'] as const) {
      const t = tool({
        name: `m-${hint}`,
        description: 'x',
        inputSchema: z.object({}),
        sideEffectClass: 'pure',
        preferredModel: hint,
        async execute() {
          return null;
        },
      });
      const { resolved } = normaliseTool(t, { kind: 'first-party' });
      expect(resolved.__preferredModel).toBe(hint);
    }
  });

  it('throws InvalidExampleError when an example input does not parse', () => {
    const t = tool({
      name: 'q',
      description: 'q',
      inputSchema: z.object({ q: z.string() }),
      outputSchema: z.object({ ok: z.boolean() }),
      sideEffectClass: 'pure',
      examples: [
        // @ts-expect-error - intentional shape error
        { input: { wrong: 'field' }, output: { ok: true } },
      ],
      async execute() {
        return { ok: true };
      },
    });
    expect(() => normaliseTool(t, { kind: 'first-party' })).toThrow(InvalidExampleError);
  });

  it("emits 'examples:overflow' WARN when more than 5 examples are provided", () => {
    const t = tool({
      name: 'm',
      description: 'm',
      inputSchema: z.object({ q: z.string() }),
      sideEffectClass: 'pure',
      examples: Array.from({ length: 6 }, (_, i) => ({
        input: { q: `q${i}` },
        output: undefined,
      })),
      async execute() {
        return undefined;
      },
    });
    const outcome = normaliseTool(t, { kind: 'first-party' });
    expect(outcome.warnings.some((w) => w.kind === 'examples:overflow')).toBe(true);
  });

  it('resolves examplesEagerlyRendered per defer_loading auto-rule', () => {
    const deferred = tool({
      name: 'd1',
      description: 'd1',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      defer_loading: true,
      async execute() {
        return null;
      },
    });
    const eager = tool({
      name: 'e1',
      description: 'e1',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      defer_loading: false,
      async execute() {
        return null;
      },
    });
    expect(normaliseTool(deferred, { kind: 'first-party' }).resolved.examplesEagerlyRendered).toBe(
      false,
    );
    expect(normaliseTool(eager, { kind: 'first-party' }).resolved.examplesEagerlyRendered).toBe(
      true,
    );
  });

  it("emits 'result:cap-disabled' WARN when maxResultTokens === 0", () => {
    const t = tool({
      name: 'big',
      description: 'big',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      maxResultTokens: 0,
      async execute() {
        return null;
      },
    });
    const outcome = normaliseTool(t, { kind: 'first-party' });
    expect(outcome.warnings.some((w) => w.kind === 'result:cap-disabled')).toBe(true);
  });

  it('preserves __preferredModel bytes-equal in the resolved record', () => {
    const t = tool({
      name: 'p',
      description: 'p',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      preferredModel: 'fast',
      async execute() {
        return null;
      },
    });
    const { resolved } = normaliseTool(t, { kind: 'first-party' });
    expect(resolved.__preferredModel).toBe('fast');
  });
});

describe('normaliseTool - deferLoadingByDefault (C6)', () => {
  const base = () =>
    tool({
      name: 'lazy_candidate',
      description: 'a',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      async execute() {
        return null;
      },
    });

  it('defaults undeclared tools to deferred when the registry opts in', () => {
    const { resolved } = normaliseTool(
      base(),
      { kind: 'first-party' },
      {
        deferLoadingByDefault: true,
      },
    );
    expect(resolved.__effectiveDeferLoading).toBe(true);
    // Default-deferred tools render examples lazily, like explicit defer.
    expect(resolved.examplesEagerlyRendered).toBe(false);
  });

  it('an explicit defer_loading: false wins over the registry default', () => {
    const t = { ...base(), defer_loading: false } as ReturnType<typeof base>;
    const { resolved } = normaliseTool(
      t,
      { kind: 'first-party' },
      {
        deferLoadingByDefault: true,
      },
    );
    expect(resolved.__effectiveDeferLoading).toBe(false);
    expect(resolved.examplesEagerlyRendered).toBe(true);
  });

  it('without the option the pre-C6 behaviour holds (per-tool opt-in only)', () => {
    const { resolved } = normaliseTool(base(), { kind: 'first-party' });
    expect(resolved.__effectiveDeferLoading).toBe(false);
    expect(resolved.examplesEagerlyRendered).toBeUndefined();
  });
});

describe('normaliseTool - built-in exemption from deferLoadingByDefault (C6)', () => {
  it('built-in registrations stay eager under the registry default', () => {
    const t = tool({
      name: 'tool_search',
      description: 'discovery',
      inputSchema: z.object({}),
      sideEffectClass: 'pure',
      async execute() {
        return null;
      },
    });
    const { resolved } = normaliseTool(
      t,
      { kind: 'built-in', subsystem: 'tool-discovery' },
      { deferLoadingByDefault: true },
    );
    expect(resolved.__effectiveDeferLoading).toBe(false);
  });
});
