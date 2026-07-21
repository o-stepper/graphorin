[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgedToolCall

# Interface: BridgedToolCall

Defined in: packages/security/src/sandbox/bridged-source.ts:47

A single tool invocation the sandboxed script asked the host to run.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | The arguments object the script passed; structured-clone safe. | packages/security/src/sandbox/bridged-source.ts:51 |
| <a id="property-name"></a> `name` | `readonly` | `string` | Registered tool name the script invoked via `tools.<name>(args)`. | packages/security/src/sandbox/bridged-source.ts:49 |
