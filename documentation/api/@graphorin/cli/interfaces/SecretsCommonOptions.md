[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / SecretsCommonOptions

# Interface: SecretsCommonOptions

Defined in: packages/cli/src/commands/secrets.ts:49

**`Stable`**

## Extends

- `CommonOutputOptions`

## Extended by

- [`SecretsDeleteOptions`](/api/@graphorin/cli/interfaces/SecretsDeleteOptions.md)
- [`SecretsGetOptions`](/api/@graphorin/cli/interfaces/SecretsGetOptions.md)
- [`SecretsListOptions`](/api/@graphorin/cli/interfaces/SecretsListOptions.md)
- [`SecretsRefOptions`](/api/@graphorin/cli/interfaces/SecretsRefOptions.md)
- [`SecretsRotateOptions`](/api/@graphorin/cli/interfaces/SecretsRotateOptions.md)
- [`SecretsSetOptions`](/api/@graphorin/cli/interfaces/SecretsSetOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-json"></a> `json?` | `readonly` | `boolean` | Emit a structured JSON document instead of human-readable text. | `CommonOutputOptions.json` | packages/cli/src/internal/output.ts:71 |
| <a id="property-jsonprint"></a> `jsonPrint?` | `readonly` | `JsonSink` | Test seam - capture JSON documents instead of writing to stdout. | `CommonOutputOptions.jsonPrint` | packages/cli/src/internal/output.ts:77 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | Force `--non-interactive` semantics (skip prompts; require flags / env). | `CommonOutputOptions.nonInteractive` | packages/cli/src/internal/output.ts:73 |
| <a id="property-print"></a> `print?` | `readonly` | `PrintSink` | Test seam - capture human lines instead of writing to stderr. | `CommonOutputOptions.print` | packages/cli/src/internal/output.ts:75 |
| <a id="property-secretssource"></a> `secretsSource?` | `readonly` | [`SecretsStoreKind`](/api/@graphorin/security/type-aliases/SecretsStoreKind.md) | Mirrors `--secrets-source` per DEC-136. | - | packages/cli/src/commands/secrets.ts:51 |
| <a id="property-strictsecrets"></a> `strictSecrets?` | `readonly` | `boolean` | Mirrors `--strict-secrets` per DEC-136. | - | packages/cli/src/commands/secrets.ts:53 |
