[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ExecutorOptions

# Interface: ExecutorOptions

Defined in: packages/tools/src/executor/executor.ts:90

Options accepted by [createToolExecutor](/api/@graphorin/tools/functions/createToolExecutor.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-approvalgate"></a> `approvalGate?` | `readonly` | `ApprovalGate` | Approval gate — invoked when a tool's `needsApproval` resolves to `true`. | packages/tools/src/executor/executor.ts:97 |
| <a id="property-cancellationgracems"></a> `cancellationGraceMs?` | `readonly` | `number` | Hard-kill grace window (ms) for tools that ignore `ctx.signal`. Default `50`. | packages/tools/src/executor/executor.ts:112 |
| <a id="property-emitaudit"></a> `emitAudit?` | `readonly` | (`event`) => `void` | Audit emitter override. Defaults to the global registry. | packages/tools/src/executor/executor.ts:95 |
| <a id="property-imperativepatterns"></a> `imperativePatterns?` | `readonly` | readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[] | Pluggable imperative patterns override. | packages/tools/src/executor/executor.ts:114 |
| <a id="property-maxparalleltools"></a> `maxParallelTools?` | `readonly` | `number` | Cap on parallel tool calls per batch. Defaults to `8`. | packages/tools/src/executor/executor.ts:93 |
| <a id="property-memoryguardfactory"></a> `memoryGuardFactory?` | `readonly` | (`tier`) => \| [`MemoryModificationGuard`](/api/@graphorin/security/interfaces/MemoryModificationGuard.md) \| `null` | Optional memory-modification guard factory. Returns a [MemoryModificationGuard](/api/@graphorin/security/interfaces/MemoryModificationGuard.md) per the tool's `memoryGuardTier`. The agent runtime supplies the implementation (`createGuard(...)` from `@graphorin/security/guard`); when absent, the guard step is skipped (audit-only baseline). | packages/tools/src/executor/executor.ts:138 |
| <a id="property-memoryregionreader"></a> `memoryRegionReader?` | `readonly` | [`MemoryRegionReader`](/api/@graphorin/security/interfaces/MemoryRegionReader.md) | Optional memory-region reader the guard uses to hash the pre/post snapshots. The agent runtime supplies the implementation (backed by the `@graphorin/memory` tier APIs). | packages/tools/src/executor/executor.ts:146 |
| <a id="property-registry"></a> `registry` | `readonly` | [`ToolRegistry`](/api/@graphorin/tools/interfaces/ToolRegistry.md) | - | packages/tools/src/executor/executor.ts:91 |
| <a id="property-repair"></a> `repair?` | `readonly` | `ToolRepairHook` | Tool repair hook (single-round). | packages/tools/src/executor/executor.ts:99 |
| <a id="property-sandboxresolver"></a> `sandboxResolver?` | `readonly` | (`policy`) => [`Sandbox`](/api/@graphorin/core/interfaces/Sandbox.md) \| `null` | Optional sandbox-dispatch resolver. Returns the [Sandbox](/api/@graphorin/core/interfaces/Sandbox.md) implementation to use for a given resolved policy, OR `null` to run the tool inline (the default for `kind: 'none'` policies). Skill loaders / agent runtimes inject this when sandbox-bundled code (skills, MCP-derived tools) needs out-of-process execution. | packages/tools/src/executor/executor.ts:130 |
| <a id="property-secretresolver"></a> `secretResolver?` | `readonly` | `SecretResolverHook` | Secrets resolver injected from the agent runtime. | packages/tools/src/executor/executor.ts:107 |
| <a id="property-spill"></a> `spill?` | `readonly` | `SpillWriter` | Optional spill writer for the `'spill-to-file'` truncation strategy. | packages/tools/src/executor/executor.ts:105 |
| <a id="property-streamingeventqueuedepth"></a> `streamingEventQueueDepth?` | `readonly` | `number` | Default streaming queue depth. Default `256`. | packages/tools/src/executor/executor.ts:122 |
| <a id="property-streamingsink"></a> `streamingSink?` | `readonly` | (`event`) => `void` | Sink for tool execution events; the agent runtime forwards these into `agent.stream(...)`. Receives every `tool.execute.*` variant emitted by the executor (start, progress, partial, end, error). | packages/tools/src/executor/executor.ts:120 |
| <a id="property-summarizer"></a> `summarizer?` | `readonly` | `ResultSummarizer` | Optional summarizer for the `'summarize'` truncation strategy. | packages/tools/src/executor/executor.ts:103 |
| <a id="property-tokencounter"></a> `tokenCounter?` | `readonly` | [`TokenCounter`](/api/@graphorin/tools/interfaces/TokenCounter.md) | Per-provider token counter used by the truncation pipeline. | packages/tools/src/executor/executor.ts:101 |
