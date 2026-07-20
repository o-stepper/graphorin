[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / NOOP\_LOGGER

# Variable: NOOP\_LOGGER

```ts
const NOOP_LOGGER: Logger;
```

Defined in: packages/core/src/contracts/logger.ts:52

**`Stable`**

Minimal no-op logger. Useful as a typed default when downstream code
needs a non-null `Logger` without taking the observability dependency.
