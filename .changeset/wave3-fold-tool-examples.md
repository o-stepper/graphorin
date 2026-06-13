---
'@graphorin/provider': minor
---

Fold worked tool examples into the model-facing description (A1). `ToolDefinition.examples` was carried on the wire (the agent projects them from `Tool.examples`) but no adapter rendered them, so the model never saw them. `createProvider` now folds each tool's examples into its `description` — deterministically, so the tool spec stays prompt-cache-stable — via the new exported pure `foldToolExamples(tools)` helper, applied in the request-defaults pass. Tools without examples are byte-identical. Anthropic reports complex-parameter accuracy rising 72% → 90% with worked examples in the tool text.
