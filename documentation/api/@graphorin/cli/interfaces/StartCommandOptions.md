[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / StartCommandOptions

# Interface: StartCommandOptions

Defined in: packages/cli/src/commands/start.ts:30

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | `string` | - | packages/cli/src/commands/start.ts:31 |
| <a id="property-host"></a> `host?` | `readonly` | `string` | - | packages/cli/src/commands/start.ts:32 |
| <a id="property-logresolved"></a> `logResolved?` | `readonly` | `boolean` | - | packages/cli/src/commands/start.ts:34 |
| <a id="property-port"></a> `port?` | `readonly` | `number` | - | packages/cli/src/commands/start.ts:33 |
| <a id="property-secretssource"></a> `secretsSource?` | `readonly` | [`SecretsSourceFlag`](/api/@graphorin/cli/type-aliases/SecretsSourceFlag.md) | Override the `secrets.source` field of the loaded config. Mirrors the `--secrets-source <kind>` flag from DEC-136. | packages/cli/src/commands/start.ts:39 |
| <a id="property-strictsecrets"></a> `strictSecrets?` | `readonly` | `boolean` | Refuse to fall back when the requested primary store is unavailable. Mirrors `--strict-secrets` from DEC-136. | packages/cli/src/commands/start.ts:44 |
