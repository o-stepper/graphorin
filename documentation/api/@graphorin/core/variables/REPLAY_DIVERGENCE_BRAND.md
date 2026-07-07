[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / REPLAY\_DIVERGENCE\_BRAND

# Variable: REPLAY\_DIVERGENCE\_BRAND

```ts
const REPLAY_DIVERGENCE_BRAND: unique symbol;
```

Defined in: [packages/core/src/channels/pause.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/pause.ts#L40)

Brand attached to the signal thrown by `pause(value)` when the
positional replay diverges from the journaled pause identity
(W-120). Cross-realm safe like [PAUSE\_SIGNAL\_BRAND](/api/@graphorin/core/variables/PAUSE_SIGNAL_BRAND.md).

## Stable
