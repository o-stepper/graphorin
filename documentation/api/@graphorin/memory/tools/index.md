[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / tools

# tools

Nine memory tools registered with `@graphorin/tools` by the
`createMemory()` facade. Each factory takes a [MemoryToolDeps](/api/@graphorin/memory/interfaces/MemoryToolDeps.md)
bundle so consumers can scope the tool surface (per-tier ACL, scope
resolver, etc.) without rebuilding the underlying memory facade.

## Functions

| Function | Description |
| ------ | ------ |
| [buildMemoryTools](/api/@graphorin/memory/tools/functions/buildMemoryTools.md) | Build the canonical nine-memory-tool array. Order is stable — consumers can rely on the indices for snapshot tests. |

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

### createFactForgetTool

Re-exports [createFactForgetTool](/api/@graphorin/memory/functions/createFactForgetTool.md)

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

### createRecallEpisodesTool

Re-exports [createRecallEpisodesTool](/api/@graphorin/memory/functions/createRecallEpisodesTool.md)

***

### MemoryToolDeps

Re-exports [MemoryToolDeps](/api/@graphorin/memory/interfaces/MemoryToolDeps.md)

***

### ScopeResolver

Re-exports [ScopeResolver](/api/@graphorin/memory/type-aliases/ScopeResolver.md)
