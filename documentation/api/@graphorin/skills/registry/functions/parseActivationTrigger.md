[**Graphorin API reference v0.13.4**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / parseActivationTrigger

# Function: parseActivationTrigger()

```ts
function parseActivationTrigger(raw): ParsedActivationTrigger;
```

Defined in: packages/skills/src/registry/index.ts:389

**`Stable`**

Parse a single activation trigger. Slash-command bodies
(`/skill:<name>`) are routed through the slash parser; bare names
are treated as auto-activation requests emitted by the model.

Throws [SlashCommandParseError](/api/@graphorin/skills/errors/classes/SlashCommandParseError.md) when the body looks like a
slash command but does not match the grammar (so the caller can
surface the error to the user).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `raw` | `string` |

## Returns

[`ParsedActivationTrigger`](/api/@graphorin/skills/registry/interfaces/ParsedActivationTrigger.md)
