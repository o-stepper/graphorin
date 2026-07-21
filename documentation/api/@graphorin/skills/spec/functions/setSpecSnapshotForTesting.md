[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [spec](/api/@graphorin/skills/spec/index.md) / \_setSpecSnapshotForTesting

# Function: \_setSpecSnapshotForTesting()

```ts
function _setSpecSnapshotForTesting(snapshot): void;
```

Defined in: packages/skills/src/spec/index.ts:71

**`Experimental`**

Override the bundled snapshot. Used by tests that exercise the
"newer / older spec snapshot" branches of the validator.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `snapshot` | \| [`SpecSnapshot`](/api/@graphorin/skills/spec/interfaces/SpecSnapshot.md) \| `null` |

## Returns

`void`
