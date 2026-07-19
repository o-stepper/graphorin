/**
 * Zod-to-JSON-Schema projection.
 *
 * Providers speak JSON Schema: an OpenAI-shaped `tools[].function.parameters`
 * block, an Anthropic `input_schema`, a code-mode signature - all of them
 * need `{ type: 'object', properties: ... }`, not a live validator object.
 * The documented way to declare a Graphorin tool is a plain Zod schema,
 * and Zod schemas (v3 and v4 alike) have **no `toJSON()`**: serialising one
 * yields `{"_def":{...}}` internals that no model can read. This module is
 * the single shared converter that closes that gap for
 * `toolToDefinition` (agent), the code-mode signature projection, and
 * `ToolSearchMatch`.
 *
 * Design constraints, in order:
 *
 * 1. **Synchronous and dependency-free.** The call sites are sync and the
 *    package must not grow a `zod-to-json-schema` dependency (its zod v3
 *    peer range conflicts with our `^3.23 || ^4` peer). The converter walks
 *    Zod's *structural* internals instead: `_def.typeName` for v3 classic,
 *    `_zod.def.type` for v4 - so it also works on schema instances created
 *    by a different `zod` copy than the one this package resolves.
 * 2. **Loud, bounded degradation.** A node kind the walker does not know
 *    projects to `{}` (accept-anything) and reports through
 *    {@link ProjectSchemaOptions.onUnsupported} - never a throw, never
 *    silent garbage. Cycles and pathological depth degrade the same way.
 * 3. **Passthrough only for actual JSON Schema.** A plain data object with
 *    no `parse`/`safeParse` functions is assumed to already *be* JSON
 *    Schema and passes through untouched. A validator-like object that is
 *    neither Zod nor `toJSON()`-bearing projects to `undefined` (the
 *    caller substitutes `{}`), because serialising it would ship garbage.
 *
 * @packageDocumentation
 */

/** A (loose) JSON Schema document produced by the projection. */
export type JsonSchemaRecord = Record<string, unknown>;

/** Options for {@link projectSchemaToJsonSchema}. */
export interface ProjectSchemaOptions {
  /**
   * Called (at most once per distinct reason per call) when a schema node
   * cannot be represented and degrades to permissive `{}` - or when a
   * validator-like object cannot be projected at all. Wire this to a
   * counter/audit emitter; the converter itself never logs.
   */
  readonly onUnsupported?: (detail: string) => void;
}

/** Recursion guard: generous for real tools, tight enough to stop runaways. */
const MAX_DEPTH = 24;

interface WalkContext {
  readonly seen: Set<object>;
  readonly report: (detail: string) => void;
}

/* ------------------------------------------------------------------ *
 * Detection
 * ------------------------------------------------------------------ */

/** Structural view of a Zod v4 schema (`zod@4` or the `zod/v4` subpath of 3.25+). */
interface ZodV4Like {
  readonly _zod: { readonly def: { readonly type: string } & Record<string, unknown> };
}

/** Structural view of a Zod v3 classic schema. */
interface ZodV3Like {
  readonly _def: { readonly typeName: string } & Record<string, unknown>;
}

/**
 * `true` when `value` is a Zod **v4** schema instance. v4 instances carry a
 * versioned `_zod` internals bag (they also carry `_def`, so this check
 * must run before the v3 one).
 */
export function isZodV4Schema(value: unknown): value is ZodV4Like {
  if (typeof value !== 'object' || value === null) return false;
  const internals = (value as { _zod?: unknown })._zod;
  if (typeof internals !== 'object' || internals === null) return false;
  const def = (internals as { def?: unknown }).def;
  return (
    typeof def === 'object' && def !== null && typeof (def as { type?: unknown }).type === 'string'
  );
}

/** `true` when `value` is a Zod **v3 classic** schema instance. */
export function isZodV3Schema(value: unknown): value is ZodV3Like {
  if (typeof value !== 'object' || value === null) return false;
  if (isZodV4Schema(value)) return false;
  const def = (value as { _def?: unknown })._def;
  if (typeof def !== 'object' || def === null) return false;
  const typeName = (def as { typeName?: unknown }).typeName;
  return (
    typeof typeName === 'string' &&
    typeName.startsWith('Zod') &&
    typeof (value as { safeParse?: unknown }).safeParse === 'function'
  );
}

/** `true` when `value` is a Zod schema instance of either major line. */
export function isZodSchema(value: unknown): boolean {
  return isZodV4Schema(value) || isZodV3Schema(value);
}

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

/** Read a schema's `.description` (getter on both lines) without trusting it. */
function readDescription(schema: unknown): string | undefined {
  try {
    const description = (schema as { description?: unknown }).description;
    return typeof description === 'string' && description.length > 0 ? description : undefined;
  } catch {
    return undefined;
  }
}

/** Attach `description` (and optionally `default`) onto a converted node. */
function annotate(
  node: JsonSchemaRecord,
  schema: unknown,
  extras?: JsonSchemaRecord,
): JsonSchemaRecord {
  const description = readDescription(schema);
  // Node-level keys win over an outer wrapper's annotation.
  return {
    ...(description !== undefined ? { description } : {}),
    ...extras,
    ...node,
  };
}

/** A JSON-representable primitive usable in `enum` / `const`. */
function isEnumerablePrimitive(value: unknown): value is string | number | boolean | null {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/** `const` node with an inferred `type` when the value is primitive. */
function constNode(value: unknown): JsonSchemaRecord {
  if (value === null) return { type: 'null', const: null };
  const t = typeof value;
  if (t === 'string' || t === 'boolean') return { type: t, const: value };
  if (t === 'number') return { type: 'number', const: value };
  if (t === 'bigint') return { type: 'integer', const: Number(value) };
  return { const: value };
}

/** Wrap `inner` as nullable (`anyOf` with `{type:'null'}`), idempotently. */
function nullable(inner: JsonSchemaRecord): JsonSchemaRecord {
  const branches = Array.isArray(inner.anyOf) ? (inner.anyOf as JsonSchemaRecord[]) : undefined;
  if (branches?.some((b) => b.type === 'null')) return inner;
  return { anyOf: [inner, { type: 'null' }] };
}

/** Map a Zod string-format name onto the JSON Schema `format` vocabulary. */
function mapStringFormat(format: string): string | undefined {
  switch (format) {
    case 'email':
      return 'email';
    case 'url':
      return 'uri';
    case 'uuid':
    case 'guid':
      return 'uuid';
    case 'datetime':
    case 'iso_datetime':
      return 'date-time';
    case 'date':
    case 'iso_date':
      return 'date';
    case 'time':
    case 'iso_time':
      return 'time';
    case 'duration':
    case 'iso_duration':
      return 'duration';
    case 'ipv4':
      return 'ipv4';
    case 'ipv6':
      return 'ipv6';
    default:
      return undefined;
  }
}

/** Extract native-enum member values, dropping numeric reverse mappings. */
function nativeEnumValues(values: Record<string, unknown>): Array<string | number> {
  const out: Array<string | number> = [];
  for (const [key, value] of Object.entries(values)) {
    // TypeScript numeric enums add reverse `"1": "Name"` entries; a key that
    // parses as a number is a reverse mapping, not a member name.
    if (!Number.isNaN(Number(key))) continue;
    if (typeof value === 'string' || typeof value === 'number') out.push(value);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Zod v3 classic walker (`_def.typeName`)
 * ------------------------------------------------------------------ */

type V3Def = { readonly typeName: string } & Record<string, unknown>;

function v3Def(schema: unknown): V3Def | undefined {
  const def = (schema as { _def?: unknown } | null)?._def;
  if (typeof def !== 'object' || def === null) return undefined;
  return def as V3Def;
}

/** Is this v3 property schema optional at the object level? Structural walk. */
function v3IsOptional(schema: unknown, hops = 0): boolean {
  if (hops > MAX_DEPTH) return false;
  const def = v3Def(schema);
  if (def === undefined) return false;
  switch (def.typeName) {
    case 'ZodOptional':
    case 'ZodDefault':
    case 'ZodCatch':
    case 'ZodUndefined':
      return true;
    case 'ZodNullable':
    case 'ZodReadonly':
    case 'ZodBranded':
      return v3IsOptional(def.innerType ?? def.type, hops + 1);
    case 'ZodEffects':
      return v3IsOptional(def.schema, hops + 1);
    case 'ZodPipeline':
      return v3IsOptional(def.in, hops + 1);
    case 'ZodLazy':
      try {
        return v3IsOptional((def.getter as () => unknown)(), hops + 1);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

function convertV3(schema: ZodV3Like, ctx: WalkContext, depth: number): JsonSchemaRecord {
  if (depth > MAX_DEPTH) {
    ctx.report('max-depth');
    return {};
  }
  if (ctx.seen.has(schema)) return {}; // cyclic (z.lazy) - permissive terminator
  ctx.seen.add(schema);
  try {
    return annotate(convertV3Node(schema._def, ctx, depth), schema);
  } finally {
    ctx.seen.delete(schema);
  }
}

function convertV3Node(def: V3Def, ctx: WalkContext, depth: number): JsonSchemaRecord {
  const walk = (inner: unknown): JsonSchemaRecord => convertAny(inner, ctx, depth + 1);

  switch (def.typeName) {
    case 'ZodString': {
      const node: JsonSchemaRecord = { type: 'string' };
      for (const check of asArray(def.checks)) {
        const c = check as { kind?: unknown; value?: unknown; regex?: unknown };
        switch (c.kind) {
          case 'min':
            if (typeof c.value === 'number') node.minLength = c.value;
            break;
          case 'max':
            if (typeof c.value === 'number') node.maxLength = c.value;
            break;
          case 'length':
            if (typeof c.value === 'number') {
              node.minLength = c.value;
              node.maxLength = c.value;
            }
            break;
          case 'regex':
            if (c.regex instanceof RegExp) node.pattern = c.regex.source;
            break;
          default: {
            const format = typeof c.kind === 'string' ? mapStringFormat(c.kind) : undefined;
            if (format !== undefined) node.format = format;
          }
        }
      }
      return node;
    }
    case 'ZodNumber': {
      const node: JsonSchemaRecord = { type: 'number' };
      for (const check of asArray(def.checks)) {
        const c = check as { kind?: unknown; value?: unknown; inclusive?: unknown };
        switch (c.kind) {
          case 'int':
            node.type = 'integer';
            break;
          case 'min':
            if (typeof c.value === 'number') {
              if (c.inclusive === false) node.exclusiveMinimum = c.value;
              else node.minimum = c.value;
            }
            break;
          case 'max':
            if (typeof c.value === 'number') {
              if (c.inclusive === false) node.exclusiveMaximum = c.value;
              else node.maximum = c.value;
            }
            break;
          case 'multipleOf':
            if (typeof c.value === 'number') node.multipleOf = c.value;
            break;
          default:
            break; // finite/other refinements have no JSON Schema mirror
        }
      }
      return node;
    }
    case 'ZodBigInt':
      return { type: 'integer' };
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodDate':
      return { type: 'string', format: 'date-time' };
    case 'ZodNull':
      return { type: 'null' };
    case 'ZodNaN':
      return { type: 'number' };
    case 'ZodAny':
    case 'ZodUnknown':
    case 'ZodUndefined':
    case 'ZodVoid':
      return {};
    case 'ZodNever':
      return { not: {} };
    case 'ZodLiteral':
      return constNode(def.value);
    case 'ZodEnum': {
      const values = asArray(def.values).filter(isEnumerablePrimitive);
      return { type: 'string', enum: values };
    }
    case 'ZodNativeEnum': {
      const values = nativeEnumValues((def.values ?? {}) as Record<string, unknown>);
      const node: JsonSchemaRecord = { enum: values };
      if (values.every((v) => typeof v === 'string')) node.type = 'string';
      else if (values.every((v) => typeof v === 'number')) node.type = 'number';
      return node;
    }
    case 'ZodObject': {
      const shapeSource = def.shape;
      const shape = (typeof shapeSource === 'function' ? shapeSource() : shapeSource) as Record<
        string,
        unknown
      > | null;
      const properties: JsonSchemaRecord = {};
      const required: string[] = [];
      for (const [key, prop] of Object.entries(shape ?? {})) {
        properties[key] = walk(prop);
        if (!v3IsOptional(prop)) required.push(key);
      }
      const node: JsonSchemaRecord = { type: 'object', properties };
      if (required.length > 0) node.required = required;
      const catchallDef = v3Def(def.catchall);
      if (catchallDef !== undefined && catchallDef.typeName !== 'ZodNever') {
        node.additionalProperties = walk(def.catchall);
      } else if (def.unknownKeys === 'strict') {
        node.additionalProperties = false;
      } else if (def.unknownKeys === 'passthrough') {
        node.additionalProperties = true;
      }
      return node;
    }
    case 'ZodArray': {
      const node: JsonSchemaRecord = { type: 'array', items: walk(def.type) };
      const min = (def.minLength as { value?: unknown } | null)?.value;
      const max = (def.maxLength as { value?: unknown } | null)?.value;
      const exact = (def.exactLength as { value?: unknown } | null)?.value;
      if (typeof min === 'number') node.minItems = min;
      if (typeof max === 'number') node.maxItems = max;
      if (typeof exact === 'number') {
        node.minItems = exact;
        node.maxItems = exact;
      }
      return node;
    }
    case 'ZodTuple': {
      const items = asArray(def.items).map(walk);
      const node: JsonSchemaRecord = { type: 'array', prefixItems: items };
      if (def.rest !== undefined && def.rest !== null) node.items = walk(def.rest);
      return node;
    }
    case 'ZodRecord':
      return { type: 'object', additionalProperties: walk(def.valueType) };
    case 'ZodSet': {
      const node: JsonSchemaRecord = {
        type: 'array',
        uniqueItems: true,
        items: walk(def.valueType),
      };
      const minSize = (def.minSize as { value?: unknown } | null)?.value;
      const maxSize = (def.maxSize as { value?: unknown } | null)?.value;
      if (typeof minSize === 'number') node.minItems = minSize;
      if (typeof maxSize === 'number') node.maxItems = maxSize;
      return node;
    }
    case 'ZodUnion':
    case 'ZodDiscriminatedUnion': {
      const options = def.options instanceof Map ? [...def.options.values()] : asArray(def.options);
      return { anyOf: options.map(walk) };
    }
    case 'ZodIntersection':
      return { allOf: [walk(def.left), walk(def.right)] };
    case 'ZodOptional':
      return walk(def.innerType);
    case 'ZodNullable':
      return nullable(walk(def.innerType));
    case 'ZodDefault': {
      const inner = walk(def.innerType);
      try {
        const value = (def.defaultValue as () => unknown)();
        if (value !== undefined) return { ...inner, default: value };
      } catch {
        // a throwing default factory contributes no `default` annotation
      }
      return inner;
    }
    case 'ZodCatch':
      return walk(def.innerType);
    case 'ZodEffects':
      // refine/transform/preprocess: the wrapped schema is the model-facing
      // input shape (transform output types are an executor concern).
      return walk(def.schema);
    case 'ZodLazy':
      try {
        return walk((def.getter as () => unknown)());
      } catch {
        ctx.report('lazy-getter-threw');
        return {};
      }
    case 'ZodPromise':
      return walk(def.type);
    case 'ZodBranded':
      return walk(def.type);
    case 'ZodReadonly':
      return walk(def.innerType);
    case 'ZodPipeline':
      return walk(def.in);
    default:
      ctx.report(`zod-v3:${def.typeName}`);
      return {};
  }
}

/* ------------------------------------------------------------------ *
 * Zod v4 walker (`_zod.def.type`)
 * ------------------------------------------------------------------ */

type V4Def = { readonly type: string } & Record<string, unknown>;

function v4Def(schema: unknown): V4Def | undefined {
  const internals = (schema as { _zod?: { def?: unknown } } | null)?._zod;
  const def = internals?.def;
  if (typeof def !== 'object' || def === null) return undefined;
  return def as V4Def;
}

/** v4 exposes optionality directly: `_zod.optin === 'optional'`. */
function v4IsOptional(schema: unknown): boolean {
  try {
    return (schema as { _zod?: { optin?: unknown } } | null)?._zod?.optin === 'optional';
  } catch {
    return false;
  }
}

/** Normalised view of a v4 check payload (`checks[i]._zod.def`). */
function v4CheckDef(check: unknown): Record<string, unknown> | undefined {
  const def = (check as { _zod?: { def?: unknown } } | null)?._zod?.def;
  if (typeof def === 'object' && def !== null) return def as Record<string, unknown>;
  return undefined;
}

function convertV4(schema: ZodV4Like, ctx: WalkContext, depth: number): JsonSchemaRecord {
  if (depth > MAX_DEPTH) {
    ctx.report('max-depth');
    return {};
  }
  if (ctx.seen.has(schema)) return {};
  ctx.seen.add(schema);
  try {
    return annotate(convertV4Node(schema._zod.def, ctx, depth), schema);
  } finally {
    ctx.seen.delete(schema);
  }
}

/** Apply a v4 `checks` array onto a string/number/array node. */
function applyV4Checks(
  node: JsonSchemaRecord,
  checks: unknown,
  kind: 'string' | 'number' | 'array',
): void {
  for (const check of asArray(checks)) {
    const c = v4CheckDef(check);
    if (c === undefined) continue;
    switch (c.check) {
      case 'min_length':
        if (typeof c.minimum === 'number') {
          if (kind === 'array') node.minItems = c.minimum;
          else node.minLength = c.minimum;
        }
        break;
      case 'max_length':
        if (typeof c.maximum === 'number') {
          if (kind === 'array') node.maxItems = c.maximum;
          else node.maxLength = c.maximum;
        }
        break;
      case 'length_equals':
        if (typeof c.length === 'number') {
          if (kind === 'array') {
            node.minItems = c.length;
            node.maxItems = c.length;
          } else {
            node.minLength = c.length;
            node.maxLength = c.length;
          }
        }
        break;
      case 'greater_than':
        if (typeof c.value === 'number') {
          if (c.inclusive === true) node.minimum = c.value;
          else node.exclusiveMinimum = c.value;
        }
        break;
      case 'less_than':
        if (typeof c.value === 'number') {
          if (c.inclusive === true) node.maximum = c.value;
          else node.exclusiveMaximum = c.value;
        }
        break;
      case 'multiple_of':
        if (typeof c.value === 'number') node.multipleOf = c.value;
        break;
      case 'number_format':
        if (typeof c.format === 'string' && c.format.includes('int')) node.type = 'integer';
        break;
      case 'string_format': {
        if (typeof c.format !== 'string') break;
        const mapped = mapStringFormat(c.format);
        if (mapped !== undefined) node.format = mapped;
        else if (c.format === 'regex' && c.pattern instanceof RegExp) {
          node.pattern = c.pattern.source;
        }
        break;
      }
      default:
        break;
    }
  }
}

/** v4 numeric format names that narrow `number` to JSON Schema `integer`. */
function v4IsIntegerFormat(format: unknown): boolean {
  return typeof format === 'string' && format.includes('int');
}

function convertV4Node(def: V4Def, ctx: WalkContext, depth: number): JsonSchemaRecord {
  const walk = (inner: unknown): JsonSchemaRecord => convertAny(inner, ctx, depth + 1);

  switch (def.type) {
    case 'string': {
      const node: JsonSchemaRecord = { type: 'string' };
      // Top-level format types (z.email(), z.uuid(), ...) carry `def.format`.
      if (typeof def.format === 'string') {
        const mapped = mapStringFormat(def.format);
        if (mapped !== undefined) node.format = mapped;
      }
      applyV4Checks(node, def.checks, 'string');
      return node;
    }
    case 'number': {
      const node: JsonSchemaRecord = {
        type: v4IsIntegerFormat(def.format) ? 'integer' : 'number',
      };
      applyV4Checks(node, def.checks, 'number');
      return node;
    }
    case 'int':
      return { type: 'integer' };
    case 'bigint':
      return { type: 'integer' };
    case 'boolean':
      return { type: 'boolean' };
    case 'date':
      return { type: 'string', format: 'date-time' };
    case 'null':
      return { type: 'null' };
    case 'nan':
      return { type: 'number' };
    case 'any':
    case 'unknown':
    case 'undefined':
    case 'void':
      return {};
    case 'never':
      return { not: {} };
    case 'literal': {
      const values = asArray(def.values).filter((v) => v !== undefined);
      if (values.length === 1) return constNode(values[0]);
      return { enum: values.filter(isEnumerablePrimitive) };
    }
    case 'enum': {
      const values = Object.values((def.entries ?? {}) as Record<string, unknown>).filter(
        isEnumerablePrimitive,
      );
      const node: JsonSchemaRecord = { enum: values };
      if (values.every((v) => typeof v === 'string')) node.type = 'string';
      else if (values.every((v) => typeof v === 'number')) node.type = 'number';
      return node;
    }
    case 'object': {
      const shape = (def.shape ?? {}) as Record<string, unknown>;
      const properties: JsonSchemaRecord = {};
      const required: string[] = [];
      for (const [key, prop] of Object.entries(shape)) {
        properties[key] = walk(prop);
        if (!v4IsOptional(prop)) required.push(key);
      }
      const node: JsonSchemaRecord = { type: 'object', properties };
      if (required.length > 0) node.required = required;
      const catchall = def.catchall;
      if (catchall !== undefined && catchall !== null) {
        const catchallDef = v4Def(catchall);
        if (catchallDef?.type === 'never') node.additionalProperties = false;
        else node.additionalProperties = walk(catchall);
      }
      return node;
    }
    case 'array': {
      const node: JsonSchemaRecord = { type: 'array', items: walk(def.element) };
      applyV4Checks(node, def.checks, 'array');
      return node;
    }
    case 'tuple': {
      const items = asArray(def.items).map(walk);
      const node: JsonSchemaRecord = { type: 'array', prefixItems: items };
      if (def.rest !== undefined && def.rest !== null) node.items = walk(def.rest);
      return node;
    }
    case 'record':
      return { type: 'object', additionalProperties: walk(def.valueType) };
    case 'map': {
      ctx.report('zod-v4:map');
      return {};
    }
    case 'set':
      return { type: 'array', uniqueItems: true, items: walk(def.valueType) };
    case 'union':
      return { anyOf: asArray(def.options).map(walk) };
    case 'intersection':
      return { allOf: [walk(def.left), walk(def.right)] };
    case 'optional':
    case 'nonoptional':
      return walk(def.innerType);
    case 'nullable':
      return nullable(walk(def.innerType));
    case 'default':
    case 'prefault': {
      const inner = walk(def.innerType);
      try {
        const raw = def.defaultValue;
        const value = typeof raw === 'function' ? (raw as () => unknown)() : raw;
        if (value !== undefined) return { ...inner, default: value };
      } catch {
        // a throwing default factory contributes no `default` annotation
      }
      return inner;
    }
    case 'catch':
      return walk(def.innerType);
    case 'readonly':
      return walk(def.innerType);
    case 'pipe':
      // The `in` side is what the model must produce; `out` is post-transform.
      return walk(def.in);
    case 'lazy':
      try {
        return walk((def.getter as () => unknown)());
      } catch {
        ctx.report('lazy-getter-threw');
        return {};
      }
    case 'promise':
      return walk(def.innerType ?? def.type);
    case 'template_literal':
      return { type: 'string' };
    case 'success':
      return { type: 'boolean' };
    case 'transform':
    case 'custom':
    case 'function':
    case 'symbol':
    case 'file':
      ctx.report(`zod-v4:${def.type}`);
      return {};
    default:
      ctx.report(`zod-v4:${def.type}`);
      return {};
  }
}

/* ------------------------------------------------------------------ *
 * Entry points
 * ------------------------------------------------------------------ */

function asArray(value: unknown): ReadonlyArray<unknown> {
  return Array.isArray(value) ? value : [];
}

function convertAny(schema: unknown, ctx: WalkContext, depth: number): JsonSchemaRecord {
  if (isZodV4Schema(schema)) return convertV4(schema, ctx, depth);
  if (isZodV3Schema(schema)) return convertV3(schema, ctx, depth);
  ctx.report('non-zod-node');
  return {};
}

/**
 * Convert a Zod schema instance (v3 classic or v4) to a JSON Schema
 * record. Structural: works across `zod` copies and never executes user
 * validation code (only `default` factories and `lazy` getters, both
 * guarded). Unknown node kinds degrade to permissive `{}` and are
 * reported via `onUnsupported`.
 *
 * @stable
 */
export function zodToJsonSchema(
  schema: unknown,
  opts: ProjectSchemaOptions = {},
): JsonSchemaRecord {
  const reported = new Set<string>();
  const ctx: WalkContext = {
    seen: new Set(),
    report: (detail) => {
      if (reported.has(detail)) return;
      reported.add(detail);
      opts.onUnsupported?.(detail);
    },
  };
  return convertAny(schema, ctx, 0);
}

/** Keys that mark a plain object as "already JSON Schema". */
const JSON_SCHEMA_MARKERS = [
  'type',
  'properties',
  'items',
  'anyOf',
  'oneOf',
  'allOf',
  'enum',
  'const',
  '$ref',
  '$defs',
  'not',
  'additionalProperties',
  'required',
] as const;

/**
 * `true` when `value` is plain JSON-Schema-shaped data: an object with no
 * validator methods that either is empty or carries at least one JSON
 * Schema keyword.
 */
export function looksLikeJsonSchema(value: unknown): value is JsonSchemaRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.parse === 'function' || typeof candidate.safeParse === 'function') {
    return false;
  }
  const keys = Object.keys(candidate);
  if (keys.length === 0) return true;
  return JSON_SCHEMA_MARKERS.some((marker) => marker in candidate);
}

/**
 * Project a tool's declared `inputSchema` / `outputSchema` - whatever the
 * author supplied - onto a JSON Schema record fit for a provider wire
 * body or a code-mode signature. Resolution order:
 *
 * 1. `undefined`/`null` → `undefined`.
 * 2. A `toJSON()` method → its result (MCP validators, hand-rolled
 *    schemas; a throwing/non-object `toJSON` falls through).
 * 3. A Zod v4 or v3 schema → {@link zodToJsonSchema}.
 * 4. Plain JSON-Schema-shaped data → passed through as-is.
 * 5. Anything else (an opaque validator this converter cannot read) →
 *    `undefined`, reported via `onUnsupported` - callers substitute a
 *    permissive `{}` rather than shipping serialized internals.
 *
 * @stable
 */
export function projectSchemaToJsonSchema(
  raw: unknown,
  opts: ProjectSchemaOptions = {},
): JsonSchemaRecord | undefined {
  if (raw === null || raw === undefined) return undefined;
  const toJson = (raw as { toJSON?: () => unknown }).toJSON;
  if (typeof toJson === 'function') {
    try {
      const json = toJson.call(raw);
      if (json !== null && typeof json === 'object' && !Array.isArray(json)) {
        return json as JsonSchemaRecord;
      }
    } catch {
      // fall through to the structural paths
    }
  }
  if (isZodSchema(raw)) return zodToJsonSchema(raw, opts);
  if (looksLikeJsonSchema(raw)) return raw;
  opts.onUnsupported?.('unprojectable-schema');
  return undefined;
}
