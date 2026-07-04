/**
 * Lightweight JSON-Schema -> {@link ZodLikeSchema} adapter.
 *
 * The Model Context Protocol carries tool input + output schemas as
 * JSON Schema documents; the Graphorin tool registry types its
 * schemas via the `ZodLikeSchema` structural contract from
 * `@graphorin/core`. This module bridges the two without pulling
 * `zod` into the MCP boundary or relying on code generation +
 * runtime `eval` (the popular `json-schema-to-zod` package generates
 * source code that needs `new Function(...)` to execute).
 *
 * The adapter validates the canonical subset of JSON Schema the MCP
 * spec uses: `object` (with `properties`, `required`,
 * `additionalProperties`), `array` (with `items`, `minItems`,
 * `maxItems`), `string` (with `enum`, `minLength`, `maxLength`,
 * `pattern`), `number` / `integer` (with `enum`, `minimum`,
 * `maximum`), `boolean`, `null`, and the primitive composition
 * keywords `enum`, `const`, `oneOf`, `anyOf`, `allOf`. Unknown keys
 * are accepted permissively so newer MCP server schemas that ship
 * additional vocabulary do not break the adapter.
 *
 * @packageDocumentation
 */

import type { ZodLikeError, ZodLikeSafeParseResult, ZodLikeSchema } from '@graphorin/core';

/** JSON Schema document subset accepted by {@link buildJsonSchemaValidator}. */
export type JsonSchemaLike =
  | boolean
  | (Readonly<Record<string, unknown>> & {
      readonly type?: string | ReadonlyArray<string>;
      readonly properties?: Readonly<Record<string, JsonSchemaLike>>;
      readonly required?: ReadonlyArray<string>;
      readonly additionalProperties?: boolean | JsonSchemaLike;
      readonly items?: JsonSchemaLike | ReadonlyArray<JsonSchemaLike>;
      readonly minItems?: number;
      readonly maxItems?: number;
      readonly minimum?: number;
      readonly maximum?: number;
      readonly minLength?: number;
      readonly maxLength?: number;
      readonly pattern?: string;
      readonly enum?: ReadonlyArray<unknown>;
      readonly const?: unknown;
      readonly oneOf?: ReadonlyArray<JsonSchemaLike>;
      readonly anyOf?: ReadonlyArray<JsonSchemaLike>;
      readonly allOf?: ReadonlyArray<JsonSchemaLike>;
    });

/**
 * Build a {@link ZodLikeSchema} that validates `data` against
 * `schema`. The returned instance follows the structural Zod
 * contract from `@graphorin/core` (a `parse` method that throws + a
 * `safeParse` method that returns a `ZodLikeSafeParseResult`).
 *
 * The validator also retains the **source JSON Schema** and exposes it
 * via `toJSON()` (tools-01): `toolToDefinition` and the code-mode
 * signature projection honour `toJSON()`, so without it an MCP tool's
 * parameters serialise to `{}` on the provider wire body — the model
 * would see an argument-less tool. Boolean schemas normalise to their
 * record equivalents (`true` → `{}`, `false` → `{ not: {} }`).
 *
 * @stable
 */
export function buildJsonSchemaValidator<T = unknown>(schema: JsonSchemaLike): ZodLikeSchema<T> {
  function parse(data: unknown): T {
    const issues = validate(data, schema, []);
    if (issues.length === 0) return data as T;
    throw buildError(issues);
  }
  function safeParse(data: unknown): ZodLikeSafeParseResult<T, unknown> {
    const issues = validate(data, schema, []);
    if (issues.length === 0) {
      return { success: true, data: data as T };
    }
    return { success: false, error: buildError(issues) };
  }
  function toJSON(): Readonly<Record<string, unknown>> {
    if (schema === true) return {};
    if (schema === false) return { not: {} };
    return schema;
  }
  return Object.freeze({ parse, safeParse, toJSON });
}

interface Issue {
  readonly path: ReadonlyArray<string | number>;
  readonly message: string;
}

function validate(
  value: unknown,
  schema: JsonSchemaLike,
  path: ReadonlyArray<string | number>,
): Issue[] {
  if (schema === true) return [];
  if (schema === false) return [{ path, message: 'rejected by schema (false)' }];

  const issues: Issue[] = [];

  if ('const' in schema && schema.const !== undefined) {
    if (!equalsDeep(value, schema.const)) {
      issues.push({ path, message: `expected const ${formatValue(schema.const)}` });
    }
  }
  if (Array.isArray(schema.enum)) {
    if (!schema.enum.some((candidate) => equalsDeep(value, candidate))) {
      issues.push({ path, message: 'value does not match any enum entry' });
    }
  }
  if (Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf) {
      issues.push(...validate(value, sub, path));
    }
  }
  if (Array.isArray(schema.anyOf)) {
    const anyOk = schema.anyOf.some((sub) => validate(value, sub, path).length === 0);
    if (!anyOk) issues.push({ path, message: 'value did not match any of the anyOf branches' });
  }
  if (Array.isArray(schema.oneOf)) {
    const matchCount = schema.oneOf.filter((sub) => validate(value, sub, path).length === 0).length;
    if (matchCount !== 1) {
      issues.push({
        path,
        message: `expected exactly one oneOf branch to match (got ${matchCount})`,
      });
    }
  }

  if (schema.type !== undefined) {
    const typeIssues = validateType(value, schema, path);
    issues.push(...typeIssues);
  }

  return issues;
}

function validateType(
  value: unknown,
  schema: JsonSchemaLike,
  path: ReadonlyArray<string | number>,
): Issue[] {
  if (schema === true || schema === false) return [];
  const types: ReadonlyArray<string> = Array.isArray(schema.type)
    ? schema.type
    : schema.type === undefined
      ? []
      : [schema.type];
  if (types.length === 0) return [];
  if (!types.some((t) => matchesType(value, t))) {
    return [{ path, message: `expected type ${types.join(' | ')}` }];
  }

  if (
    matchesType(value, 'object') &&
    (schema.properties !== undefined ||
      schema.required !== undefined ||
      schema.additionalProperties !== undefined)
  ) {
    return validateObject(value as Record<string, unknown>, schema, path);
  }
  if (matchesType(value, 'array')) {
    return validateArray(value as unknown[], schema, path);
  }
  if (matchesType(value, 'string')) {
    return validateString(value as string, schema, path);
  }
  if (matchesType(value, 'number') || matchesType(value, 'integer')) {
    return validateNumber(value as number, schema, path);
  }
  return [];
}

function validateObject(
  value: Record<string, unknown>,
  schema: JsonSchemaLike & { readonly type?: unknown },
  path: ReadonlyArray<string | number>,
): Issue[] {
  if (schema === true || schema === false) return [];
  const issues: Issue[] = [];
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (!(key in value)) {
      issues.push({ path: [...path, key], message: 'is required' });
    }
  }
  const properties = schema.properties ?? {};
  for (const [key, subSchema] of Object.entries(properties)) {
    if (!(key in value)) continue;
    issues.push(...validate(value[key], subSchema, [...path, key]));
  }
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in properties)) {
        issues.push({ path: [...path, key], message: 'unexpected additional property' });
      }
    }
  } else if (
    typeof schema.additionalProperties === 'object' &&
    schema.additionalProperties !== null
  ) {
    for (const key of Object.keys(value)) {
      if (key in properties) continue;
      issues.push(
        ...validate(value[key], schema.additionalProperties as JsonSchemaLike, [...path, key]),
      );
    }
  }
  return issues;
}

function validateArray(
  value: unknown[],
  schema: JsonSchemaLike & { readonly type?: unknown },
  path: ReadonlyArray<string | number>,
): Issue[] {
  if (schema === true || schema === false) return [];
  const issues: Issue[] = [];
  if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
    issues.push({ path, message: `expected at least ${schema.minItems} items` });
  }
  if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
    issues.push({ path, message: `expected at most ${schema.maxItems} items` });
  }
  const items = schema.items;
  if (items === undefined) return issues;
  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      if (i >= value.length) break;
      const sub = items[i];
      if (sub === undefined) continue;
      issues.push(...validate(value[i], sub, [...path, i]));
    }
  } else {
    for (let i = 0; i < value.length; i++) {
      issues.push(...validate(value[i], items as JsonSchemaLike, [...path, i]));
    }
  }
  return issues;
}

function validateString(
  value: string,
  schema: JsonSchemaLike & { readonly type?: unknown },
  path: ReadonlyArray<string | number>,
): Issue[] {
  if (schema === true || schema === false) return [];
  const issues: Issue[] = [];
  if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
    issues.push({ path, message: `expected at least ${schema.minLength} characters` });
  }
  if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
    issues.push({ path, message: `expected at most ${schema.maxLength} characters` });
  }
  if (typeof schema.pattern === 'string') {
    // mcp-skills-07: the pattern comes VERBATIM from the (untrusted)
    // MCP server and runs on every validated input — a
    // catastrophic-backtracking pattern (`(a+)+$`) plus a long
    // model-generated string stalls the agent's event loop. Guards:
    // cap the pattern and the tested-string length, and reject the
    // classic nested-quantifier shapes heuristically. A guarded-out
    // pattern degrades to permissive (same as a malformed one).
    if (
      schema.pattern.length <= MAX_PATTERN_LENGTH &&
      value.length <= MAX_PATTERN_TEST_LENGTH &&
      !looksCatastrophic(schema.pattern)
    ) {
      try {
        const re = new RegExp(schema.pattern);
        if (!re.test(value))
          issues.push({ path, message: `did not match pattern ${schema.pattern}` });
      } catch {
        // Treat malformed patterns as permissive (mirrors Ajv default).
      }
    }
  }
  return issues;
}

/** mcp-skills-07: hard caps on server-supplied `pattern` evaluation. */
const MAX_PATTERN_LENGTH = 1_000;
const MAX_PATTERN_TEST_LENGTH = 10_000;

/**
 * Cheap heuristic for the classic catastrophic-backtracking shape: a
 * group whose inner expression ends with a quantifier and which is
 * itself quantified (`(a+)+`, `(a*)*`, `(a+){2,}`, `(?:x+)*`). A
 * linear-time engine (re2) would make this exact; the heuristic errs
 * on the safe side for untrusted input, and a rejected pattern simply
 * degrades to permissive.
 */
function looksCatastrophic(pattern: string): boolean {
  return /\)[*+]|\)\{\d+,(?:\d+)?\}/.test(pattern) && /[*+}]\s*\)/.test(pattern);
}

function validateNumber(
  value: number,
  schema: JsonSchemaLike & { readonly type?: unknown },
  path: ReadonlyArray<string | number>,
): Issue[] {
  if (schema === true || schema === false) return [];
  const issues: Issue[] = [];
  const types: ReadonlyArray<string> = Array.isArray(schema.type)
    ? schema.type
    : schema.type === undefined
      ? []
      : [schema.type];
  if (types.includes('integer') && !Number.isInteger(value)) {
    issues.push({ path, message: 'expected an integer' });
  }
  if (typeof schema.minimum === 'number' && value < schema.minimum) {
    issues.push({ path, message: `expected >= ${schema.minimum}` });
  }
  if (typeof schema.maximum === 'number' && value > schema.maximum) {
    issues.push({ path, message: `expected <= ${schema.maximum}` });
  }
  return issues;
}

function matchesType(value: unknown, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'null':
      return value === null;
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

function equalsDeep(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => equalsDeep(item, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a as Record<string, unknown>);
    const bk = Object.keys(b as Record<string, unknown>);
    if (ak.length !== bk.length) return false;
    return ak.every((key) =>
      equalsDeep((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }
  return false;
}

function formatValue(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function buildError(issues: ReadonlyArray<Issue>): ZodLikeError {
  return {
    name: 'GraphorinMCPSchemaError',
    message: issues
      .map((i) => `${i.path.length === 0 ? '.' : i.path.join('.')}: ${i.message}`)
      .join('; '),
    issues: Object.freeze(
      issues.map((i) => ({ path: Object.freeze([...i.path]), message: i.message })),
    ),
  };
}
