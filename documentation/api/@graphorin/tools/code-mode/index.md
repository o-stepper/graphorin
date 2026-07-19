[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / code-mode

# code-mode

Code-mode / programmatic tool calling. Public surface:

- [projectToolApi](/api/@graphorin/tools/code-mode/functions/projectToolApi.md) - project a resolved tool set as a typed code
  API (catalogue + per-tool signatures).
- [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md) / [createCodeSearchTool](/api/@graphorin/tools/code-mode/functions/createCodeSearchTool.md) - the two
  Graphorin-named meta-tools the agent advertises in code-mode.

The sandbox primitive these build on, `runBridgedSource`, lives in
`@graphorin/security/sandbox` (sandbox isolation is a security
concern); this module supplies the tool bridge + the model-facing
projection. The agent runtime wires them behind the opt-in
`toolInvocation: 'code-mode'` config.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [CodeApiProjection](/api/@graphorin/tools/code-mode/interfaces/CodeApiProjection.md) | The projected code API for a set of tools. |
| [CodeExecuteLimits](/api/@graphorin/tools/code-mode/interfaces/CodeExecuteLimits.md) | Tunable sandbox limits for [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md). |
| [CodeExecuteToolOptions](/api/@graphorin/tools/code-mode/interfaces/CodeExecuteToolOptions.md) | Configuration for [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md). |
| [CodeSearchMatch](/api/@graphorin/tools/code-mode/interfaces/CodeSearchMatch.md) | A tool-search match `code_search` can fold in (deferred pool). |
| [CodeSearchToolOptions](/api/@graphorin/tools/code-mode/interfaces/CodeSearchToolOptions.md) | Configuration for [createCodeSearchTool](/api/@graphorin/tools/code-mode/functions/createCodeSearchTool.md). |
| [ProjectableTool](/api/@graphorin/tools/code-mode/interfaces/ProjectableTool.md) | Structural view of a tool this module can project. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [CodeExecuteBridge](/api/@graphorin/tools/code-mode/type-aliases/CodeExecuteBridge.md) | Host bridge: run one bridged tool call and return its output. Receives the `code_execute` call's own [ToolExecutionContext](/api/@graphorin/core/interfaces/ToolExecutionContext.md), so the agent can route the inner call through the real executor under the same `runContext` (same run / step / tracer / secrets scope). |

## Functions

| Function | Description |
| ------ | ------ |
| [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md) | Build the `code_execute` meta-tool. Its output is the script's final value rendered as a string, so the executor's `maxResultTokens` / `'spill-to-file'` pipeline bounds even a large final result. |
| [createCodeSearchTool](/api/@graphorin/tools/code-mode/functions/createCodeSearchTool.md) | Build the `code_search` meta-tool. Returns matching `tools.<name>(…)` signatures as text (eager substring match + the deferred pool). |
| [projectToolApi](/api/@graphorin/tools/code-mode/functions/projectToolApi.md) | Project a set of resolved tools as a typed code API. See the module docstring. |
