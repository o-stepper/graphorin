[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / PAUSE\_SIGNAL\_BRAND

# Variable: PAUSE\_SIGNAL\_BRAND

```ts
const PAUSE_SIGNAL_BRAND: unique symbol;
```

Defined in: [packages/core/src/channels/pause.ts:10](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/pause.ts#L10)

Brand attached to the signal thrown by `pause(value)` so that the
workflow runtime can recognise it across realms (Worker threads,
sandboxes, …) without `instanceof`.

## Stable
