[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DEFAULT\_APPLY\_TO\_EVENTS

# Variable: DEFAULT\_APPLY\_TO\_EVENTS

```ts
const DEFAULT_APPLY_TO_EVENTS: ReadonlyArray<string>;
```

Defined in: packages/server/src/commentary/built-in-patterns.ts:75

Default whitelist of `event.type` strings the dispatcher walks
through the sanitizer. Extension is opt-in via
import('./types.js').DeliveryCommentaryConfig.applyToEvents.

## Stable
