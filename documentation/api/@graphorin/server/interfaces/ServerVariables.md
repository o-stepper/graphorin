[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ServerVariables

# Interface: ServerVariables

Defined in: [packages/server/src/internal/context.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L74)

Hono variable map. Exported so consumers can type their own
middleware against the same surface.

## Stable

## Extends

- `Record`\&lt;`string`, `unknown`\&gt;

## Indexable

```ts
[key: string]: unknown
```

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | [`ServerRequestState`](/api/@graphorin/server/interfaces/ServerRequestState.md) | [packages/server/src/internal/context.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L75) |
| <a id="property-token"></a> `token?` | `readonly` | [`RequestToken`](/api/@graphorin/server/interfaces/RequestToken.md) | [packages/server/src/internal/context.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/internal/context.ts#L76) |
