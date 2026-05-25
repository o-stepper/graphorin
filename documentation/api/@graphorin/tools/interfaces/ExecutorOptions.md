[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ExecutorOptions

# Interface: ExecutorOptions

Defined in: packages/tools/src/executor/executor.ts:91

Options accepted by [createToolExecutor](/api/@graphorin/tools/functions/createToolExecutor.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-approvalgate"></a> `approvalGate?` | `readonly` | `ApprovalGate` | Approval gate — invoked when a tool's `needsApproval` resolves to `true`. | packages/tools/src/executor/executor.ts:98 |
| <a id="property-cancellationgracems"></a> `cancellationGraceMs?` | `readonly` | `number` | Hard-kill grace window (ms) for tools that ignore `ctx.signal`. Default `50`. | packages/tools/src/executor/executor.ts:113 |
| <a id="property-dataflowguard"></a> `dataFlowGuard?` | `readonly` | [`DataFlowGuard`](/api/@graphorin/tools/interfaces/DataFlowGuard.md) | Optional provenance / data-flow guard (P1-3). When present, the executor consults it as a *sink gate* before running any `side-effecting` / `external-stateful` tool (so untrusted content cannot reach an exfiltration/mutation sink ungated) and *records* the provenance of every successful output for downstream sink checks. The agent runtime supplies the implementation (`@graphorin/security`'s taint engine threaded through a per-run ledger); when absent, both steps are skipped (zero overhead, feature off). Because every in-script code-mode tool call also flows through `executeOne`, the same guard composes with code-mode automatically (P1-2). | packages/tools/src/executor/executor.ts:171 |
| <a id="property-emitaudit"></a> `emitAudit?` | `readonly` | (`event`) => `void` | Audit emitter override. Defaults to the global registry. | packages/tools/src/executor/executor.ts:96 |
| <a id="property-imperativebudgetms"></a> `imperativeBudgetMs?` | `readonly` | `number` | Override for the imperative-pattern scan budget (ms). The scanner returns `null` (= timed out, strip-pass skipped) when it exceeds this budget; the production default of `5` ms is sufficient on hot paths but can flake on cold-start CI runners where V8 JIT warm-up + shared-CPU jitter routinely pushes the first scan above 5 ms. Tests that need deterministic strip behaviour on noisy runners can raise this to e.g. `250` ms. Defaults to `5` ms (production-safe). | packages/tools/src/executor/executor.ts:126 |
| <a id="property-imperativepatterns"></a> `imperativePatterns?` | `readonly` | readonly [`ImperativePattern`](/api/@graphorin/observability/redaction/imperative-patterns/interfaces/ImperativePattern.md)[] | Pluggable imperative patterns override. | packages/tools/src/executor/executor.ts:115 |
| <a id="property-maxparalleltools"></a> `maxParallelTools?` | `readonly` | `number` | Cap on parallel tool calls per batch. Defaults to `8`. | packages/tools/src/executor/executor.ts:94 |
| <a id="property-memoryguardfactory"></a> `memoryGuardFactory?` | `readonly` | (`tier`) => \| [`MemoryModificationGuard`](/api/@graphorin/security/interfaces/MemoryModificationGuard.md) \| `null` | Optional memory-modification guard factory. Returns a [MemoryModificationGuard](/api/@graphorin/security/interfaces/MemoryModificationGuard.md) per the tool's `memoryGuardTier`. The agent runtime supplies the implementation (`createGuard(...)` from `@graphorin/security/guard`); when absent, the guard step is skipped (audit-only baseline). | packages/tools/src/executor/executor.ts:150 |
| <a id="property-memoryregionreader"></a> `memoryRegionReader?` | `readonly` | [`MemoryRegionReader`](/api/@graphorin/security/interfaces/MemoryRegionReader.md) | Optional memory-region reader the guard uses to hash the pre/post snapshots. The agent runtime supplies the implementation (backed by the `@graphorin/memory` tier APIs). | packages/tools/src/executor/executor.ts:158 |
| <a id="property-registry"></a> `registry` | `readonly` | [`ToolRegistry`](/api/@graphorin/tools/interfaces/ToolRegistry.md) | - | packages/tools/src/executor/executor.ts:92 |
| <a id="property-repair"></a> `repair?` | `readonly` | `ToolRepairHook` | Tool repair hook (single-round). | packages/tools/src/executor/executor.ts:100 |
| <a id="property-sandboxresolver"></a> `sandboxResolver?` | `readonly` | (`policy`) => [`Sandbox`](/api/@graphorin/core/interfaces/Sandbox.md) \| `null` | Optional sandbox-dispatch resolver. Returns the [Sandbox](/api/@graphorin/core/interfaces/Sandbox.md) implementation to use for a given resolved policy, OR `null` to run the tool inline (the default for `kind: 'none'` policies). Skill loaders / agent runtimes inject this when sandbox-bundled code (skills, MCP-derived tools) needs out-of-process execution. | packages/tools/src/executor/executor.ts:142 |
| <a id="property-secretresolver"></a> `secretResolver?` | `readonly` | `SecretResolverHook` | Secrets resolver injected from the agent runtime. | packages/tools/src/executor/executor.ts:108 |
| <a id="property-spill"></a> `spill?` | `readonly` | `SpillWriter` | Optional spill writer for the `'spill-to-file'` truncation strategy. | packages/tools/src/executor/executor.ts:106 |
| <a id="property-streamingeventqueuedepth"></a> `streamingEventQueueDepth?` | `readonly` | `number` | Default streaming queue depth. Default `256`. | packages/tools/src/executor/executor.ts:134 |
| <a id="property-streamingsink"></a> `streamingSink?` | `readonly` | (`event`) => `void` | Sink for tool execution events; the agent runtime forwards these into `agent.stream(...)`. Receives every `tool.execute.*` variant emitted by the executor (start, progress, partial, end, error). | packages/tools/src/executor/executor.ts:132 |
| <a id="property-summarizer"></a> `summarizer?` | `readonly` | `ResultSummarizer` | Optional summarizer for the `'summarize'` truncation strategy. | packages/tools/src/executor/executor.ts:104 |
| <a id="property-tokencounter"></a> `tokenCounter?` | `readonly` | [`TokenCounter`](/api/@graphorin/tools/interfaces/TokenCounter.md) | Per-provider token counter used by the truncation pipeline. | packages/tools/src/executor/executor.ts:102 |
