[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Sandbox

# Interface: Sandbox

Defined in: packages/core/src/contracts/sandbox.ts:8

**`Stable`**

Pluggable sandbox interface for tool / skill execution. Concrete
implementations live in `@graphorin/security` (worker-threads,
isolated-vm, docker, none).

## Extended by

- [`SandboxImpl`](/api/@graphorin/security/interfaces/SandboxImpl.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | Identifier of the sandbox flavor (`'worker-threads'`, `'isolated-vm'`, …). | packages/core/src/contracts/sandbox.ts:10 |

## Methods

### run()

```ts
run<TInput, TOutput>(code, opts): Promise<SandboxResult<TOutput>>;
```

Defined in: packages/core/src/contracts/sandbox.ts:11

#### Type Parameters

| Type Parameter |
| ------ |
| `TInput` |
| `TOutput` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `code` | [`SandboxCode`](/api/@graphorin/core/type-aliases/SandboxCode.md) |
| `opts` | [`SandboxRunOptions`](/api/@graphorin/core/interfaces/SandboxRunOptions.md)\&lt;`TInput`\&gt; |

#### Returns

`Promise`\<[`SandboxResult`](/api/@graphorin/core/type-aliases/SandboxResult.md)\&lt;`TOutput`\&gt;\>
