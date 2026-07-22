[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / RevocationFetcher

# Type Alias: RevocationFetcher

```ts
type RevocationFetcher = (url, init) => Promise<{
  ok: boolean;
  status: number;
  statusText?: string;
}>;
```

Defined in: packages/security/src/oauth/refresh.ts:132

Strategy hook used by tests to stub the revoke request.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `init` | \{ `basicAuth?`: `string`; `body`: `string`; `signal?`: `AbortSignal`; \} |
| `init.basicAuth?` | `string` |
| `init.body` | `string` |
| `init.signal?` | `AbortSignal` |

## Returns

`Promise`\<\{
  `ok`: `boolean`;
  `status`: `number`;
  `statusText?`: `string`;
\}\>
