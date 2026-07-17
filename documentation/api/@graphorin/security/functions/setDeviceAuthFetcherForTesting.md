[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setDeviceAuthFetcherForTesting

# Function: \_setDeviceAuthFetcherForTesting()

```ts
function _setDeviceAuthFetcherForTesting(fetcher): void;
```

Defined in: [packages/security/src/oauth/authorize-device-flow.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-device-flow.ts#L43)

**`Experimental`**

Override the device-authorization fetcher. Used by the test suite.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `fetcher` | \| [`DeviceAuthFetcher`](/api/@graphorin/security/type-aliases/DeviceAuthFetcher.md) \| `null` |

## Returns

`void`
