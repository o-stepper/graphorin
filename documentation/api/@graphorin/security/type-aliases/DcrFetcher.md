[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DcrFetcher

# Type Alias: DcrFetcher

```ts
type DcrFetcher = (url, init) => Promise<{
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
  statusText?: string;
}>;
```

Defined in: packages/security/src/oauth/dynamic-client-registration.ts:20

Strategy hook used by tests to inject a synthetic registration response.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `init` | \{ `body`: `string`; `signal?`: `AbortSignal`; \} |
| `init.body` | `string` |
| `init.signal?` | `AbortSignal` |

## Returns

`Promise`\<\{
  `json`: () => `Promise`\&lt;`unknown`\&gt;;
  `ok`: `boolean`;
  `status`: `number`;
  `statusText?`: `string`;
\}\>
