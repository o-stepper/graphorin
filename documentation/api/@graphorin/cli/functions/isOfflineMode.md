[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / isOfflineMode

# Function: isOfflineMode()

```ts
function isOfflineMode(env?): boolean;
```

Defined in: [packages/cli/src/internal/offline.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/offline.ts#L21)

`true` when `process.env.GRAPHORIN_OFFLINE` is set to `'1'` or
`'true'` (case-insensitive). Mirrors the documented contract.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `env` | `ProcessEnv` | `process.env` |

## Returns

`boolean`

## Stable
