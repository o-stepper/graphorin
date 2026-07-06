[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / checkOfflineModeBlocked

# Function: checkOfflineModeBlocked()

```ts
function checkOfflineModeBlocked(operation, options?): boolean;
```

Defined in: [packages/cli/src/internal/offline.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/internal/offline.ts#L51)

Phase 15 helper for subcommands that informationally **may** make
network calls (e.g. `graphorin auth login`, `graphorin pricing
refresh`, `graphorin skills install`). When `GRAPHORIN_OFFLINE=1`
is set the helper writes an explanatory branded line through the
supplied sink (default: `process.stderr`) and returns `false`,
letting the caller short-circuit cleanly without throwing. Returns
`true` when the network is permitted.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `operation` | `string` |
| `options` | \{ `env?`: `ProcessEnv`; `print?`: (`line`) => `void`; \} |
| `options.env?` | `ProcessEnv` |
| `options.print?` | (`line`) => `void` |

## Returns

`boolean`

## Stable
