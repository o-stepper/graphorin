[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ServerVariables

# Interface: ServerVariables

Defined in: packages/server/src/internal/context.ts:74

**`Stable`**

Hono variable map. Exported so consumers can type their own
middleware against the same surface.

## Extends

- `Record`\&lt;`string`, `unknown`\&gt;

## Indexable

```ts
[key: string]: unknown
```

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-state"></a> `state` | `readonly` | [`ServerRequestState`](/api/@graphorin/server/interfaces/ServerRequestState.md) | packages/server/src/internal/context.ts:75 |
| <a id="property-token"></a> `token?` | `readonly` | [`RequestToken`](/api/@graphorin/server/interfaces/RequestToken.md) | packages/server/src/internal/context.ts:76 |
