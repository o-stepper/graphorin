[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [code-mode](/api/@graphorin/tools/code-mode/index.md) / CodeExecuteToolOptions

# Interface: CodeExecuteToolOptions

Defined in: packages/tools/src/code-mode/meta-tools.ts:127

Configuration for [createCodeExecuteTool](/api/@graphorin/tools/code-mode/functions/createCodeExecuteTool.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowedtools"></a> `allowedTools` | `readonly` | readonly `string`[] | Names the script may call. Discovered (deferred) names may be added. | packages/tools/src/code-mode/meta-tools.ts:131 |
| <a id="property-executetool"></a> `executeTool` | `readonly` | [`CodeExecuteBridge`](/api/@graphorin/tools/code-mode/type-aliases/CodeExecuteBridge.md) | Host bridge for each `tools.<name>(args)` call. | packages/tools/src/code-mode/meta-tools.ts:133 |
| <a id="property-limits"></a> `limits?` | `readonly` | [`CodeExecuteLimits`](/api/@graphorin/tools/code-mode/interfaces/CodeExecuteLimits.md) | Sandbox limits. | packages/tools/src/code-mode/meta-tools.ts:135 |
| <a id="property-projection"></a> `projection` | `readonly` | [`CodeApiProjection`](/api/@graphorin/tools/code-mode/interfaces/CodeApiProjection.md) | Projection over the eager tool set, embedded in the description. | packages/tools/src/code-mode/meta-tools.ts:129 |
| <a id="property-run"></a> `run?` | `readonly` | (`o`) => `Promise`\&lt;[`BridgedSourceResult`](/api/@graphorin/security/type-aliases/BridgedSourceResult.md)\&gt; | Override the runner (tests inject a fake). Default [runBridgedSource](/api/@graphorin/security/functions/runBridgedSource.md). | packages/tools/src/code-mode/meta-tools.ts:137 |
