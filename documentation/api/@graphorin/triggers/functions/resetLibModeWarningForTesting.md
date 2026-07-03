[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / \_resetLibModeWarningForTesting

# Function: \_resetLibModeWarningForTesting()

```ts
function _resetLibModeWarningForTesting(): void;
```

Defined in: packages/triggers/src/index.ts:239

**`Internal`**

Test-only helper. Drops the per-process WARN-once flag so the next
`register(...)` call in lib mode emits the warning again.

## Returns

`void`
