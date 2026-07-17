[**Graphorin API reference v0.10.2**](../../../index.md)

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

Defined in: [packages/server/src/app-daemons.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/app-daemons.ts#L43)

B1.6: accepted forms for `createServer({ channels })` - a pre-built
daemon or the bare gateway (matched structurally; the server takes
no dependency on `@graphorin/channels`).

## Stable
