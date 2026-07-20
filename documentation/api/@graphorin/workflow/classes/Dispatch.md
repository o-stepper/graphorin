[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Dispatch

# Class: Dispatch\&lt;TArgs\&gt;

Defined in: [packages/core/dist/channels/dispatch.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/dispatch.d.ts)

**`Stable`**

Workflow dynamic-task primitive. A node returns one or more
`Dispatch(nodeName, args)` values to schedule additional tasks in the
next execution step.

The class is intentionally tiny - the engine inspects only the public
`nodeName` and `args` fields. The shape is **Graphorin's own design**
(the name `Dispatch` is part of the public API).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TArgs` | `unknown` |

## Constructors

### Constructor

```ts
new Dispatch<TArgs>(nodeName, args): Dispatch<TArgs>;
```

Defined in: [packages/core/dist/channels/dispatch.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/dispatch.d.ts)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodeName` | `string` |
| `args` | `TArgs` |

#### Returns

`Dispatch`\&lt;`TArgs`\&gt;

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-__graphorindispatch"></a> `__graphorinDispatch` | `readonly` | `true` | Cross-realm brand: the engine's structural fallback requires this marker so a plain state object that happens to carry `nodeName` + `args` keys is treated as channel WRITES, never silently swallowed as a dispatch. A plain own property (not a symbol) so it survives `structuredClone` across worker boundaries. | [packages/core/dist/channels/dispatch.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/dispatch.d.ts) |
| <a id="property-args"></a> `args` | `readonly` | `TArgs` | - | [packages/core/dist/channels/dispatch.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/dispatch.d.ts) |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | - | [packages/core/dist/channels/dispatch.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/dispatch.d.ts) |
