[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / defaultCatchupPolicy

# Function: defaultCatchupPolicy()

```ts
function defaultCatchupPolicy(): CatchupPolicy;
```

Defined in: [packages/server/src/triggers/daemon.ts:197](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/triggers/daemon.ts#L197)

Resolve the catch-up policy default for triggers that did not
declare one explicitly. Returns `'none'` per DEC-150 (personal-
assistant friendly).

## Returns

[`CatchupPolicy`](/api/@graphorin/triggers/type-aliases/CatchupPolicy.md)

## Stable
