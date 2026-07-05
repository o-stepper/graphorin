/**
 * Inbound prompt-injection filtering for the `toTools()` adapter
 * (extracted from `to-tools.ts` per F-MCP-001).
 *
 * Owns: the per-server inbound-sanitization default, the once-per-server
 * `pass-through` override WARN, and the tool-description strip applied at
 * registration time. The trust class is pinned to `'mcp-derived'` for
 * every produced tool so the agent runtime's per-step preamble fires
 * regardless of the body-level policy chosen here.
 *
 * @packageDocumentation
 */

import type { InboundSanitizationPolicy } from '@graphorin/core';
import { incrementCounter } from '@graphorin/tools/audit';
import { applyInboundSanitization } from '@graphorin/tools/inbound';
import type { JsonSchemaLike } from '../registry/json-schema.js';
import type { ServerIdentity } from '../transport/types.js';

/** Operator-supplied structured logger (mirrors the client logger shape). */
type AdapterLogger = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  fields?: Record<string, unknown>,
) => void;

/**
 * Process-scoped dedup keys for the `pass-through` override WARN. The
 * spec mandates exactly-one WARN per server identity per process - the
 * Set retains the keys for the lifetime of the process. Tests reset via
 * {@link import('./to-tools.js')._resetMcpAdapterDedupForTesting}.
 */
const passthroughWarnSeen = new Set<string>();

/**
 * Reset the inbound-filter dedup set. Used by
 * {@link import('./to-tools.js')._resetMcpAdapterDedupForTesting}.
 *
 * @experimental
 */
export function _resetInboundFiltersDedupForTesting(): void {
  passthroughWarnSeen.clear();
}

/**
 * Resolve the effective per-server inbound-sanitization policy. MCP
 * tools default to the strictest body-level policy.
 */
export function resolveInboundPolicy(
  override: InboundSanitizationPolicy | undefined,
): InboundSanitizationPolicy {
  return override ?? 'detect-and-strip-and-wrap';
}

/**
 * WARN-once per server when the operator opts out of body-level
 * sanitization. The trust class stays `'mcp-derived'` regardless so the
 * per-step preamble in the agent runtime still fires; the WARN exists so
 * the audit log records the operator's deliberate choice.
 */
export function warnOnPassthroughOverride(args: {
  readonly resolvedInbound: InboundSanitizationPolicy;
  readonly serverIdentity: ServerIdentity;
  readonly logger?: AdapterLogger;
}): void {
  if (args.resolvedInbound !== 'pass-through') return;
  if (passthroughWarnSeen.has(args.serverIdentity.id)) return;
  passthroughWarnSeen.add(args.serverIdentity.id);
  incrementCounter('mcp.inbound.sanitization.passthrough-override.warn.total', {
    server: args.serverIdentity.id,
  });
  if (args.logger !== undefined) {
    args.logger('warn', 'mcp.inbound.sanitization.passthrough-override', {
      server: args.serverIdentity.id,
      policy: 'pass-through',
      note: "Body-level prompt-injection sanitization is disabled for this MCP server; the trust class remains 'mcp-derived' so the per-step preamble still fires. The WARN cannot be silenced (deliberate operator-friction).",
    });
  }
}

/**
 * Strip imperative payloads from a tool description before it enters the
 * per-step tool catalogue. The description is never wrapped in the
 * `<<<untrusted_content>>>` envelope (the wrap is reserved for tool
 * result bodies emitted into the conversation history).
 */
export function sanitizeDescription(args: {
  readonly description: string;
  readonly inboundSanitization: InboundSanitizationPolicy;
  readonly toolName: string;
  readonly serverIdentity: ServerIdentity;
}): string {
  const stripPolicy: InboundSanitizationPolicy =
    args.inboundSanitization === 'pass-through' ? 'pass-through' : 'detect-and-strip';
  const outcome = applyInboundSanitization({
    body: args.description,
    policy: stripPolicy,
    trustClass: 'mcp-derived',
    toolName: args.toolName,
    contentOrigin: `mcp:tool-description:${args.serverIdentity.id}`,
    failClosed: false,
  });
  // C6: tool-description poisoning is a registration-time SIGNAL, not
  // just a silent strip - count it so operators see which server ships
  // imperative-laden descriptions (Invariant Labs tool-poisoning class).
  if (outcome.patternsHit.length > 0) {
    incrementCounter('mcp.tool-description.injection-flagged.total', {
      server: args.serverIdentity.id,
      tool: args.toolName,
    });
  }
  return outcome.body;
}

/**
 * Result of {@link sanitizeSchemaAnnotations}: the sanitized COPY of
 * the schema (the input document is never mutated) plus the pattern
 * names that fired anywhere inside it.
 */
export interface SanitizedSchemaResult {
  readonly schema: JsonSchemaLike;
  readonly patternsHit: ReadonlyArray<string>;
}

// JSON Schema keys whose STRING values are pure annotations shown to
// the model - the exact hiding place of the published Invariant Labs
// tool-poisoning attacks. Only these are sanitized; semantic keywords
// (`enum`, `const`, `pattern`, `required`, property names) participate
// in input validation and MUST stay byte-identical.
const ANNOTATION_STRING_KEYS = new Set(['description', 'title', '$comment']);
// Keys whose value is a single sub-schema (or, for `items`, a tuple of
// sub-schemas).
const SCHEMA_VALUE_KEYS = new Set([
  'items',
  'additionalProperties',
  'not',
  'if',
  'then',
  'else',
  'contains',
  'propertyNames',
]);
// Keys whose value is a list of sub-schemas.
const SCHEMA_LIST_KEYS = new Set(['oneOf', 'anyOf', 'allOf', 'prefixItems']);
// Keys whose value is a record of named sub-schemas.
const SCHEMA_RECORD_KEYS = new Set([
  'properties',
  '$defs',
  'definitions',
  'patternProperties',
  'dependentSchemas',
]);

/**
 * Strip imperative payloads from the ANNOTATION strings of an MCP tool
 * JSON Schema (`description` / `title` / `$comment` / string
 * `examples`) at any nesting depth, before the schema reaches the
 * provider wire and the `tool_search` projection (W-018, the Invariant
 * Labs tool-poisoning vector `properties.query.description`).
 *
 * Design choices:
 *
 * - Strip, never wrap: the result must remain a valid JSON Schema
 *   document; an `<<<untrusted_content>>>` envelope would break the
 *   structure.
 * - Returns a recursively cloned COPY and never mutates the input.
 *   The caller keeps hashing the RAW definition
 *   (`computeToolDefinitionHash`), so existing TOFU pins stay valid
 *   and drift detection still sees the original bytes - two
 *   differently-poisoned schemas must not collapse into one redacted
 *   hash.
 * - Semantic keywords and unknown vocabulary are cloned byte-identical
 *   (annotation keys are a whitelist, not a blacklist), so input
 *   validation behaves exactly as with the raw schema.
 * - `'pass-through'` returns the input as-is (operator override, same
 *   contract as {@link sanitizeDescription}).
 */
export function sanitizeSchemaAnnotations(args: {
  readonly schema: JsonSchemaLike;
  readonly inboundSanitization: InboundSanitizationPolicy;
  readonly toolName: string;
  readonly serverIdentity: ServerIdentity;
}): SanitizedSchemaResult {
  if (args.inboundSanitization === 'pass-through') {
    return { schema: args.schema, patternsHit: Object.freeze<string[]>([]) };
  }
  const hits = new Set<string>();
  const sanitizeString = (body: string): string => {
    const outcome = applyInboundSanitization({
      body,
      policy: 'detect-and-strip',
      trustClass: 'mcp-derived',
      toolName: args.toolName,
      contentOrigin: `mcp:tool-schema:${args.serverIdentity.id}`,
      failClosed: false,
    });
    for (const hit of outcome.patternsHit) hits.add(hit);
    return outcome.body;
  };
  const schema = walkSchema(args.schema, sanitizeString) as JsonSchemaLike;
  if (hits.size > 0) {
    // Registration-time signal, mirroring the description counter (C6).
    incrementCounter('mcp.tool-schema.injection-flagged.total', {
      server: args.serverIdentity.id,
      tool: args.toolName,
    });
  }
  return { schema, patternsHit: Object.freeze([...hits]) };
}

function walkSchema(node: unknown, sanitizeString: (body: string) => string): unknown {
  if (node === null || typeof node !== 'object') return node;
  if (Array.isArray(node)) return node.map((el) => walkSchema(el, sanitizeString));
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (ANNOTATION_STRING_KEYS.has(key) && typeof value === 'string') {
      out[key] = sanitizeString(value);
    } else if (key === 'examples' && Array.isArray(value)) {
      out[key] = value.map((el) => (typeof el === 'string' ? sanitizeString(el) : cloneJson(el)));
    } else if (SCHEMA_VALUE_KEYS.has(key)) {
      out[key] = walkSchema(value, sanitizeString);
    } else if (SCHEMA_LIST_KEYS.has(key) && Array.isArray(value)) {
      out[key] = value.map((el) => walkSchema(el, sanitizeString));
    } else if (
      SCHEMA_RECORD_KEYS.has(key) &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const record: Record<string, unknown> = {};
      for (const [name, sub] of Object.entries(value)) {
        record[name] = walkSchema(sub, sanitizeString);
      }
      out[key] = record;
    } else {
      out[key] = cloneJson(value);
    }
  }
  return out;
}

/** Deep JSON clone that keeps semantic keyword values byte-identical. */
function cloneJson(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  return structuredClone(value);
}
