/**
 * Project the tool registry as a typed code API (P1-2, step 1).
 *
 * Code-mode lets the model write a script that calls tools instead of
 * emitting one provider tool-call per step. For that the model needs to
 * *see* the callable surface: the tool names, what each does, and the
 * shape of its arguments. {@link projectToolApi} turns a set of resolved
 * tools into:
 *
 * - a compact **catalogue** (name + one-line description, grouped by
 *   `ToolSource`) cheap enough to embed in the `code_execute` tool
 *   description — the model's "tools filesystem" map; and
 * - a per-tool **signature** (`function name(input: …): Promise<…>`,
 *   with the argument type rendered best-effort from the tool's JSON
 *   Schema) that `code_search` returns on demand — progressive
 *   disclosure, so the full parameter detail is fetched only when the
 *   model asks for it.
 *
 * The renderer is deliberately best-effort: a tool whose `inputSchema`
 * does not expose a `toJSON()` JSON-Schema fragment projects to
 * `input: unknown` rather than failing. The projection is a *hint* for
 * the model, never a validation authority — the real schema check still
 * happens inside the executor when the bridged call runs.
 *
 * @packageDocumentation
 */

import type { ToolSource } from '@graphorin/core';

/** Structural view of a tool this module can project. */
export interface ProjectableTool {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema?: unknown;
  /** Present on `ResolvedTool`; absent tools group under "tools". */
  readonly __source?: ToolSource;
}

/** The projected code API for a set of tools. */
export interface CodeApiProjection {
  /** Every callable tool name, in registration order. */
  readonly names: ReadonlyArray<string>;
  /**
   * Compact catalogue (name + one-line description, grouped by source).
   * Cheap enough to embed in a tool description.
   */
  readonly catalogue: string;
  /** Full signature block for one tool, or `undefined` if unknown. */
  signatureFor(name: string): string | undefined;
  /** Signature blocks for the given names (unknown names skipped). */
  signaturesFor(names: ReadonlyArray<string>): string;
  /**
   * Signature blocks for tools whose name or description contains
   * `query` (case-insensitive substring), capped at `limit` (default 10).
   */
  search(query: string, limit?: number): string;
}

/** Human-facing label for a tool's source, used to group the catalogue. */
function sourceLabel(source: ToolSource | undefined): string {
  if (source === undefined) return 'tools';
  switch (source.kind) {
    case 'first-party':
      return 'first-party';
    case 'built-in':
      return `built-in:${source.subsystem}`;
    case 'skill':
      return `skill:${source.skillName}`;
    case 'mcp':
      return `mcp:${source.serverIdentity}`;
    case 'web-search':
      return `web-search:${source.providerName}`;
    default:
      return 'tools';
  }
}

/** First sentence (or first 120 chars) of a description, single-line. */
function oneLine(description: string | undefined): string {
  if (description === undefined || description.length === 0) return '(no description)';
  const collapsed = description.replace(/\s+/g, ' ').trim();
  const stop = collapsed.indexOf('. ');
  const head = stop >= 0 ? collapsed.slice(0, stop + 1) : collapsed;
  return head.length > 120 ? `${head.slice(0, 117)}...` : head;
}

/**
 * Coerce a tool's `inputSchema` to a JSON-Schema fragment. Handles both
 * Zod-like schemas (via `toJSON()`) and the already-JSON-Schema records
 * that `ToolSearchMatch.inputSchema` carries. Mirrors `toolToDefinition`
 * in the agent. `undefined` only for a non-object / missing schema.
 */
function schemaToJson(inputSchema: unknown): Record<string, unknown> | undefined {
  if (inputSchema === null || typeof inputSchema !== 'object') return undefined;
  const toJson = (inputSchema as { toJSON?: () => unknown }).toJSON;
  if (typeof toJson === 'function') {
    try {
      const json = toJson.call(inputSchema);
      if (json !== null && typeof json === 'object') return json as Record<string, unknown>;
    } catch {
      // fall through to treating the object as a JSON-Schema record
    }
  }
  return inputSchema as Record<string, unknown>;
}

/** Render a JSON-Schema fragment as a (best-effort) TypeScript type. */
function jsonSchemaToTs(schema: Record<string, unknown>, depth = 0): string {
  if (depth > 4) return 'unknown';

  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return enumValues.map((v) => JSON.stringify(v)).join(' | ');
  }

  const type = schema.type;
  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'null') return 'null';

  if (type === 'array') {
    const items = schema.items;
    const itemType =
      items !== null && typeof items === 'object'
        ? jsonSchemaToTs(items as Record<string, unknown>, depth + 1)
        : 'unknown';
    return `${itemType}[]`;
  }

  if (type === 'object' || schema.properties !== undefined) {
    const properties = schema.properties;
    if (properties === null || typeof properties !== 'object') return 'Record<string, unknown>';
    const required = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : []);
    const entries = Object.entries(properties as Record<string, unknown>);
    if (entries.length === 0) return 'Record<string, unknown>';
    const fields = entries.map(([key, value]) => {
      const fieldType =
        value !== null && typeof value === 'object'
          ? jsonSchemaToTs(value as Record<string, unknown>, depth + 1)
          : 'unknown';
      const optional = required.has(key) ? '' : '?';
      return `${JSON.stringify(key)}${optional}: ${fieldType}`;
    });
    return `{ ${fields.join('; ')} }`;
  }

  return 'unknown';
}

/** Render the `input` parameter type for a tool. */
function inputType(tool: ProjectableTool): string {
  const json = schemaToJson(tool.inputSchema);
  if (json === undefined) return 'unknown';
  return jsonSchemaToTs(json);
}

/** Render one tool's signature block (JSDoc + declaration). */
function signatureBlock(tool: ProjectableTool): string {
  const desc = (tool.description ?? '(no description)').replace(/\s+/g, ' ').trim();
  // Identifier-safe access; dotted/odd names use the `tools["name"]` form.
  const callable = /^[A-Za-z_$][\w$]*$/.test(tool.name)
    ? `tools.${tool.name}`
    : `tools[${JSON.stringify(tool.name)}]`;
  return `/** ${desc} */\n${callable} = (input: ${inputType(tool)}): Promise<unknown>`;
}

/**
 * Project a set of resolved tools as a typed code API. See the module
 * docstring.
 *
 * @stable
 */
export function projectToolApi(tools: ReadonlyArray<ProjectableTool>): CodeApiProjection {
  const names = tools.map((t) => t.name);
  const byName = new Map(tools.map((t) => [t.name, t] as const));

  // Catalogue grouped by source label, deterministic by group then name.
  const groups = new Map<string, ProjectableTool[]>();
  for (const tool of tools) {
    const label = sourceLabel(tool.__source);
    const bucket = groups.get(label);
    if (bucket === undefined) groups.set(label, [tool]);
    else bucket.push(tool);
  }
  const catalogueLines: string[] = [];
  for (const label of [...groups.keys()].sort()) {
    catalogueLines.push(`## ${label}`);
    const bucket = groups.get(label) ?? [];
    for (const tool of bucket) {
      catalogueLines.push(`- ${tool.name}: ${oneLine(tool.description)}`);
    }
  }
  const catalogue = catalogueLines.join('\n');

  const signatureFor = (name: string): string | undefined => {
    const tool = byName.get(name);
    return tool === undefined ? undefined : signatureBlock(tool);
  };

  return {
    names,
    catalogue,
    signatureFor,
    signaturesFor(requested) {
      const blocks: string[] = [];
      for (const name of requested) {
        const block = signatureFor(name);
        if (block !== undefined) blocks.push(block);
      }
      return blocks.join('\n\n');
    },
    search(query, limit = 10) {
      const q = query.toLowerCase();
      const hits = tools
        .filter(
          (t) =>
            t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
        )
        .slice(0, Math.max(0, limit));
      return hits.map(signatureBlock).join('\n\n');
    },
  };
}
