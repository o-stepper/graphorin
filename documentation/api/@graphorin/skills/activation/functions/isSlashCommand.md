[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [activation](/api/@graphorin/skills/activation/index.md) / isSlashCommand

# Function: isSlashCommand()

```ts
function isSlashCommand(raw): boolean;
```

Defined in: packages/skills/src/activation/index.ts:69

**`Stable`**

Convenience predicate. Returns `true` when [parseSlashCommand](/api/@graphorin/skills/activation/functions/parseSlashCommand.md)
would succeed against the supplied body.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

`boolean`
