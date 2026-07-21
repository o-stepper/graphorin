[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / SkillsInstallOptions

# Interface: SkillsInstallOptions

Defined in: packages/cli/src/commands/skills.ts:52

**`Stable`**

## Extends

- [`SkillsCommonOptions`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | Working directory for npm installs. | - | packages/cli/src/commands/skills.ts:62 |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | - | - | packages/cli/src/commands/skills.ts:63 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`SkillsCommonOptions`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`SkillsCommonOptions`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`SkillsCommonOptions`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`SkillsCommonOptions`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/SkillsCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-ref"></a> `ref?` | `readonly` | `string` | Optional git ref (git sources only). | - | packages/cli/src/commands/skills.ts:58 |
| <a id="property-source"></a> `source` | `readonly` | `string` | `npm:<name>[@version]` or `git:<url>` source. | - | packages/cli/src/commands/skills.ts:54 |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | [`SkillTrustLevelInput`](/api/@graphorin/cli/type-aliases/SkillTrustLevelInput.md) | Trust level for the operator's project. Defaults to the helper's own default. | - | packages/cli/src/commands/skills.ts:60 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Optional explicit version pin (npm sources only). | - | packages/cli/src/commands/skills.ts:56 |
