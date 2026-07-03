[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / SecretsRotateOptions

# Interface: SecretsRotateOptions

Defined in: packages/cli/src/commands/secrets.ts:238

## Stable

## Extends

- [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-fromstdin"></a> `fromStdin?` | `readonly` | `boolean` | - | - | packages/cli/src/commands/secrets.ts:241 |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md).[`json`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md#property-json) | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam — capture JSON documents instead of writing to stdout. | [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md).[`jsonPrint`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md#property-jsonprint) | packages/cli/src/internal/output.ts:77 |
| <a id="property-key"></a> `key` | `readonly` | `string` | - | - | packages/cli/src/commands/secrets.ts:239 |
| <a id="property-newvalue"></a> `newValue?` | `readonly` | `string` | - | - | packages/cli/src/commands/secrets.ts:240 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md).[`nonInteractive`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md#property-noninteractive) | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam — capture human lines instead of writing to stderr. | [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md).[`print`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md#property-print) | packages/cli/src/internal/output.ts:75 |
| <a id="property-secretssource"></a> `secretsSource?` | `readonly` | [`SecretsStoreKind`](/api/@graphorin/security/type-aliases/SecretsStoreKind.md) | Mirrors `--secrets-source` per DEC-136. | [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md).[`secretsSource`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md#property-secretssource) | packages/cli/src/commands/secrets.ts:49 |
| <a id="property-strictsecrets"></a> `strictSecrets?` | `readonly` | `boolean` | Mirrors `--strict-secrets` per DEC-136. | [`SecretsCommonOptions`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md).[`strictSecrets`](/api/@graphorin/cli/interfaces/SecretsCommonOptions.md#property-strictsecrets) | packages/cli/src/commands/secrets.ts:51 |
