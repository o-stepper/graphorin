[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeExecuteToolOptions

# Interface: CodeExecuteToolOptions

Defined in: packages/tools/src/code-mode/meta-tools.ts:143

Configuration for [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowedtools"></a> `allowedTools` | `readonly` | readonly `string`[] | Names the script may call. Discovered (deferred) names may be added. | packages/tools/src/code-mode/meta-tools.ts:147 |
| <a id="property-approvalgatedtools"></a> `approvalGatedTools?` | `readonly` | readonly `string`[] | Approval-gated tool names (TL-8) - listed in the catalogue with a call-directly marker (they cannot suspend for HITL mid-script). | packages/tools/src/code-mode/meta-tools.ts:158 |
| <a id="property-executetool"></a> `executeTool` | `readonly` | [`CodeExecuteBridge`](/api/@graphorin/tools/code-mode/type-aliases/CodeExecuteBridge.md) | Host bridge for each `tools.<name>(args)` call. | packages/tools/src/code-mode/meta-tools.ts:149 |
| <a id="property-limits"></a> `limits?` | `readonly` | [`CodeExecuteLimits`](/api/@graphorin/tools/code-mode/interfaces/CodeExecuteLimits.md) | Sandbox limits. | packages/tools/src/code-mode/meta-tools.ts:151 |
| <a id="property-projection"></a> `projection` | `readonly` | [`CodeApiProjection`](/api/@graphorin/tools/code-mode/interfaces/CodeApiProjection.md) | Projection over the eager tool set, embedded in the description. | packages/tools/src/code-mode/meta-tools.ts:145 |
| <a id="property-run"></a> `run?` | `readonly` | (`o`) => `Promise`\&lt;[`BridgedSourceResult`](/api/@graphorin/security/type-aliases/BridgedSourceResult.md)\&gt; | Override the runner (tests inject a fake). Default [runBridgedSource](/api/@graphorin/security/functions/runBridgedSource.md). | packages/tools/src/code-mode/meta-tools.ts:153 |
