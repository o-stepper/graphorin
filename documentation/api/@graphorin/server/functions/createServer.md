[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createServer

# Function: createServer()

```ts
function createServer(options?): Promise<GraphorinServer>;
```

Defined in: packages/server/src/app.ts:394

Build a fully-wired Graphorin server. The returned handle is
inert until `start()` is awaited.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateServerOptions`](/api/@graphorin/server/interfaces/CreateServerOptions.md) |

## Returns

`Promise`\&lt;[`GraphorinServer`](/api/@graphorin/server/interfaces/GraphorinServer.md)\&gt;

## Stable
