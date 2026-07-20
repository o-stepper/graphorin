[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / tools

# tools

Eleven memory tools registered with `@graphorin/tools` by the
`createMemory()` facade - plus an opt-in twelfth, `deep_recall`,
appended only when iterative retrieval is configured. Each factory
takes a [MemoryToolDeps](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) bundle so consumers can scope the tool
surface (per-tier ACL, scope resolver, etc.) without rebuilding the
underlying memory facade.

Tool PROFILES: `'full'` (the canonical stable-order
set), `'interactive'` (read-only - the front-line conversational
agent cannot write memory by construction; curation belongs to the
reviser), and `'reviser'` (the full read+write surface, semantically
reserved for the sleep-time curation agent). The single-writer split
mirrors the channels-wave discipline: interactive agents observe,
the reviser mutates.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [BlockAppendInput](/api/@graphorin/memory/tools/interfaces/BlockAppendInput.md) | Explicit interfaces instead of `z.infer<typeof schema>` - the inferred aliases baked concrete v3 zod object generics into the published d.ts, which do not typecheck under a zod@4 consumer. Interface&lt;-&gt;schema equality is pinned by type tests. |
| [BlockAppendOutput](/api/@graphorin/memory/tools/interfaces/BlockAppendOutput.md) | - |
| [BlockReplaceInput](/api/@graphorin/memory/tools/interfaces/BlockReplaceInput.md) | - |
| [BlockReplaceOutput](/api/@graphorin/memory/tools/interfaces/BlockReplaceOutput.md) | - |
| [BlockRethinkInput](/api/@graphorin/memory/tools/interfaces/BlockRethinkInput.md) | - |
| [BlockRethinkOutput](/api/@graphorin/memory/tools/interfaces/BlockRethinkOutput.md) | - |
| [BuildMemoryToolsOptions](/api/@graphorin/memory/tools/interfaces/BuildMemoryToolsOptions.md) | Options for [buildMemoryTools](/api/@graphorin/memory/tools/functions/buildMemoryTools.md). |
| [ConversationSearchInput](/api/@graphorin/memory/tools/interfaces/ConversationSearchInput.md) | - |
| [ConversationSearchOutput](/api/@graphorin/memory/tools/interfaces/ConversationSearchOutput.md) | - |
| [DeepRecallHit](/api/@graphorin/memory/tools/interfaces/DeepRecallHit.md) | - |
| [DeepRecallInput](/api/@graphorin/memory/tools/interfaces/DeepRecallInput.md) | - |
| [DeepRecallOutput](/api/@graphorin/memory/tools/interfaces/DeepRecallOutput.md) | - |
| [FactForgetInput](/api/@graphorin/memory/tools/interfaces/FactForgetInput.md) | - |
| [FactForgetOutput](/api/@graphorin/memory/tools/interfaces/FactForgetOutput.md) | - |
| [FactHistoryEntry](/api/@graphorin/memory/tools/interfaces/FactHistoryEntry.md) | - |
| [FactHistoryInput](/api/@graphorin/memory/tools/interfaces/FactHistoryInput.md) | - |
| [FactHistoryOutput](/api/@graphorin/memory/tools/interfaces/FactHistoryOutput.md) | - |
| [FactRememberInput](/api/@graphorin/memory/tools/interfaces/FactRememberInput.md) | Explicit interfaces instead of `z.infer<typeof schema>` - the inferred aliases baked concrete v3 zod object generics into the published d.ts, which do not typecheck under a zod@4 consumer. Interface&lt;-&gt;schema equality is pinned by type tests. Optionals carry `| undefined` to match zod's `.optional()` inference exactly. |
| [FactRememberOutput](/api/@graphorin/memory/tools/interfaces/FactRememberOutput.md) | - |
| [FactSearchHit](/api/@graphorin/memory/tools/interfaces/FactSearchHit.md) | - |
| [FactSearchInput](/api/@graphorin/memory/tools/interfaces/FactSearchInput.md) | - |
| [FactSearchOutput](/api/@graphorin/memory/tools/interfaces/FactSearchOutput.md) | - |
| [FactSupersedeInput](/api/@graphorin/memory/tools/interfaces/FactSupersedeInput.md) | - |
| [FactSupersedeOutput](/api/@graphorin/memory/tools/interfaces/FactSupersedeOutput.md) | - |
| [FactValidateInput](/api/@graphorin/memory/tools/interfaces/FactValidateInput.md) | - |
| [FactValidateOutput](/api/@graphorin/memory/tools/interfaces/FactValidateOutput.md) | - |
| [RecallEpisodeHit](/api/@graphorin/memory/tools/interfaces/RecallEpisodeHit.md) | - |
| [RecallEpisodesInput](/api/@graphorin/memory/tools/interfaces/RecallEpisodesInput.md) | Explicit interfaces (see fact-tools.ts) - no zod generics in d.ts. |
| [RecallEpisodesOutput](/api/@graphorin/memory/tools/interfaces/RecallEpisodesOutput.md) | - |
| [RunbookProcedureHit](/api/@graphorin/memory/tools/interfaces/RunbookProcedureHit.md) | - |
| [RunbookSearchInput](/api/@graphorin/memory/tools/interfaces/RunbookSearchInput.md) | Explicit interfaces (see fact-tools.ts) - no zod generics in d.ts. |
| [RunbookSearchOutput](/api/@graphorin/memory/tools/interfaces/RunbookSearchOutput.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [MemoryToolProfile](/api/@graphorin/memory/tools/type-aliases/MemoryToolProfile.md) | Memory tool profile: which slice of the canonical set an agent receives. `'interactive'` is read-only by construction. |

## Variables

| Variable | Description |
| ------ | ------ |
| [MEMORY\_TOOL\_PROFILES](/api/@graphorin/memory/tools/variables/MEMORY_TOOL_PROFILES.md) | The valid profile values (runtime validation source). |

## Functions

| Function | Description |
| ------ | ------ |
| [buildMemoryTools](/api/@graphorin/memory/tools/functions/buildMemoryTools.md) | Build the canonical memory-tool array for a profile. Order is stable for `'full'` / `'reviser'` - consumers can rely on the indices for snapshot tests. `fact_history` and `fact_validate` are appended last so the original nine indices are unchanged. With `{ includeDeepRecall: true }` the gated `deep_recall` tool is appended after the stable eleven; `runbook_search` after it. Both gated appendices are reads, so they appear in every profile. |
| [createRunbookSearchTool](/api/@graphorin/memory/tools/functions/createRunbookSearchTool.md) | `runbook_search` - find validated procedures matching a task description. Quarantined (unvalidated induced) procedures never surface here: they must not drive actions until validated. |

## References

### createBlockAppendTool

Re-exports [createBlockAppendTool](/api/@graphorin/memory/functions/createBlockAppendTool.md)

***

### createBlockReplaceTool

Re-exports [createBlockReplaceTool](/api/@graphorin/memory/functions/createBlockReplaceTool.md)

***

### createBlockRethinkTool

Re-exports [createBlockRethinkTool](/api/@graphorin/memory/functions/createBlockRethinkTool.md)

***

### createConversationSearchTool

Re-exports [createConversationSearchTool](/api/@graphorin/memory/functions/createConversationSearchTool.md)

***

### createDeepRecallTool

Re-exports [createDeepRecallTool](/api/@graphorin/memory/functions/createDeepRecallTool.md)

***

### createFactForgetTool

Re-exports [createFactForgetTool](/api/@graphorin/memory/functions/createFactForgetTool.md)

***

### createFactHistoryTool

Re-exports [createFactHistoryTool](/api/@graphorin/memory/functions/createFactHistoryTool.md)

***

### createFactRememberTool

Re-exports [createFactRememberTool](/api/@graphorin/memory/functions/createFactRememberTool.md)

***

### createFactSearchTool

Re-exports [createFactSearchTool](/api/@graphorin/memory/functions/createFactSearchTool.md)

***

### createFactSupersedeTool

Re-exports [createFactSupersedeTool](/api/@graphorin/memory/functions/createFactSupersedeTool.md)

***

### createFactValidateTool

Re-exports [createFactValidateTool](/api/@graphorin/memory/functions/createFactValidateTool.md)

***

### createRecallEpisodesTool

Re-exports [createRecallEpisodesTool](/api/@graphorin/memory/functions/createRecallEpisodesTool.md)

***

### MemoryToolDeps

Re-exports [MemoryToolDeps](/api/@graphorin/memory/interfaces/MemoryToolDeps.md)

***

### ScopeResolver

Re-exports [ScopeResolver](/api/@graphorin/memory/type-aliases/ScopeResolver.md)
