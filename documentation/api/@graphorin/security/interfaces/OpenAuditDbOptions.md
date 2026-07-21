[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OpenAuditDbOptions

# Interface: OpenAuditDbOptions

Defined in: packages/security/src/audit/audit-db.ts:41

**`Stable`**

Options forwarded to a binding factory when `openAuditDb(...)` runs.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-binding"></a> `binding?` | `readonly` | [`AuditDbBindingId`](/api/@graphorin/security/type-aliases/AuditDbBindingId.md) | Identifier of the binding to use. Defaults to the default binding. | packages/security/src/audit/audit-db.ts:51 |
| <a id="property-cipher"></a> `cipher?` | `readonly` | `string` | Cipher name. Defaults to the binding's preferred cipher. | packages/security/src/audit/audit-db.ts:47 |
| <a id="property-cipheroptions"></a> `cipherOptions?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | Cipher-specific options. Forwarded verbatim to the binding. | packages/security/src/audit/audit-db.ts:49 |
| <a id="property-passphrase"></a> `passphrase` | `readonly` | [`SecretValue`](/api/@graphorin/security/classes/SecretValue.md) | Passphrase used to derive the cipher key. | packages/security/src/audit/audit-db.ts:45 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Filesystem path to the audit database file. | packages/security/src/audit/audit-db.ts:43 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional logger for warnings emitted during open. | packages/security/src/audit/audit-db.ts:53 |
