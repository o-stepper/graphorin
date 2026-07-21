[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / errors

# errors

Typed error hierarchy for `@graphorin/skills`.

Every error carries a stable lowercase `kind` discriminator so the
agent runtime, the CLI, and the audit emitter can branch without
resorting to `instanceof` chains, plus an optional `hint` field with
an actionable remediation step (a CLI command or a documentation
link).

## Classes

| Class | Description |
| ------ | ------ |
| [GraphorinSkillsError](/api/@graphorin/skills/errors/classes/GraphorinSkillsError.md) | Base class for every error thrown by `@graphorin/skills`. |
| [InputFilterRequiredError](/api/@graphorin/skills/errors/classes/InputFilterRequiredError.md) | `Agent.toTool()` / `handoff(...)` would be invoked inside an untrusted skill, but the skill did not declare `graphorin-handoff-input-filter`. Throwing the error at activation time prevents the runtime from materialising a sub-agent without an explicit filter. |
| [SkillFrontmatterConflictError](/api/@graphorin/skills/errors/classes/SkillFrontmatterConflictError.md) | The frontmatter validator detected an Anthropic-base / `graphorin-*` collision and the operator-resolved policy is `'error'`. |
| [SkillLoadError](/api/@graphorin/skills/errors/classes/SkillLoadError.md) | A skill source could not be loaded from disk. |
| [SkillManifestParseError](/api/@graphorin/skills/errors/classes/SkillManifestParseError.md) | A skill manifest could not be parsed (missing frontmatter / invalid YAML). |
| [SkillNameCollisionError](/api/@graphorin/skills/errors/classes/SkillNameCollisionError.md) | A skill name in a registry registration collided with another already-loaded skill. |
| [SkillRequiredFieldMissingError](/api/@graphorin/skills/errors/classes/SkillRequiredFieldMissingError.md) | A required Anthropic-base field is missing from the frontmatter. |
| [SkillRuntimeCompatError](/api/@graphorin/skills/errors/classes/SkillRuntimeCompatError.md) | The runtime-compat declaration on a skill does not satisfy the loader's installed runtime version. |
| [SlashCommandParseError](/api/@graphorin/skills/errors/classes/SlashCommandParseError.md) | The slash-command parser received a string that did not match the `/skill:<name>` grammar. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [GraphorinSkillsErrorKind](/api/@graphorin/skills/errors/type-aliases/GraphorinSkillsErrorKind.md) | Convenience union - every `kind` discriminator the package may emit. |
