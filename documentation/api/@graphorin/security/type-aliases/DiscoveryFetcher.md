[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DiscoveryFetcher

# Type Alias: DiscoveryFetcher

```ts
type DiscoveryFetcher = (url, init) => Promise<{
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
}>;
```

Defined in: packages/security/src/oauth/discovery.ts:22

Strategy hook used by tests so the unit suite never hits the network.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `init` | \{ `signal?`: `AbortSignal`; \} |
| `init.signal?` | `AbortSignal` |

## Returns

`Promise`\<\{
  `json`: () => `Promise`\&lt;`unknown`\&gt;;
  `ok`: `boolean`;
  `status`: `number`;
\}\>
