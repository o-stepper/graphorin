[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SandboxImpl

# Interface: SandboxImpl

Defined in: [packages/security/src/sandbox/sandbox.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L60)

Concrete `Sandbox` implementation contract. Extends the core
interface with a discriminator + capability advertisement.

## Stable

## Extends

- [`Sandbox`](/api/@graphorin/core/interfaces/Sandbox.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | [`SandboxCapabilities`](/api/@graphorin/security/interfaces/SandboxCapabilities.md) | What the adapter can enforce; surfaced through `resolveSandbox(...)`. | - | [packages/security/src/sandbox/sandbox.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L64) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Identifier of the sandbox flavor (`'worker-threads'`, `'isolated-vm'`, …). | [`Sandbox`](/api/@graphorin/core/interfaces/Sandbox.md).[`id`](/api/@graphorin/core/interfaces/Sandbox.md#property-id) | [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts) |
| <a id="property-kind"></a> `kind` | `readonly` | [`SandboxKind`](/api/@graphorin/security/type-aliases/SandboxKind.md) | Discriminator. | - | [packages/security/src/sandbox/sandbox.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/sandbox.ts#L62) |

## Methods

### run()

```ts
run<TInput, TOutput>(code, opts): Promise<SandboxResult<TOutput>>;
```

Defined in: [packages/core/dist/contracts/sandbox.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/contracts/sandbox.d.ts)

#### Type Parameters

| Type Parameter |
| ------ |
| `TInput` |
| `TOutput` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | [`SandboxCode`](/api/@graphorin/security/type-aliases/SandboxCode.md) |
| `opts` | [`SandboxRunOptions`](/api/@graphorin/security/interfaces/SandboxRunOptions.md)\&lt;`TInput`\&gt; |

#### Returns

`Promise`\<[`SandboxResult`](/api/@graphorin/security/type-aliases/SandboxResult.md)\&lt;`TOutput`\&gt;\>

#### Inherited from

[`Sandbox`](/api/@graphorin/core/interfaces/Sandbox.md).[`run`](/api/@graphorin/core/interfaces/Sandbox.md#run)
