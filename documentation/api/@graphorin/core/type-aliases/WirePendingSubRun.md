[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / WirePendingSubRun

# Type Alias: WirePendingSubRun

```ts
type WirePendingSubRun = Omit<PendingSubRun, "state"> & {
  state: WireRunState;
};
```

Defined in: packages/core/src/utils/binary-json.ts:137

**`Stable`**

Wire twin of [PendingSubRun](/api/@graphorin/core/interfaces/PendingSubRun.md): the child state recurses.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `state` | [`WireRunState`](/api/@graphorin/core/type-aliases/WireRunState.md) | packages/core/src/utils/binary-json.ts:138 |
