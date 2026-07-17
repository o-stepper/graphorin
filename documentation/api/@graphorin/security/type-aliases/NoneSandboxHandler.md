[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / NoneSandboxHandler

# Type Alias: NoneSandboxHandler\&lt;TInput, TOutput\&gt;

```ts
type NoneSandboxHandler<TInput, TOutput> = (input, signal) => Promise<TOutput> | TOutput;
```

Defined in: [packages/security/src/sandbox/none.ts:34](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/none.ts#L34)

Direct caller for `code.kind === 'handler'`. The handler is looked
up in the supplied registry; built-in trusted tools register their
handlers at startup.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | `TInput` |
| `signal` | `AbortSignal` \| `undefined` |

## Returns

`Promise`\&lt;`TOutput`\&gt; \| `TOutput`

## Stable
