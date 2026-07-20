[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / GuardExplainOptions

# Interface: GuardExplainOptions

Defined in: packages/cli/src/commands/guard.ts:72

**`Stable`**

## Extends

- [`GuardCommonOptions`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-explicittier"></a> `explicitTier?` | `readonly` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) | - | - | packages/cli/src/commands/guard.ts:77 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`GuardCommonOptions`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | [`JsonSink`](/api/@graphorin/cli/type-aliases/JsonSink.md) | Test seam - capture JSON documents instead of writing to stdout. | [`GuardCommonOptions`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`GuardCommonOptions`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | [`PrintSink`](/api/@graphorin/cli/type-aliases/PrintSink.md) | Test seam - capture human lines instead of writing to stderr. | [`GuardCommonOptions`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/GuardCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-secretsallowed"></a> `secretsAllowed?` | `readonly` | readonly `string`[] | - | - | packages/cli/src/commands/guard.ts:75 |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | - | packages/cli/src/commands/guard.ts:74 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | - | packages/cli/src/commands/guard.ts:73 |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | `"untrusted"` \| `"built-in"` \| `"user-defined"` \| `"trusted"` | - | - | packages/cli/src/commands/guard.ts:76 |
