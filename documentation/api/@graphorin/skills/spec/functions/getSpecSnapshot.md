[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [spec](/api/@graphorin/skills/spec/index.md) / getSpecSnapshot

# Function: getSpecSnapshot()

```ts
function getSpecSnapshot(): SpecSnapshot;
```

Defined in: [packages/skills/src/spec/index.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/spec/index.ts#L81)

Return the currently active snapshot. Loads the bundled JSON file
on first call, then caches the parsed object.

## Returns

[`SpecSnapshot`](/api/@graphorin/skills/spec/interfaces/SpecSnapshot.md)

## Stable
