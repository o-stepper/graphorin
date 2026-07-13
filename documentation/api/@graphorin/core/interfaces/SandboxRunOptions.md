[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SandboxRunOptions

# Interface: SandboxRunOptions\&lt;TInput\&gt;

Defined in: [packages/core/src/contracts/sandbox.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L34)

Per-call sandbox options.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowfs"></a> `allowFs?` | `readonly` | `boolean` | - | [packages/core/src/contracts/sandbox.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L45) |
| <a id="property-allownetwork"></a> `allowNetwork?` | `readonly` | `boolean` | - | [packages/core/src/contracts/sandbox.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L44) |
| <a id="property-env"></a> `env?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Allowlist of environment variables visible inside the sandbox. Sandboxed code never inherits the host `process.env`; entries given here are the only ones defined. | [packages/core/src/contracts/sandbox.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L43) |
| <a id="property-input"></a> `input` | `readonly` | `TInput` | - | [packages/core/src/contracts/sandbox.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L35) |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | - | [packages/core/src/contracts/sandbox.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L37) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/core/src/contracts/sandbox.ts:46](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L46) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | - | [packages/core/src/contracts/sandbox.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/sandbox.ts#L36) |
