[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / ChannelsInput

# Type Alias: ChannelsInput

```ts
type ChannelsInput = 
  | {
  daemon: ChannelsDaemon;
}
  | {
  gateway: ChannelGatewayLike;
};
```

Defined in: packages/server/src/app-daemons.ts:43

**`Stable`**

Accepted forms for `createServer({ channels })` - a pre-built
daemon or the bare gateway (matched structurally; the server takes
no dependency on `@graphorin/channels`).
