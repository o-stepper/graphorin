[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxRunOptions

# Interface: SandboxRunOptions\&lt;TInput\&gt;

Defined in: [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts)

**`Stable`**

Per-call sandbox options.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowfs"></a> `allowFs?` | `readonly` | `boolean` | - | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
| <a id="property-allownetwork"></a> `allowNetwork?` | `readonly` | `boolean` | - | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
| <a id="property-env"></a> `env?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | Allowlist of environment variables visible inside the sandbox. Sandboxed code never inherits the host `process.env`; entries given here are the only ones defined. | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
| <a id="property-input"></a> `input` | `readonly` | `TInput` | - | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
| <a id="property-maxmemorymb"></a> `maxMemoryMb?` | `readonly` | `number` | - | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | - | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
