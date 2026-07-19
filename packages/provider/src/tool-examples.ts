/**
 * Fold a tool's worked `examples` into its model-facing description.
 *
 * `ToolDefinition` already carries `examples` on the wire (the agent projects
 * them from `Tool.examples`), and the contract notes implementations MAY fold
 * them into the description - but no adapter did, so the model never saw them.
 * Anthropic reports complex-parameter accuracy jumps 72% → 90% with worked
 * examples in the tool text. This renders them deterministically (so the tool
 * spec stays prompt-cache-stable) and drops the now-redundant structured field.
 *
 * @packageDocumentation
 */

import type { ToolDefinition, ToolDefinitionExample } from '@graphorin/core';

/** Render worked examples as a compact, deterministic text block. */
function renderExamplesSection(examples: ReadonlyArray<ToolDefinitionExample>): string {
  const lines = examples.map((ex, i) => {
    const comment = ex.comment !== undefined ? `  // ${ex.comment}` : '';
    return `${i + 1}. input: ${JSON.stringify(ex.input)} -> output: ${JSON.stringify(ex.output)}${comment}`;
  });
  return `Examples:\n${lines.join('\n')}`;
}

/**
 * Fold each tool's `examples` into its `description` and drop the structured
 * field. Non-destructive: a tool with no examples is returned by reference, and
 * the whole array is returned unchanged (same reference) when nothing folds - so
 * callers can cheaply detect a no-op.
 */
export function foldToolExamples(
  tools: ReadonlyArray<ToolDefinition>,
): ReadonlyArray<ToolDefinition> {
  let changed = false;
  const out = tools.map((tool): ToolDefinition => {
    const examples = tool.examples;
    if (examples === undefined || examples.length === 0) return tool;
    changed = true;
    const section = renderExamplesSection(examples);
    const description =
      tool.description !== undefined && tool.description.length > 0
        ? `${tool.description}\n\n${section}`
        : section;
    // Rebuild without `examples` (now in the description text), preserving every
    // other field - notably `outputSchema` (A5).
    return {
      name: tool.name,
      inputSchema: tool.inputSchema,
      description,
      ...(tool.outputSchema !== undefined ? { outputSchema: tool.outputSchema } : {}),
    };
  });
  return changed ? out : tools;
}
