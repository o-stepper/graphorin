[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / DispatchLike

# Interface: DispatchLike

Defined in: packages/workflow/src/types.ts:236

**`Internal`**

Structural shape used to identify [Dispatch](/api/@graphorin/workflow/classes/Dispatch.md) instances without
pulling the concrete class into this module's import graph. Requires
the cross-realm brand: a bare `{ nodeName, args }` state object is
channel WRITES, never a dispatch - construct dispatches via
`dispatch(nodeName, args)` / `new Dispatch(...)`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-__graphorindispatch"></a> `__graphorinDispatch` | `readonly` | `true` | packages/workflow/src/types.ts:237 |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | packages/workflow/src/types.ts:239 |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | packages/workflow/src/types.ts:238 |
