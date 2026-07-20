[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / RunActivityEvent

# Interface: RunActivityEvent

Defined in: packages/server/src/runtime/run-state.ts:123

**`Stable`**

Activity event emitted by the tracker's optional listener:
`run-start` when a run enters `running`, `run-end` on the
first terminal transition.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | `"run-start"` \| `"run-end"` | packages/server/src/runtime/run-state.ts:124 |
| <a id="property-runkind"></a> `runKind` | `readonly` | [`RunKind`](/api/@graphorin/server/type-aliases/RunKind.md) | packages/server/src/runtime/run-state.ts:125 |
