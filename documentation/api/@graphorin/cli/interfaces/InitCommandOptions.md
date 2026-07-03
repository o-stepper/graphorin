[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / InitCommandOptions

# Interface: InitCommandOptions

Defined in: packages/cli/src/commands/init.ts:27

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cloudconsent"></a> `cloudConsent?` | `readonly` | `"public-only"` \| `"public-and-internal"` \| `"all-with-warnings"` | - | packages/cli/src/commands/init.ts:30 |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | - | packages/cli/src/commands/init.ts:32 |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | Test seam: skip writing files (only print the report). | packages/cli/src/commands/init.ts:34 |
| <a id="property-encrypted"></a> `encrypted?` | `readonly` | `boolean` | - | packages/cli/src/commands/init.ts:31 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | - | packages/cli/src/commands/init.ts:29 |
| <a id="property-out"></a> `out?` | `readonly` | `string` | - | packages/cli/src/commands/init.ts:28 |
| <a id="property-print"></a> `print?` | `readonly` | (`line`) => `void` | Test seam: redirect stdout/err. | packages/cli/src/commands/init.ts:36 |
