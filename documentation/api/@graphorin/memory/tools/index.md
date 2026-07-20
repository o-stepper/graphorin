[**Graphorin API reference v0.13.4**](../../../index.md)

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
| [BuildMemoryToolsOptions](/api/@graphorin/memory/tools/interfaces/BuildMemoryToolsOptions.md) | Options for [buildMemoryTools](/api/@graphorin/memory/tools/functions/buildMemoryTools.md). |

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
