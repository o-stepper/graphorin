[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / GraphorinAppFactory

# Type Alias: GraphorinAppFactory

```ts
type GraphorinAppFactory = (ctx) => 
  | GraphorinAppBag
| Promise<GraphorinAppBag>;
```

Defined in: packages/server/src/app.ts:258

**`Stable`**

Factory signature of an app-compose module (`graphorin.config`'s
`app` field). The module default-exports it (or exports it as
`createApp`); the launcher imports the module, calls the factory
with a [GraphorinAppContext](/api/@graphorin/server/interfaces/GraphorinAppContext.md), and spreads the returned
[GraphorinAppBag](/api/@graphorin/server/type-aliases/GraphorinAppBag.md) into `createServer(...)`, mounting the
sessions / memory / agents / workflows surface that a bare
`graphorin start` leaves 404.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctx` | [`GraphorinAppContext`](/api/@graphorin/server/interfaces/GraphorinAppContext.md) |

## Returns

  \| [`GraphorinAppBag`](/api/@graphorin/server/type-aliases/GraphorinAppBag.md)
  \| `Promise`\&lt;[`GraphorinAppBag`](/api/@graphorin/server/type-aliases/GraphorinAppBag.md)\&gt;
