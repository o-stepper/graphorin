[**Graphorin API reference v0.13.7**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [activation](/api/@graphorin/skills/activation/index.md) / parseSlashCommand

# Function: parseSlashCommand()

```ts
function parseSlashCommand(raw): SlashCommandActivation;
```

Defined in: packages/skills/src/activation/index.ts:39

**`Stable`**

Parse a single message body for a `/skill:<name>` invocation. The
grammar accepts:

```
/skill:<name>
/skill:<name> <free-form-args>
```

`<name>` must match `^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$` (kebab-case
conventional). Whitespace before the leading `/` is tolerated; any
other prefix triggers a [SlashCommandParseError](/api/@graphorin/skills/errors/classes/SlashCommandParseError.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

[`SlashCommandActivation`](/api/@graphorin/skills/interfaces/SlashCommandActivation.md)
