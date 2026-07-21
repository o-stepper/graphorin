[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / assertNoNetworkInOfflineMode

# Function: assertNoNetworkInOfflineMode()

```ts
function assertNoNetworkInOfflineMode(operation): void;
```

Defined in: packages/cli/src/internal/offline.ts:35

**`Stable`**

Throws when the operator opted into offline mode. Phase 14a calls
this from every subcommand entry point so the contract is
enforced uniformly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `operation` | `string` |

## Returns

`void`
