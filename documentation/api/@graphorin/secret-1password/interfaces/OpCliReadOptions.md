[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / OpCliReadOptions

# Interface: OpCliReadOptions

Defined in: packages/secret-1password/src/op-cli.ts:34

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-account"></a> `account?` | `readonly` | `string` | Optional `--account` override forwarded to the CLI. Useful when the operator is signed in to multiple 1Password accounts. | packages/secret-1password/src/op-cli.ts:54 |
| <a id="property-binary"></a> `binary?` | `readonly` | `string` | Override the binary path. Default `'op'` (looked up on `$PATH`). | packages/secret-1password/src/op-cli.ts:36 |
| <a id="property-connect"></a> `connect?` | `readonly` | \{ `host`: `string`; `token`: `string`; \} | Optional 1Password Connect host + token tuple. When set the resolver wires them through the `OP_CONNECT_HOST` / `OP_CONNECT_TOKEN` env vars (the canonical Connect-mode contract documented by 1Password). | packages/secret-1password/src/op-cli.ts:49 |
| `connect.host` | `readonly` | `string` | - | packages/secret-1password/src/op-cli.ts:49 |
| `connect.token` | `readonly` | `string` | - | packages/secret-1password/src/op-cli.ts:49 |
| <a id="property-env"></a> `env?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string` \| `undefined`\&gt;\> | Override `process.env`. Default forwards the parent process. | packages/secret-1password/src/op-cli.ts:40 |
| <a id="property-preservecolor"></a> `preserveColor?` | `readonly` | `boolean` | Optional `--no-color` flag suppression. The resolver always sets `--no-color` so terminal colour codes do not leak into the resolved value; pass `true` to opt out. | packages/secret-1password/src/op-cli.ts:60 |
| <a id="property-serviceaccounttoken"></a> `serviceAccountToken?` | `readonly` | `string` | Optional 1Password Connect / Service-Account token forwarding. | packages/secret-1password/src/op-cli.ts:42 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Hard timeout in milliseconds. Default `15000`. | packages/secret-1password/src/op-cli.ts:38 |
