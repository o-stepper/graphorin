[**Graphorin API reference v0.5.0**](../../../index.md)

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

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowfs"></a> `allowFs?` | `readonly` | `boolean` | - | packages/core/dist/contracts/sandbox.d.ts:49 |
| <a id="property-allownetwork"></a> `allowNetwork?` | `readonly` | `boolean` | - | packages/core/dist/contracts/sandbox.d.ts:48 |
| <a id="property-env"></a> `env?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Allowlist of environment variables visible inside the sandbox. Sandboxed code never inherits the host `process.env`; entries given here are the only ones defined. | packages/core/dist/contracts/sandbox.d.ts:47 |
| <a id="property-input"></a> `input` | `readonly` | `TInput` | - | packages/core/dist/contracts/sandbox.d.ts:39 |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | - | packages/core/dist/contracts/sandbox.d.ts:41 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/core/dist/contracts/sandbox.d.ts:50 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | - | packages/core/dist/contracts/sandbox.d.ts:40 |
