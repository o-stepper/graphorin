[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / InitCommandOptions

# Interface: InitCommandOptions

Defined in: packages/cli/src/commands/init.ts:37

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cloudconsent"></a> `cloudConsent?` | `readonly` | `"public-only"` \| `"public-and-internal"` \| `"all-with-warnings"` | - | packages/cli/src/commands/init.ts:50 |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | - | packages/cli/src/commands/init.ts:52 |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | Test seam: skip writing files (only print the report). | packages/cli/src/commands/init.ts:54 |
| <a id="property-encrypted"></a> `encrypted?` | `readonly` | `boolean` | - | packages/cli/src/commands/init.ts:51 |
| <a id="property-format"></a> `format?` | `readonly` | `"json"` \| `"ts"` | Config flavour. `'ts'` (default) writes a `defineConfig` `graphorin.config.ts` - loading it later requires a Node that can import TypeScript (23.6+/22.18+ type stripping or a registered loader like tsx) AND `@graphorin/server` resolvable from the config's directory. `'json'` writes a plain `graphorin.config.json` with the same content (the docker-template flavour) that loads anywhere with zero runtime requirements. | packages/cli/src/commands/init.ts:48 |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | - | packages/cli/src/commands/init.ts:49 |
| <a id="property-out"></a> `out?` | `readonly` | `string` | - | packages/cli/src/commands/init.ts:38 |
| <a id="property-print"></a> `print?` | `readonly` | (`line`) => `void` | Test seam: redirect stdout/err. | packages/cli/src/commands/init.ts:56 |
