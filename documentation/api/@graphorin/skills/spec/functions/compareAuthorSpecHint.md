[**Graphorin API reference v0.13.8**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [spec](/api/@graphorin/skills/spec/index.md) / compareAuthorSpecHint

# Function: compareAuthorSpecHint()

```ts
function compareAuthorSpecHint(authorValue): "same" | "older" | "newer" | "unparseable";
```

Defined in: packages/skills/src/spec/index.ts:141

**`Stable`**

Compare an author's `graphorin-anthropic-spec` value against the
bundled snapshot date. Returns:

- `'same'`        - the author targeted the same snapshot.
- `'older'`       - the author targeted an older snapshot.
- `'newer'`       - the author targeted a newer snapshot.
- `'unparseable'` - the author's value could not be interpreted as
  an ISO-8601 date.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `authorValue` | `string` |

## Returns

`"same"` \| `"older"` \| `"newer"` \| `"unparseable"`
