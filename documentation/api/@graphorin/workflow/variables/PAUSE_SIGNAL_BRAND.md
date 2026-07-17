[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / PAUSE\_SIGNAL\_BRAND

# Variable: PAUSE\_SIGNAL\_BRAND

```ts
const PAUSE_SIGNAL_BRAND: unique symbol;
```

Defined in: [packages/core/dist/channels/pause.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/core/dist/channels/pause.d.ts)

Brand attached to the signal thrown by `pause(value)` so that the
workflow runtime can recognise it across realms (Worker threads,
sandboxes, …) without `instanceof`.

## Stable
