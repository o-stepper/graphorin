[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / activation

# activation

Activation surface for `@graphorin/skills`.

Two activation paths are supported per DEC-206:

1. **Auto** - every step the agent runtime injects the metadata of
   every registered skill into the system prompt; the model elects
   a skill by invoking the synthetic `activate_skill(name)` tool.
   Skills with `disable-model-invocation: true` are excluded from
   the metadata advertisement so the model never sees them.
2. **Slash command** - the user types `/skill:<name>` (optionally
   followed by free-form arguments) and the agent runtime activates
   the matched skill regardless of `disable-model-invocation`.

The runtime owns the actual activation; this module only parses the
inputs into a structured payload.

## Functions

| Function | Description |
| ------ | ------ |
| [isSlashCommand](/api/@graphorin/skills/activation/functions/isSlashCommand.md) | Convenience predicate. Returns `true` when [parseSlashCommand](/api/@graphorin/skills/activation/functions/parseSlashCommand.md) would succeed against the supplied body. |
| [parseSlashCommand](/api/@graphorin/skills/activation/functions/parseSlashCommand.md) | Parse a single message body for a `/skill:<name>` invocation. The grammar accepts: |
