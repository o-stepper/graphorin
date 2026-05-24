[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SandboxRunOptions

# Interface: SandboxRunOptions\&lt;TInput\&gt;

Defined in: packages/core/src/contracts/sandbox.ts:34

Per-call sandbox options.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-allowfs"></a> `allowFs?` | `readonly` | `boolean` | packages/core/src/contracts/sandbox.ts:40 |
| <a id="property-allownetwork"></a> `allowNetwork?` | `readonly` | `boolean` | packages/core/src/contracts/sandbox.ts:39 |
| <a id="property-env"></a> `env?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | packages/core/src/contracts/sandbox.ts:38 |
| <a id="property-input"></a> `input` | `readonly` | `TInput` | packages/core/src/contracts/sandbox.ts:35 |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | packages/core/src/contracts/sandbox.ts:37 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/core/src/contracts/sandbox.ts:41 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | packages/core/src/contracts/sandbox.ts:36 |
