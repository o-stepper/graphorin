[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createWsUpgradeEvents

# Function: createWsUpgradeEvents()

```ts
function createWsUpgradeEvents(c, options): Promise<WSEvents<unknown>>;
```

Defined in: [packages/server/src/ws/upgrade.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/ws/upgrade.ts#L104)

Build the `WSEvents` callback bag the Hono helper consumes. The
function takes the request `Context` so the upgrade can read the
`Authorization` header / `Sec-WebSocket-Protocol` ticket directly.

Production wiring on `@hono/node-ws`:

```ts
const { upgradeWebSocket, injectWebSocket } = createNodeWebSocket({ app });
app.get('/v1/ws', upgradeWebSocket((c) => createWsUpgradeEvents(c, deps)));
injectWebSocket(serve(...));
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `c` | `Context`\&lt;\{ `Variables`: [`ServerVariables`](/api/@graphorin/server/interfaces/ServerVariables.md); \}\&gt; |
| `options` | [`WsUpgradeOptions`](/api/@graphorin/server/interfaces/WsUpgradeOptions.md) |

## Returns

`Promise`\<`WSEvents`\&lt;`unknown`\&gt;\>

## Stable
