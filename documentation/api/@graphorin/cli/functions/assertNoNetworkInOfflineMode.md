[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / assertNoNetworkInOfflineMode

# Function: assertNoNetworkInOfflineMode()

```ts
function assertNoNetworkInOfflineMode(operation): void;
```

Defined in: [packages/cli/src/internal/offline.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/offline.ts#L35)

Throws when the operator opted into offline mode. Phase 14a calls
this from every subcommand entry point so the contract is
enforced uniformly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `operation` | `string` |

## Returns

`void`

## Stable
