[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / InitCommandOptions

# Interface: InitCommandOptions

Defined in: [packages/cli/src/commands/init.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L36)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cloudconsent"></a> `cloudConsent?` | `readonly` | `"public-only"` \| `"public-and-internal"` \| `"all-with-warnings"` | - | [packages/cli/src/commands/init.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L49) |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | - | [packages/cli/src/commands/init.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L51) |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | Test seam: skip writing files (only print the report). | [packages/cli/src/commands/init.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L53) |
| <a id="property-encrypted"></a> `encrypted?` | `readonly` | `boolean` | - | [packages/cli/src/commands/init.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L50) |
| <a id="property-format"></a> `format?` | `readonly` | `"json"` \| `"ts"` | F-05: config flavour. `'ts'` (default) writes a `defineConfig` `graphorin.config.ts` - loading it later requires a Node that can import TypeScript (23.6+/22.18+ type stripping or a registered loader like tsx) AND `@graphorin/server` resolvable from the config's directory. `'json'` writes a plain `graphorin.config.json` with the same content (the docker-template flavour) that loads anywhere with zero runtime requirements. | [packages/cli/src/commands/init.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L47) |
| <a id="property-noninteractive"></a> `nonInteractive?` | `readonly` | `boolean` | - | [packages/cli/src/commands/init.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L48) |
| <a id="property-out"></a> `out?` | `readonly` | `string` | - | [packages/cli/src/commands/init.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L37) |
| <a id="property-print"></a> `print?` | `readonly` | (`line`) => `void` | Test seam: redirect stdout/err. | [packages/cli/src/commands/init.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/init.ts#L55) |
