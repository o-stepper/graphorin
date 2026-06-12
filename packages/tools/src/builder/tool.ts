/**
 * `tool({...})` factory — the typed entry point for declaring a
 * Graphorin {@link Tool}.
 *
 * The factory returns a `Tool` instance with every field normalised
 * to a stable shape so downstream layers can read the same record
 * regardless of which optional knobs the author supplied. Heavy
 * computation (trust-class resolution, defaults derivation, `examples`
 * validation, `preferredModel` shape validation, …) happens inside the
 * `ToolRegistry.register(...)` path; the builder itself is intentionally
 * small so it can run inside a sandbox / worker without dragging the
 * whole registry implementation along.
 *
 * @packageDocumentation
 */

import type { Tool, ToolExecutionContext, ToolReturn } from '@graphorin/core';

/**
 * Spec accepted by the {@link tool} factory. Mirrors the {@link Tool}
 * interface but accepts the `execute` field as the second positional
 * parameter or as a property — both work equivalently.
 *
 * @stable
 */
export type ToolSpec<TInput = unknown, TOutput = unknown, TDeps = unknown> = Omit<
  Tool<TInput, TOutput, TDeps>,
  'execute'
> & {
  readonly execute: (
    input: TInput,
    ctx: ToolExecutionContext<TDeps>,
  ) => Promise<TOutput | ToolReturn<TOutput> | undefined>;
};

/**
 * Build a `Tool` instance from a spec. Type inference flows from the
 * `inputSchema` / `outputSchema` Zod types into the `execute` callback
 * so authors do not have to repeat the input shape.
 *
 * @example
 * ```ts
 * const search = tool({
 *   name: 'search-issues',
 *   description: 'Search the project tracker for issues matching a query.',
 *   inputSchema: z.object({ query: z.string() }),
 *   outputSchema: z.object({ hits: z.array(z.object({ id: z.string(), title: z.string() })) }),
 *   sideEffectClass: 'read-only',
 *   async execute(input, ctx) {
 *     // ...
 *   },
 * });
 * ```
 *
 * @stable
 */
export function tool<TInput, TOutput, TDeps = unknown>(
  spec: ToolSpec<TInput, TOutput, TDeps>,
): Tool<TInput, TOutput, TDeps> {
  validateName(spec.name);
  if (typeof spec.description !== 'string' || spec.description.length === 0) {
    throw new TypeError(
      `tool({ name: '${spec.name}' }): 'description' must be a non-empty string.`,
    );
  }
  if (spec.inputSchema === undefined || spec.inputSchema === null) {
    throw new TypeError(
      `tool({ name: '${spec.name}' }): 'inputSchema' is required (use z.object({}) for tools with no input).`,
    );
  }
  if (typeof spec.execute !== 'function') {
    throw new TypeError(`tool({ name: '${spec.name}' }): 'execute' must be an async function.`);
  }
  // Build a frozen surface so consumers cannot tamper with the
  // registered object. The dispatcher attaches the non-public
  // `__trustClass` / `__sideEffectClass` / etc. fields at register
  // time; here we only normalise the user-facing shape.
  const frozen: Tool<TInput, TOutput, TDeps> = Object.freeze({
    ...(spec as Tool<TInput, TOutput, TDeps>),
  });
  return frozen;
}

/**
 * Internal — validate the tool name against the registry's character
 * grammar. The runtime guards against names that contain characters
 * the per-provider tool-call wire format cannot encode (whitespace,
 * control chars, the separator characters MCP uses for namespacing).
 */
function validateName(name: unknown): asserts name is string {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError("tool({...}): 'name' must be a non-empty string.");
  }
  if (name.length > 128) {
    throw new TypeError(
      `tool({ name: '${name}' }): 'name' must be at most 128 characters (got ${name.length}).`,
    );
  }
  // Allow alnum, dot, dash, underscore — the union of every major
  // provider's tool-name grammar.
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    throw new TypeError(
      `tool({ name: '${name}' }): 'name' must match /^[A-Za-z0-9._-]+$/ — characters outside that set are rejected by the provider tool-call wire formats we ship.`,
    );
  }
}
