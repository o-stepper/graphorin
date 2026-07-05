import { describe, expect, it } from 'vitest';

import { buildJsonSchemaValidator } from '../src/registry/json-schema.js';

describe('buildJsonSchemaValidator', () => {
  it('parses object schemas with required properties', () => {
    const schema = buildJsonSchemaValidator({
      type: 'object',
      properties: { id: { type: 'integer' }, title: { type: 'string' } },
      required: ['id', 'title'],
    });
    const ok = schema.safeParse({ id: 7, title: 'foo' });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data).toEqual({ id: 7, title: 'foo' });
    }
    const missing = schema.safeParse({ id: 7 });
    expect(missing.success).toBe(false);
  });

  it('rejects unexpected additional properties when additionalProperties is false', () => {
    const schema = buildJsonSchemaValidator({
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    });
    const out = schema.safeParse({ id: 'a', stray: true });
    expect(out.success).toBe(false);
  });

  it('parses arrays with item schemas', () => {
    const schema = buildJsonSchemaValidator({
      type: 'array',
      items: { type: 'integer', minimum: 0 },
      minItems: 1,
    });
    expect(schema.safeParse([1, 2, 3]).success).toBe(true);
    expect(schema.safeParse([]).success).toBe(false);
    expect(schema.safeParse([-1]).success).toBe(false);
    expect(schema.safeParse([1.5]).success).toBe(false);
  });

  it('honours string min/max length and pattern', () => {
    const schema = buildJsonSchemaValidator({
      type: 'string',
      minLength: 2,
      maxLength: 5,
      pattern: '^[a-z]+$',
    });
    expect(schema.safeParse('foo').success).toBe(true);
    expect(schema.safeParse('a').success).toBe(false);
    expect(schema.safeParse('LONG').success).toBe(false);
  });

  it('honours number min/max bounds', () => {
    const schema = buildJsonSchemaValidator({
      type: 'number',
      minimum: 0,
      maximum: 10,
    });
    expect(schema.safeParse(5).success).toBe(true);
    expect(schema.safeParse(11).success).toBe(false);
  });

  it('parse() throws on invalid input', () => {
    const schema = buildJsonSchemaValidator({ type: 'string' });
    expect(() => schema.parse(42)).toThrow();
  });

  it('honours enum and const constraints', () => {
    const enumSchema = buildJsonSchemaValidator({ enum: ['a', 'b'] });
    expect(enumSchema.safeParse('a').success).toBe(true);
    expect(enumSchema.safeParse('c').success).toBe(false);
    const constSchema = buildJsonSchemaValidator({ const: 42 });
    expect(constSchema.safeParse(42).success).toBe(true);
    expect(constSchema.safeParse(43).success).toBe(false);
  });

  it('honours oneOf and anyOf composition', () => {
    const anyOf = buildJsonSchemaValidator({
      anyOf: [{ type: 'string' }, { type: 'integer' }],
    });
    expect(anyOf.safeParse('foo').success).toBe(true);
    expect(anyOf.safeParse(7).success).toBe(true);
    expect(anyOf.safeParse(true).success).toBe(false);

    const oneOf = buildJsonSchemaValidator({
      oneOf: [{ type: 'string' }, { type: 'integer' }],
    });
    expect(oneOf.safeParse('foo').success).toBe(true);
    expect(oneOf.safeParse(7).success).toBe(true);
  });

  it('treats `true` and `false` schemas correctly', () => {
    expect(buildJsonSchemaValidator(true).safeParse('anything').success).toBe(true);
    expect(buildJsonSchemaValidator(false).safeParse('anything').success).toBe(false);
  });

  it('retains the source JSON Schema and exposes it via toJSON() (tools-01)', () => {
    const source = {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    } as const;
    const validator = buildJsonSchemaValidator(source) as {
      toJSON?: () => Record<string, unknown>;
    };
    // toolToDefinition serialises tool schemas via toJSON(); without this
    // every MCP tool advertised `{}` (no parameters) on the provider body.
    expect(typeof validator.toJSON).toBe('function');
    expect(validator.toJSON?.()).toBe(source);
    expect(JSON.stringify(validator)).toContain('"query"');

    // Boolean schemas normalise to record equivalents.
    const yes = buildJsonSchemaValidator(true) as { toJSON?: () => Record<string, unknown> };
    const no = buildJsonSchemaValidator(false) as { toJSON?: () => Record<string, unknown> };
    expect(yes.toJSON?.()).toEqual({});
    expect(no.toJSON?.()).toEqual({ not: {} });
  });
});

describe('mcp-skills-07 - server-supplied pattern hardening (ReDoS)', () => {
  it('a catastrophic-backtracking pattern is guarded out (degrades to permissive) within a time budget', () => {
    const validator = buildJsonSchemaValidator({
      type: 'object',
      properties: {
        s: { type: 'string', pattern: '(a+)+$' },
      },
    });
    const hostile = `${'a'.repeat(64)}b`;
    const started = Date.now();
    // Pre-fix this stalled the event loop with catastrophic
    // backtracking; the nested-quantifier heuristic now skips the
    // pattern entirely (permissive, like a malformed pattern).
    const result = validator.safeParse({ s: hostile });
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(result.success).toBe(true);
  });

  it('an oversized test string skips pattern evaluation instead of scanning it', () => {
    const validator = buildJsonSchemaValidator({
      type: 'object',
      properties: { s: { type: 'string', pattern: '^x' } },
    });
    const big = 'y'.repeat(20_000);
    const result = validator.safeParse({ s: big });
    // Over the cap: pattern not evaluated (permissive) - the mismatch
    // is deliberately NOT reported rather than scanning 20k chars of
    // attacker-controlled input per property.
    expect(result.success).toBe(true);
  });

  it('ordinary patterns still validate', () => {
    const validator = buildJsonSchemaValidator({
      type: 'object',
      properties: { s: { type: 'string', pattern: '^ab+c$' } },
    });
    expect(validator.safeParse({ s: 'abbbc' }).success).toBe(true);
    expect(validator.safeParse({ s: 'zzz' }).success).toBe(false);
  });
});
