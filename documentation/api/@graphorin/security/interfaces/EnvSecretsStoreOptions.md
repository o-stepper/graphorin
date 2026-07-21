[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / EnvSecretsStoreOptions

# Interface: EnvSecretsStoreOptions

Defined in: packages/security/src/secrets/stores/env.ts:22

**`Stable`**

Options for `EnvSecretsStore`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowmutation"></a> `allowMutation?` | `readonly` | `boolean` | Whether `set(...)` is allowed to mutate `process.env`. Defaults to `false` - the env store is intended for read-only chains where secrets are baked into the host environment. | packages/security/src/secrets/stores/env.ts:33 |
| <a id="property-prefix"></a> `prefix?` | `readonly` | `string` | Optional uppercase prefix applied to keys so multiple Graphorin deployments can share a process. Defaults to no prefix. | packages/security/src/secrets/stores/env.ts:27 |
