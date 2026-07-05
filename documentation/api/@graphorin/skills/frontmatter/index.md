[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / frontmatter

# frontmatter

Frontmatter validator for `SKILL.md` files.

Implements the field-resolution algorithm from ADR-043:

1. Anthropic-base (top-level, no prefix) - highest priority.
2. `metadata.graphorin.<field>` bucket per upstream `metadata`
   convention.
3. `graphorin-<field>` legacy top-level prefix.
4. caller-supplied fallback.

The validator surfaces every diagnostic through the typed
[FrontmatterDiagnostic](/api/@graphorin/skills/interfaces/FrontmatterDiagnostic.md) contract so callers can decide whether
to log, fail, or escalate without re-parsing human strings.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [SplitSkillMd](/api/@graphorin/skills/frontmatter/interfaces/SplitSkillMd.md) | Result of [splitSkillMd](/api/@graphorin/skills/frontmatter/functions/splitSkillMd.md). |
| [ValidatedFrontmatter](/api/@graphorin/skills/frontmatter/interfaces/ValidatedFrontmatter.md) | Successful return of [validateFrontmatter](/api/@graphorin/skills/frontmatter/functions/validateFrontmatter.md). |
| [ValidateFrontmatterOptions](/api/@graphorin/skills/frontmatter/interfaces/ValidateFrontmatterOptions.md) | Options accepted by [validateFrontmatter](/api/@graphorin/skills/frontmatter/functions/validateFrontmatter.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [isRuntimeCompatSatisfied](/api/@graphorin/skills/frontmatter/functions/isRuntimeCompatSatisfied.md) | Best-effort semver-range satisfaction check. Supports the patterns the framework actually emits (`^x.y.z`, `~x.y.z`, `>=x.y.z`, `>x.y.z`, `<=x.y.z`, `<x.y.z`, plain `x.y.z`, the AND combinator with whitespace) without pulling a runtime dependency on `semver`. Unrecognised inputs return `false` so the validator emits a typed diagnostic. |
| [parseAllowedToolsValue](/api/@graphorin/skills/frontmatter/functions/parseAllowedToolsValue.md) | Parse the `allowed-tools` field. Accepts either a string (with whitespace-separated entries) or a string array. Returns `null` for unsupported shapes so the validator can attach a typed diagnostic. |
| [parseFrontmatterYaml](/api/@graphorin/skills/frontmatter/functions/parseFrontmatterYaml.md) | Parse the YAML frontmatter into a record. Returns `{}` for an empty block. |
| [parseHandoffInputFilter](/api/@graphorin/skills/frontmatter/functions/parseHandoffInputFilter.md) | Parse the `handoff-input-filter` field into a structured declaration. Returns `null` for unsupported shapes; callers should attach a diagnostic when the return value is `null` and the source value was non-undefined. |
| [parseToolsField](/api/@graphorin/skills/frontmatter/functions/parseToolsField.md) | Parse the `tools` field. Accepts either an array of strings (tool names - the loader resolves modules through naming convention) or an array of objects with `name`, `module`, `description`, `tags`. Returns `null` for unsupported shapes. |
| [resolveSkillField](/api/@graphorin/skills/frontmatter/functions/resolveSkillField.md) | Resolve a single field across the four field-resolution tiers. Returns the resolved value plus the source tier the value came from AND the list of conflicting source names so the validator can surface a structured diagnostic. |
| [splitSkillMd](/api/@graphorin/skills/frontmatter/functions/splitSkillMd.md) | Split a raw SKILL.md string into the YAML frontmatter and the markdown body. The frontmatter delimiter is the canonical `---\n…\n---\n` pair. |
| [validateFrontmatter](/api/@graphorin/skills/frontmatter/functions/validateFrontmatter.md) | Validate a parsed frontmatter against the bundled spec snapshot and the `graphorin-*` extension catalogue. |
