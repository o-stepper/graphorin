[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DeviceAuthFetcher

# Type Alias: DeviceAuthFetcher

```ts
type DeviceAuthFetcher = (url, init) => Promise<{
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
  statusText?: string;
}>;
```

Defined in: [packages/security/src/oauth/authorize-device-flow.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L31)

Strategy hook used by tests to stub the device-authorization request.

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
