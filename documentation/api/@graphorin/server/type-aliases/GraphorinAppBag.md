[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / GraphorinAppBag

# Type Alias: GraphorinAppBag

```ts
type GraphorinAppBag = Omit<CreateServerOptions, "config" | "validatedConfig"> & {
  close?: () => void | Promise<void>;
};
```

Defined in: packages/server/src/app.ts:243

**`Stable`**

Adapter bag a compose module returns: everything
[CreateServerOptions](/api/@graphorin/server/interfaces/CreateServerOptions.md) accepts except the config itself, plus an
optional `close` hook the launcher awaits AFTER `server.stop()` so
app-owned resources (an injected store, provider clients, ...) shut
down cleanly - `stop()` never closes an injected store by contract.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `close()?` | () => `void` \| `Promise`\&lt;`void`\&gt; | packages/server/src/app.ts:244 |
