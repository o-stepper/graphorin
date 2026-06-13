---
'@graphorin/core': minor
'@graphorin/tools': minor
'@graphorin/agent': patch
'@graphorin/provider': patch
---

Structured tool output end-to-end (A5). A tool's `outputSchema` now reaches the model and the provider, where it was previously dropped — groundwork for typed code-mode and field-level previews.

- `@graphorin/core`: `ToolDefinition` gains `outputSchema?` (the model-facing wire field).
- `@graphorin/agent`: `toolToDefinition` projects `Tool.outputSchema` onto it (shared `projectSchema` helper for input + output).
- `@graphorin/tools`: code-mode `projectToolApi` renders the real return type from `outputSchema` (`Promise<{…}>` instead of `Promise<unknown>`) so a `code_execute` script knows what each tool returns; `ToolSearchMatch` / `CodeSearchMatch` carry `outputSchema` so deferred-pool signatures are typed too.
- `@graphorin/provider`: `foldToolExamples` now preserves `outputSchema` when folding examples (it previously rebuilt the tool with only name/inputSchema/description).
