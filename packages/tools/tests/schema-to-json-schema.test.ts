/**
 * tools-01 regression: the shared Zod-to-JSON-Schema projection.
 *
 * Pre-fix, `projectSchema`/`schemaToJson`/`toMatch` only honoured a
 * `toJSON()` method - which no real Zod schema has - so plain-Zod tools
 * serialised as `{"_def":...}` internals on every provider wire body.
 * These tests drive **real** `zod` (v3 classic) and **real** `zod/v4`
 * schema instances through the converter, never hand-crafted fixtures.
 */
import { describe, expect, it } from 'vitest';
import { z as z3 } from 'zod';
import { z as z4 } from 'zod/v4';

import {
  isZodSchema,
  isZodV3Schema,
  isZodV4Schema,
  looksLikeJsonSchema,
  projectSchemaToJsonSchema,
  zodToJsonSchema,
} from '../src/schema/index.js';

describe('detection', () => {
  it('classifies v3 classic, v4, and non-Zod values correctly', () => {
    const v3 = z3.object({ q: z3.string() });
    const v4 = z4.object({ q: z4.string() });
    expect(isZodV3Schema(v3)).toBe(true);
    expect(isZodV4Schema(v3)).toBe(false);
    // v4 instances carry `_def` too - v4 detection must win.
    expect(isZodV4Schema(v4)).toBe(true);
    expect(isZodV3Schema(v4)).toBe(false);
    expect(isZodSchema({ parse: () => ({}), safeParse: () => ({}) })).toBe(false);
    expect(isZodSchema({ type: 'object' })).toBe(false);
    expect(isZodSchema(null)).toBe(false);
  });

  it('looksLikeJsonSchema accepts schema-shaped data and rejects validators', () => {
    expect(looksLikeJsonSchema({ type: 'object', properties: {} })).toBe(true);
    expect(looksLikeJsonSchema({ anyOf: [] })).toBe(true);
    expect(looksLikeJsonSchema({})).toBe(true); // permissive empty schema
    expect(looksLikeJsonSchema({ parse: () => ({}) })).toBe(false);
    expect(looksLikeJsonSchema({ foo: 1 })).toBe(false); // no JSON Schema marker
    expect(looksLikeJsonSchema([])).toBe(false);
    expect(looksLikeJsonSchema('x')).toBe(false);
  });
});

describe('zod v3 classic conversion', () => {
  it('converts a realistic tool input object with required/optional split', () => {
    const schema = z3
      .object({
        query: z3.string().min(2).max(64).describe('the search query'),
        limit: z3.number().int().min(1).optional(),
        mode: z3.enum(['fast', 'deep']).default('fast'),
        tags: z3.array(z3.string()).optional(),
      })
      .describe('search input');

    const json = zodToJsonSchema(schema);
    expect(json).toMatchObject({
      type: 'object',
      description: 'search input',
      required: ['query'],
      properties: {
        query: { type: 'string', minLength: 2, maxLength: 64, description: 'the search query' },
        limit: { type: 'integer', minimum: 1 },
        mode: { type: 'string', enum: ['fast', 'deep'], default: 'fast' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    });
    // The old bug shipped `_def` internals - assert they are gone.
    expect(JSON.stringify(json)).not.toContain('_def');
  });

  it('maps string formats, patterns, literals, unions, records, nullable', () => {
    const schema = z3.object({
      email: z3.string().email(),
      link: z3.string().url(),
      id: z3.string().uuid(),
      code: z3.string().regex(/^[a-z]+$/),
      kind: z3.literal('order'),
      either: z3.union([z3.string(), z3.number()]),
      meta: z3.record(z3.string(), z3.number()),
      note: z3.string().nullable(),
    });
    const json = zodToJsonSchema(schema) as {
      properties: Record<string, Record<string, unknown>>;
    };
    expect(json.properties.email).toEqual({ type: 'string', format: 'email' });
    expect(json.properties.link).toEqual({ type: 'string', format: 'uri' });
    expect(json.properties.id).toEqual({ type: 'string', format: 'uuid' });
    expect(json.properties.code).toEqual({ type: 'string', pattern: '^[a-z]+$' });
    expect(json.properties.kind).toEqual({ type: 'string', const: 'order' });
    expect(json.properties.either).toEqual({ anyOf: [{ type: 'string' }, { type: 'number' }] });
    expect(json.properties.meta).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
    });
    expect(json.properties.note).toEqual({ anyOf: [{ type: 'string' }, { type: 'null' }] });
  });

  it('handles nesting, arrays with bounds, tuples, sets, intersections', () => {
    const schema = z3.object({
      items: z3
        .array(z3.object({ sku: z3.string() }))
        .min(1)
        .max(10),
      pair: z3.tuple([z3.string(), z3.number()]),
      labels: z3.set(z3.string()),
      both: z3.intersection(z3.object({ a: z3.string() }), z3.object({ b: z3.number() })),
    });
    const json = zodToJsonSchema(schema) as {
      properties: Record<string, Record<string, unknown>>;
    };
    expect(json.properties.items).toMatchObject({
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: { type: 'object', properties: { sku: { type: 'string' } }, required: ['sku'] },
    });
    expect(json.properties.pair).toMatchObject({
      type: 'array',
      prefixItems: [{ type: 'string' }, { type: 'number' }],
    });
    expect(json.properties.labels).toMatchObject({
      type: 'array',
      uniqueItems: true,
      items: { type: 'string' },
    });
    expect(json.properties.both).toEqual({
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
        { type: 'object', properties: { b: { type: 'number' } }, required: ['b'] },
      ],
    });
  });

  it('honours strict/passthrough unknown-key policies and native enums', () => {
    enum Color {
      Red = 'red',
      Blue = 'blue',
    }
    enum Level {
      Low = 0,
      High = 1,
    }
    const strict = zodToJsonSchema(z3.object({ a: z3.string() }).strict());
    const passthrough = zodToJsonSchema(z3.object({ a: z3.string() }).passthrough());
    const strip = zodToJsonSchema(z3.object({ a: z3.string() }));
    expect(strict.additionalProperties).toBe(false);
    expect(passthrough.additionalProperties).toBe(true);
    expect('additionalProperties' in strip).toBe(false);

    expect(zodToJsonSchema(z3.nativeEnum(Color))).toEqual({
      type: 'string',
      enum: ['red', 'blue'],
    });
    expect(zodToJsonSchema(z3.nativeEnum(Level))).toEqual({ type: 'number', enum: [0, 1] });
  });

  it('unwraps effects/branded/readonly/pipeline/catch to the input shape', () => {
    const refined = z3.object({ n: z3.number() }).refine((v) => v.n > 0);
    expect(zodToJsonSchema(refined)).toMatchObject({
      type: 'object',
      properties: { n: { type: 'number' } },
    });
    expect(zodToJsonSchema(z3.string().brand<'UserId'>())).toEqual({ type: 'string' });
    expect(zodToJsonSchema(z3.string().readonly())).toEqual({ type: 'string' });
    expect(zodToJsonSchema(z3.string().pipe(z3.coerce.number()))).toEqual({ type: 'string' });
    expect(zodToJsonSchema(z3.string().catch('fallback'))).toEqual({ type: 'string' });
  });

  it('treats optional-through-wrappers as non-required at the object level', () => {
    const schema = z3.object({
      plain: z3.string(),
      viaOptional: z3.string().optional(),
      viaDefault: z3.string().default('x'),
      viaCatch: z3.string().catch('y'),
      viaRefinedOptional: z3
        .string()
        .optional()
        .refine(() => true),
    });
    const json = zodToJsonSchema(schema);
    expect(json.required).toEqual(['plain']);
  });

  it('survives recursive lazy schemas without hanging', () => {
    interface Node {
      readonly name: string;
      readonly children?: ReadonlyArray<Node> | undefined;
    }
    const node: z3.ZodType<Node> = z3.object({
      name: z3.string(),
      children: z3.array(z3.lazy(() => node)).optional(),
    });
    const json = zodToJsonSchema(node) as {
      type: string;
      properties: Record<string, unknown>;
    };
    expect(json.type).toBe('object');
    expect(json.properties.name).toEqual({ type: 'string' });
    // The cycle terminates in a permissive `{}` somewhere down the chain.
    expect(JSON.stringify(json).length).toBeLessThan(10_000);
  });

  it('reports unsupported node kinds and degrades them to permissive {}', () => {
    const details: string[] = [];
    const json = zodToJsonSchema(z3.object({ fn: z3.function() }), {
      onUnsupported: (d) => details.push(d),
    });
    expect((json.properties as Record<string, unknown>).fn).toEqual({});
    expect(details).toContain('zod-v3:ZodFunction');
  });
});

describe('zod v4 conversion', () => {
  it('converts a realistic tool input object with required/optional split', () => {
    const schema = z4
      .object({
        query: z4.string().min(2).max(64).describe('the search query'),
        limit: z4.number().int().min(1).optional(),
        mode: z4.enum(['fast', 'deep']).default('fast'),
        tags: z4.array(z4.string()).optional(),
      })
      .describe('search input');

    const json = zodToJsonSchema(schema);
    expect(json).toMatchObject({
      type: 'object',
      description: 'search input',
      properties: {
        query: { type: 'string', minLength: 2, maxLength: 64, description: 'the search query' },
        limit: { type: 'integer', minimum: 1 },
        mode: { type: 'string', enum: ['fast', 'deep'], default: 'fast' },
        tags: { type: 'array', items: { type: 'string' } },
      },
    });
    // v4 `.default()` and `.optional()` both make a property non-required.
    expect(json.required).toEqual(['query']);
    expect(JSON.stringify(json)).not.toContain('_zod');
  });

  it('maps formats, literals, unions, records, nullable, strictObject', () => {
    const schema = z4.object({
      email: z4.email(),
      id: z4.uuid(),
      kind: z4.literal('order'),
      either: z4.union([z4.string(), z4.number()]),
      meta: z4.record(z4.string(), z4.number()),
      note: z4.string().nullable(),
    });
    const json = zodToJsonSchema(schema) as {
      properties: Record<string, Record<string, unknown>>;
    };
    expect(json.properties.email).toEqual({ type: 'string', format: 'email' });
    expect(json.properties.id).toEqual({ type: 'string', format: 'uuid' });
    expect(json.properties.kind).toEqual({ type: 'string', const: 'order' });
    expect(json.properties.either).toEqual({ anyOf: [{ type: 'string' }, { type: 'number' }] });
    expect(json.properties.meta).toEqual({
      type: 'object',
      additionalProperties: { type: 'number' },
    });
    expect(json.properties.note).toEqual({ anyOf: [{ type: 'string' }, { type: 'null' }] });

    expect(zodToJsonSchema(z4.strictObject({ a: z4.string() })).additionalProperties).toBe(false);
  });

  it('converts z4.int(), pipes (input side), and array bounds', () => {
    expect(zodToJsonSchema(z4.int())).toEqual({ type: 'integer' });
    expect(zodToJsonSchema(z4.string().pipe(z4.transform((s) => s.length)))).toEqual({
      type: 'string',
    });
    expect(zodToJsonSchema(z4.array(z4.string()).min(1).max(3))).toEqual({
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 3,
    });
  });
});

describe('projectSchemaToJsonSchema (the shared entry)', () => {
  it('returns undefined for null/undefined', () => {
    expect(projectSchemaToJsonSchema(undefined)).toBeUndefined();
    expect(projectSchemaToJsonSchema(null)).toBeUndefined();
  });

  it('prefers toJSON() when present (MCP validators, hand-rolled schemas)', () => {
    const source = { type: 'object', properties: { a: { type: 'string' } } };
    const validator = {
      parse: (v: unknown) => v,
      safeParse: (v: unknown) => ({ success: true as const, data: v }),
      toJSON: () => source,
    };
    expect(projectSchemaToJsonSchema(validator)).toBe(source);
  });

  it('converts plain Zod v3 and v4 schemas', () => {
    const v3 = projectSchemaToJsonSchema(z3.object({ a: z3.string() }));
    const v4 = projectSchemaToJsonSchema(z4.object({ a: z4.string() }));
    for (const json of [v3, v4]) {
      expect(json).toMatchObject({
        type: 'object',
        properties: { a: { type: 'string' } },
        required: ['a'],
      });
    }
  });

  it('passes through JSON-Schema-shaped data by reference', () => {
    const schema = { type: 'object', properties: { a: { type: 'string' } } };
    expect(projectSchemaToJsonSchema(schema)).toBe(schema);
    const empty = {};
    expect(projectSchemaToJsonSchema(empty)).toBe(empty);
  });

  it('refuses to project an opaque validator (reports, returns undefined)', () => {
    const details: string[] = [];
    const opaque = {
      parse: (v: unknown) => v,
      safeParse: (v: unknown) => ({ success: true, data: v }),
    };
    expect(
      projectSchemaToJsonSchema(opaque, { onUnsupported: (d) => details.push(d) }),
    ).toBeUndefined();
    expect(details).toEqual(['unprojectable-schema']);
  });

  it('falls through a throwing or non-object toJSON to the structural paths', () => {
    const zodWithBadToJson = Object.assign(z3.object({ a: z3.string() }), {
      toJSON: () => {
        throw new Error('boom');
      },
    });
    expect(projectSchemaToJsonSchema(zodWithBadToJson)).toMatchObject({
      type: 'object',
      required: ['a'],
    });
  });
});
