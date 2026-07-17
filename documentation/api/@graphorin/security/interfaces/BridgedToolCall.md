[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BridgedToolCall

# Interface: BridgedToolCall

Defined in: [packages/security/src/sandbox/bridged-source.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L47)

A single tool invocation the sandboxed script asked the host to run.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | The arguments object the script passed; structured-clone safe. | [packages/security/src/sandbox/bridged-source.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L51) |
| <a id="property-name"></a> `name` | `readonly` | `string` | Registered tool name the script invoked via `tools.<name>(args)`. | [packages/security/src/sandbox/bridged-source.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/bridged-source.ts#L49) |
