[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeExecuteLimits

# Interface: CodeExecuteLimits

Defined in: packages/tools/src/code-mode/meta-tools.ts:145

Tunable sandbox limits for [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | Worker memory ceiling (MB). Omitted ⇒ Node default. | packages/tools/src/code-mode/meta-tools.ts:149 |
| <a id="property-maxtoolcalls"></a> `maxToolCalls?` | `readonly` | `number` | Ceiling on bridged tool calls per run. Default 64. | packages/tools/src/code-mode/meta-tools.ts:151 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Hard wall-clock timeout (ms) for the whole script. Default 30000. | packages/tools/src/code-mode/meta-tools.ts:147 |
