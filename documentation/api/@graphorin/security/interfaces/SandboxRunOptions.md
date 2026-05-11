[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxRunOptions

# Interface: SandboxRunOptions\&lt;TInput\&gt;

Defined in: packages/core/dist/contracts/sandbox.d.ts:38

Per-call sandbox options.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-allowfs"></a> `allowFs?` | `readonly` | `boolean` | packages/core/dist/contracts/sandbox.d.ts:44 |
| <a id="property-allownetwork"></a> `allowNetwork?` | `readonly` | `boolean` | packages/core/dist/contracts/sandbox.d.ts:43 |
| <a id="property-env"></a> `env?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | packages/core/dist/contracts/sandbox.d.ts:42 |
| <a id="property-input"></a> `input` | `readonly` | `TInput` | packages/core/dist/contracts/sandbox.d.ts:39 |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | packages/core/dist/contracts/sandbox.d.ts:41 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | packages/core/dist/contracts/sandbox.d.ts:45 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | packages/core/dist/contracts/sandbox.d.ts:40 |
