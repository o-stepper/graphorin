[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / GraphorinAppContext

# Interface: GraphorinAppContext

Defined in: packages/server/src/app.ts:225

**`Stable`**

Context handed to a [GraphorinAppFactory](/api/@graphorin/server/type-aliases/GraphorinAppFactory.md) by the standalone
launcher (`graphorin start`). Carries the validated config plus the
config file's location so the factory can resolve relative paths
(SQLite files, credential bundles, ...) against the project
directory.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | Validated server config (CLI overrides already applied). | packages/server/src/app.ts:227 |
| <a id="property-configdir"></a> `configDir` | `readonly` | `string` | Directory containing the config file. | packages/server/src/app.ts:231 |
| <a id="property-configpath"></a> `configPath` | `readonly` | `string` | Absolute path of the resolved `graphorin.config.*` file. | packages/server/src/app.ts:229 |
