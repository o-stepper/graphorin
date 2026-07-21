[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeExecuteToolOptions

# Interface: CodeExecuteToolOptions

Defined in: packages/tools/src/code-mode/meta-tools.ts:155

Configuration for [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowedtools"></a> `allowedTools` | `readonly` | readonly `string`[] | Names the script may call. Discovered (deferred) names may be added. | packages/tools/src/code-mode/meta-tools.ts:159 |
| <a id="property-approvalgatedtools"></a> `approvalGatedTools?` | `readonly` | readonly `string`[] | Approval-gated tool names - listed in the catalogue with a call-directly marker (they cannot suspend for HITL mid-script). | packages/tools/src/code-mode/meta-tools.ts:177 |
| <a id="property-executetool"></a> `executeTool` | `readonly` | [`CodeExecuteBridge`](/api/@graphorin/tools/code-mode/type-aliases/CodeExecuteBridge.md) | Host bridge for each `tools.<name>(args)` call. | packages/tools/src/code-mode/meta-tools.ts:161 |
| <a id="property-limits"></a> `limits?` | `readonly` | [`CodeExecuteLimits`](/api/@graphorin/tools/code-mode/interfaces/CodeExecuteLimits.md) | Sandbox limits. | packages/tools/src/code-mode/meta-tools.ts:163 |
| <a id="property-projection"></a> `projection` | `readonly` | [`CodeApiProjection`](/api/@graphorin/tools/code-mode/interfaces/CodeApiProjection.md) | Projection over the eager tool set, embedded in the description. | packages/tools/src/code-mode/meta-tools.ts:157 |
| <a id="property-run"></a> `run?` | `readonly` | [`CodeModeRunner`](/api/@graphorin/security/type-aliases/CodeModeRunner.md) | The code-mode runtime executing the script: any [CodeModeRunner](/api/@graphorin/security/type-aliases/CodeModeRunner.md) - a subprocess provider, a remote runner, a test fake. Default [runBridgedSource](/api/@graphorin/security/functions/runBridgedSource.md) (in-process `worker_threads`). The runner receives only the script source, the allowed tool names, the `dispatch` bridge and limits - credentials, RunState and policy stay on the harness side. | packages/tools/src/code-mode/meta-tools.ts:172 |
