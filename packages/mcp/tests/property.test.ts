import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { MCPCallToolResult } from '../src/client/index.js';
import { adaptCallResult } from '../src/client/to-tools.js';
import { buildJsonSchemaValidator } from '../src/registry/json-schema.js';
import type { ServerIdentity } from '../src/transport/types.js';

const dummyServerIdentity: ServerIdentity = Object.freeze({
  kind: 'mcp-streamable-http',
  id: 'fixture',
  urlHostname: 'fixture',
  urlPath: '/',
});

describe('property — adaptCallResult', () => {
  it('forwards content[] text parts unchanged when no structuredContent is present', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 32 }), { minLength: 1, maxLength: 5 }),
        (texts) => {
          const result: MCPCallToolResult = Object.freeze({
            content: Object.freeze(texts.map((t) => ({ type: 'text', text: t }) as const)),
          });
          const out = adaptCallResult({
            result,
            serverIdentity: dummyServerIdentity,
            toolName: 'echo',
          });
          expect(typeof out.output).toBe('string');
          expect(out.output as string).toBe(texts.join('\n'));
        },
      ),
      { numRuns: 50 },
    );
  });

  it('preserves structuredContent verbatim when no outputSchema is supplied', () => {
    fc.assert(
      fc.property(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), fc.integer()),
        (record) => {
          const result: MCPCallToolResult = Object.freeze({
            content: Object.freeze([{ type: 'text', text: JSON.stringify(record) } as const]),
            structuredContent: record,
          });
          const out = adaptCallResult({
            result,
            serverIdentity: dummyServerIdentity,
            toolName: 'tool',
          });
          expect(out.output).toEqual(record);
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe('property — buildJsonSchemaValidator', () => {
  it('always accepts inputs that the schema explicitly enumerates', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 16 }), { minLength: 1, maxLength: 6 }),
        (values) => {
          const schema = buildJsonSchemaValidator({ enum: values });
          for (const v of values) {
            expect(schema.safeParse(v).success).toBe(true);
          }
        },
      ),
      { numRuns: 25 },
    );
  });

  it('always rejects strings outside the enum', () => {
    const schema = buildJsonSchemaValidator({ enum: ['alpha', 'bravo'] });
    fc.assert(
      fc.property(
        fc.string({ minLength: 6, maxLength: 12 }).filter((s) => s !== 'alpha' && s !== 'bravo'),
        (value) => {
          expect(schema.safeParse(value).success).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });
});
