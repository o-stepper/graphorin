[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / migration

# migration

`migrate-frontmatter` - idempotent rewrite helper that migrates
legacy `graphorin-*` frontmatter fields onto their upstream
equivalents per the `deprecate-graphorin-prefix` mappings recorded
in the bundled spec snapshot.

The function is dry-run by default - callers must opt in to
persisting the rewritten bytes. The CLI binary in Phase 15 wraps
this surface; the library is exposed here so other tooling can
reuse it.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [MigrateFrontmatterOptions](/api/@graphorin/skills/migration/interfaces/MigrateFrontmatterOptions.md) | Options accepted by [migrateFrontmatter](/api/@graphorin/skills/migration/functions/migrateFrontmatter.md). |
| [MigrationResult](/api/@graphorin/skills/migration/interfaces/MigrationResult.md) | Result of a single SKILL.md migration. |
| [MigrationRewrite](/api/@graphorin/skills/migration/interfaces/MigrationRewrite.md) | A single rewrite the migrator applied (or would apply in a dry-run). |

## Functions

| Function | Description |
| ------ | ------ |
| [migrateFrontmatter](/api/@graphorin/skills/migration/functions/migrateFrontmatter.md) | Migrate the bundled `deprecate-graphorin-prefix` mappings on a single SKILL.md. The function is idempotent: re-running it on an already-migrated SKILL.md returns `changed: false` and an empty `rewrites` array. |
| [sortKeysAnthropicFirst](/api/@graphorin/skills/migration/functions/sortKeysAnthropicFirst.md) | Stable key ordering: Anthropic-base fields first (in their snapshot insertion order), then the `metadata` bucket, then the `graphorin-*` fields, then anything else. The migrator emits in this order so re-running the migrator on the same input yields identical bytes (idempotence). |
