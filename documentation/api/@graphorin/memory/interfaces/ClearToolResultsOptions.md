[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / ClearToolResultsOptions

# Interface: ClearToolResultsOptions

Defined in: [packages/memory/src/context-engine/compaction/clear-tool-results.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L28)

Knobs for [clearOldToolResults](/api/@graphorin/memory/functions/clearOldToolResults.md) (mirrors the strategy variant).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-clearatleast"></a> `clearAtLeast?` | `readonly` | `number` | Only clear if at least this many tokens are reclaimable; else leave untouched (default 0). | [packages/memory/src/context-engine/compaction/clear-tool-results.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L32) |
| <a id="property-cleartoolinputs"></a> `clearToolInputs?` | `readonly` | `boolean` | C4 (clear_tool_uses_20250919 parity): additionally blank the PAIRED assistant message's tool-call arguments for every cleared result, reclaiming the input side of verbose calls too. Default `false`. | [packages/memory/src/context-engine/compaction/clear-tool-results.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L72) |
| <a id="property-excludetools"></a> `excludeTools?` | `readonly` | readonly `string`[] | Tool names whose results are never cleared. | [packages/memory/src/context-engine/compaction/clear-tool-results.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L34) |
| <a id="property-externalize"></a> `externalize?` | `readonly` | (`content`, `info`) => `Promise`\&lt;\{ `handleId`: `string`; `preview?`: `string`; \}\&gt; | A6 / SOTA-2 - recoverable clearing. When provided, the original tool-result text of each cleared message is handed to this callback (wire it to a spill store / the `read_result` handle registry) and the placeholder references the returned handle id + preview, so the model can re-fetch the full result via `read_result` rather than losing it. Invoked only for clears that actually commit (after the `clearAtLeast` floor), so a rejected clearing never spills. Omitted ⇒ the bare `placeholder` (irrecoverable, byte-identical default). | [packages/memory/src/context-engine/compaction/clear-tool-results.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L50) |
| <a id="property-keeptooluses"></a> `keepToolUses?` | `readonly` | `number` | Most-recent tool results kept verbatim (default `DEFAULT_KEEP_TOOL_USES`). | [packages/memory/src/context-engine/compaction/clear-tool-results.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L30) |
| <a id="property-placeholder"></a> `placeholder?` | `readonly` | (`info`) => `string` | Placeholder builder; defaults to a one-line `[cleared tool result …]` marker. | [packages/memory/src/context-engine/compaction/clear-tool-results.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L36) |
| <a id="property-readresulttoolname"></a> `readResultToolName?` | `readonly` | `string` \| `null` | C4 (context-engine-11): the tool the externalized-handle placeholder advertises. The memory package cannot know whether the agent registered `read_result` (that depends on spill wiring), so callers whose runtime does NOT expose it pass `null` and the placeholder degrades to a tool-neutral phrasing instead of promising a tool the model cannot call. Default `'read_result'` (the agent built-in). | [packages/memory/src/context-engine/compaction/clear-tool-results.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/clear-tool-results.ts#L66) |
