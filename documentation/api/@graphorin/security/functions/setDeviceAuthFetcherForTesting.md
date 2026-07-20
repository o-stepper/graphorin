[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setDeviceAuthFetcherForTesting

# Function: \_setDeviceAuthFetcherForTesting()

```ts
function _setDeviceAuthFetcherForTesting(fetcher): void;
```

Defined in: packages/security/src/oauth/authorize-device-flow.ts:43

**`Experimental`**

Override the device-authorization fetcher. Used by the test suite.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fetcher` | \| [`DeviceAuthFetcher`](/api/@graphorin/security/type-aliases/DeviceAuthFetcher.md) \| `null` |

## Returns

`void`
