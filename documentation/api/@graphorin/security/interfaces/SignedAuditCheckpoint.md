[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SignedAuditCheckpoint

# Interface: SignedAuditCheckpoint

Defined in: packages/security/src/audit/merkle.ts:336

**`Stable`**

Ed25519-signed audit checkpoint (a signed tree head). Persist it
anywhere outside the writer's reach (a different host, an object
store, a ticket) - any later rewrite of the covered prefix fails the
consistency proof against it.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-head"></a> `head` | `readonly` | [`AuditTreeHead`](/api/@graphorin/security/interfaces/AuditTreeHead.md) | - | packages/security/src/audit/merkle.ts:337 |
| <a id="property-publickeypem"></a> `publicKeyPem` | `readonly` | `string` | PEM (SPKI) public key - carried for convenience; pin it separately. | packages/security/src/audit/merkle.ts:345 |
| <a id="property-signature"></a> `signature` | `readonly` | `string` | base64url Ed25519 signature over the canonical checkpoint body. | packages/security/src/audit/merkle.ts:343 |
| <a id="property-signedat"></a> `signedAt` | `readonly` | `string` | ISO-8601 signing time. | packages/security/src/audit/merkle.ts:341 |
| <a id="property-writerid"></a> `writerId` | `readonly` | `string` | Stable id of the signing writer (operator / CI / host). | packages/security/src/audit/merkle.ts:339 |
