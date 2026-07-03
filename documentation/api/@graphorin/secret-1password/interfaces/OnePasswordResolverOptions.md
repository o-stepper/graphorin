[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / OnePasswordResolverOptions

# Interface: OnePasswordResolverOptions

Defined in: packages/secret-1password/src/resolver.ts:25

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-account"></a> `account?` | `readonly` | `string` | Optional `--account` override. Useful when the operator is signed in to multiple 1Password accounts. | packages/secret-1password/src/resolver.ts:52 |
| <a id="property-binary"></a> `binary?` | `readonly` | `string` | Override the CLI binary path. Default `'op'`. | packages/secret-1password/src/resolver.ts:32 |
| <a id="property-cli"></a> `cli?` | `readonly` | [`OpCli`](/api/@graphorin/secret-1password/interfaces/OpCli.md) | Inject a [OpCli](/api/@graphorin/secret-1password/interfaces/OpCli.md) implementation. Defaults to a wrapper that spawns the system `op` binary. Tests pass a stub. | packages/secret-1password/src/resolver.ts:30 |
| <a id="property-connect"></a> `connect?` | `readonly` | \{ `host`: `string`; `token`: `string`; \} | Optional 1Password Connect host + token. Mutually exclusive with a service-account token at the CLI level (the CLI honours the Connect env vars if both are present). | packages/secret-1password/src/resolver.ts:47 |
| `connect.host` | `readonly` | `string` | - | packages/secret-1password/src/resolver.ts:47 |
| `connect.token` | `readonly` | `string` | - | packages/secret-1password/src/resolver.ts:47 |
| <a id="property-preservecase"></a> `preserveCase?` | `readonly` | `boolean` | If `true`, do **not** lowercase the URI before forwarding to the CLI. Default `false`. Toggle only when interoperating with a deployment that intentionally relies on case-sensitive keys. | packages/secret-1password/src/resolver.ts:58 |
| <a id="property-serviceaccounttoken"></a> `serviceAccountToken?` | `readonly` | `string` | Optional service-account token. When set the resolver forwards it via `OP_SERVICE_ACCOUNT_TOKEN` so the CLI runs in headless mode. The token is itself a secret — pass a previously-resolved `SecretValue` and use `.use(...)` to scope its lifetime. | packages/secret-1password/src/resolver.ts:41 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Hard timeout per resolve. Default `15000` ms. | packages/secret-1password/src/resolver.ts:34 |
