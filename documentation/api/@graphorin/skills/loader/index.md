[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / loader

# loader

Skill loader.

Implements three-tier progressive disclosure:

- **Tier 1** (always): [Skill.metadata](/api/@graphorin/skills/interfaces/Skill.md#property-metadata) - parsed at load
  time from the SKILL.md frontmatter.
- **Tier 2** (on activation): [Skill.body](/api/@graphorin/skills/interfaces/Skill.md#body) - the loader
  reads the markdown body lazily; subsequent calls return the
  cached value.
- **Tier 3** (on demand): [Skill.resources](/api/@graphorin/skills/interfaces/Skill.md#resources) - the loader
  walks the skill directory lazily; resource bytes are only read
  when [SkillResource.read](/api/@graphorin/skills/interfaces/SkillResource.md#read) is invoked.

The loader supports four sources:

- `{ kind: 'folder', path }`        - read SKILL.md from disk.
- `{ kind: 'npm-package', ... }`    - install via the supply-chain
  helper from `@graphorin/security/supply-chain`, then read.
- `{ kind: 'git-repo', ... }`       - shallow-clone via the
  supply-chain helper, then read.
- `{ kind: 'inline', skill: ... }`  - caller supplies the parsed
  payload; the loader only validates the frontmatter. Useful for
  tests and bundled defaults.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [LoadSkillOptions](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md) | Options forwarded to [loadSkillFromSource](/api/@graphorin/skills/loader/functions/loadSkillFromSource.md). |
| [LoadSkillsOptions](/api/@graphorin/skills/loader/interfaces/LoadSkillsOptions.md) | Aggregate options accepted by [loadSkills](/api/@graphorin/skills/loader/functions/loadSkills.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [loadSkillFromSource](/api/@graphorin/skills/loader/functions/loadSkillFromSource.md) | Load a single skill from any supported source. The loader runs the full frontmatter validator and resolves the supply-chain trust policy so the returned [Skill](/api/@graphorin/skills/interfaces/Skill.md) is ready to be inserted into a `SkillRegistry`. |
| [loadSkills](/api/@graphorin/skills/loader/functions/loadSkills.md) | Load multiple skills concurrently. The sources are loaded in parallel and the returned array preserves input order. When `throwOnSourceError === false` (default) a failing source is logged and skipped; otherwise the first rejection propagates out unchanged. |
| [requireHandoffInputFilter](/api/@graphorin/skills/loader/functions/requireHandoffInputFilter.md) | Required handoff-filter declaration helper. Returns the typed declaration the loader parsed from frontmatter; throws [InputFilterRequiredError](/api/@graphorin/skills/errors/classes/InputFilterRequiredError.md) when the skill is untrusted and the field is missing. Used by the agent runtime in Phase 12 right before instantiating an untrusted skill's sub-agent. |
