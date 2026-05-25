[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / Dispatch

# Class: Dispatch\&lt;TArgs\&gt;

Defined in: packages/core/dist/channels/dispatch.d.ts:13

Workflow dynamic-task primitive. A node returns one or more
`Dispatch(nodeName, args)` values to schedule additional tasks in the
next execution step.

The class is intentionally tiny — the engine inspects only the public
`nodeName` and `args` fields. The shape is **Graphorin's own design**
(the name `Dispatch` is part of the public API).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TArgs` | `unknown` |

## Constructors

### Constructor

```ts
new Dispatch<TArgs>(nodeName, args): Dispatch<TArgs>;
```

Defined in: packages/core/dist/channels/dispatch.d.ts:16

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodeName` | `string` |
| `args` | `TArgs` |

#### Returns

`Dispatch`\&lt;`TArgs`\&gt;

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `TArgs` | packages/core/dist/channels/dispatch.d.ts:15 |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | packages/core/dist/channels/dispatch.d.ts:14 |
