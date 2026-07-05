/**
 * Tool-definition pinning (MC-6): stable fingerprints over MCP tool
 * definitions so approve-then-swap rug-pulls - a server changing a
 * tool's description/schema behind an already-approved name - are
 * detectable across snapshots and process restarts.
 *
 * The fingerprint is a sha256 over a key-sorted canonical render of
 * `{ name, description, inputSchema, outputSchema, title }`. Operators
 * persist the stamped `__definitionHash` (or read it from the audit
 * trail) and pass it back via `toTools({ pinnedFingerprints })`.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';

import type { MCPToolDefinition } from './types.js';

/** Deterministic JSON render: object keys sorted recursively. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * Stable sha256 fingerprint of one MCP tool definition (MC-6).
 *
 * @stable
 */
export function computeToolDefinitionHash(def: MCPToolDefinition): string {
  const canonical = stableStringify({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema,
    ...(def.outputSchema !== undefined ? { outputSchema: def.outputSchema } : {}),
    ...(def.title !== undefined ? { title: def.title } : {}),
  });
  return createHash('sha256').update(canonical).digest('hex');
}
