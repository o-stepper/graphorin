[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / RegistryEntry

# Type Alias: RegistryEntry\&lt;TInput, TOutput, TDeps\&gt;

```ts
type RegistryEntry<TInput, TOutput, TDeps> = ResolvedTool<TInput, TOutput, TDeps>;
```

Defined in: [packages/tools/src/registry/types.ts:135](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/registry/types.ts#L135)

Public entry inserted into the registry. Mirrors the canonical
`ResolvedTool` shape - every consumer reads from this single record
shape regardless of registration source.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |
| `TDeps` | `unknown` |

## Stable
