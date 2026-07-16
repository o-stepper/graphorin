[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Dispatch

# Class: Dispatch\&lt;TArgs\&gt;

Defined in: [packages/core/src/channels/dispatch.ts:12](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/dispatch.ts#L12)

Workflow dynamic-task primitive. A node returns one or more
`Dispatch(nodeName, args)` values to schedule additional tasks in the
next execution step.

The class is intentionally tiny - the engine inspects only the public
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

Defined in: [packages/core/src/channels/dispatch.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/dispatch.ts#L24)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nodeName` | `string` |
| `args` | `TArgs` |

#### Returns

`Dispatch`\&lt;`TArgs`\&gt;

## Properties

| Property | Modifier | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-__graphorindispatch"></a> `__graphorinDispatch` | `readonly` | `true` | `true` | Cross-realm brand (workflow-13): the engine's structural fallback requires this marker so a plain state object that happens to carry `nodeName` + `args` keys is treated as channel WRITES, never silently swallowed as a dispatch. A plain own property (not a symbol) so it survives `structuredClone` across worker boundaries. | [packages/core/src/channels/dispatch.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/dispatch.ts#L20) |
| <a id="property-args"></a> `args` | `readonly` | `TArgs` | `undefined` | - | [packages/core/src/channels/dispatch.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/dispatch.ts#L22) |
| <a id="property-nodename"></a> `nodeName` | `readonly` | `string` | `undefined` | - | [packages/core/src/channels/dispatch.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/dispatch.ts#L21) |
