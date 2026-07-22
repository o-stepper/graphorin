[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / audit

# audit

Audit-log surface for `@graphorin/security`. Provides the
tamper-evident chain primitives (`appendAudit`, `verifyAuditChain`,
`pruneAudit`, `exportAudit`), the `AuditDb` lifecycle plumbing, the
binding registry, and the secrets-layer bridge that turns
`SecretsAuditEvent`s into chain entries.

## References

### \_resetAuditDbBindingsForTesting

Re-exports [_resetAuditDbBindingsForTesting](/api/@graphorin/security/functions/resetAuditDbBindingsForTesting.md)

***

### appendAudit

Re-exports [appendAudit](/api/@graphorin/security/functions/appendAudit.md)

***

### AuditAction

Re-exports [AuditAction](/api/@graphorin/security/type-aliases/AuditAction.md)

***

### AuditActor

Re-exports [AuditActor](/api/@graphorin/security/interfaces/AuditActor.md)

***

### AuditActorKind

Re-exports [AuditActorKind](/api/@graphorin/security/type-aliases/AuditActorKind.md)

***

### AuditChainBrokenError

Re-exports [AuditChainBrokenError](/api/@graphorin/security/classes/AuditChainBrokenError.md)

***

### AuditChainVerifyResult

Re-exports [AuditChainVerifyResult](/api/@graphorin/security/type-aliases/AuditChainVerifyResult.md)

***

### AuditContext

Re-exports [AuditContext](/api/@graphorin/security/interfaces/AuditContext.md)

***

### AuditDb

Re-exports [AuditDb](/api/@graphorin/security/interfaces/AuditDb.md)

***

### AuditDbBinding

Re-exports [AuditDbBinding](/api/@graphorin/security/interfaces/AuditDbBinding.md)

***

### AuditDbBindingId

Re-exports [AuditDbBindingId](/api/@graphorin/security/type-aliases/AuditDbBindingId.md)

***

### AuditDbCipherUnavailableError

Re-exports [AuditDbCipherUnavailableError](/api/@graphorin/security/classes/AuditDbCipherUnavailableError.md)

***

### AuditDecision

Re-exports [AuditDecision](/api/@graphorin/security/type-aliases/AuditDecision.md)

***

### AuditEntryInput

Re-exports [AuditEntryInput](/api/@graphorin/security/interfaces/AuditEntryInput.md)

***

### AuditExportWriter

Re-exports [AuditExportWriter](/api/@graphorin/security/interfaces/AuditExportWriter.md)

***

### AuditInclusionProof

Re-exports [AuditInclusionProof](/api/@graphorin/security/interfaces/AuditInclusionProof.md)

***

### auditLeafHash

Re-exports [auditLeafHash](/api/@graphorin/security/functions/auditLeafHash.md)

***

### auditMerkleTreeHash

Re-exports [auditMerkleTreeHash](/api/@graphorin/security/functions/auditMerkleTreeHash.md)

***

### AuditPayloadSerializationError

Re-exports [AuditPayloadSerializationError](/api/@graphorin/security/classes/AuditPayloadSerializationError.md)

***

### AuditTreeHead

Re-exports [AuditTreeHead](/api/@graphorin/security/interfaces/AuditTreeHead.md)

***

### AuthBridgeTeardown

Re-exports [AuthBridgeTeardown](/api/@graphorin/security/interfaces/AuthBridgeTeardown.md)

***

### bridgeAuthToAudit

Re-exports [bridgeAuthToAudit](/api/@graphorin/security/functions/bridgeAuthToAudit.md)

***

### BridgeAuthToAuditOptions

Re-exports [BridgeAuthToAuditOptions](/api/@graphorin/security/interfaces/BridgeAuthToAuditOptions.md)

***

### bridgeMemoryGuardToAudit

Re-exports [bridgeMemoryGuardToAudit](/api/@graphorin/security/functions/bridgeMemoryGuardToAudit.md)

***

### BridgeMemoryGuardToAuditOptions

Re-exports [BridgeMemoryGuardToAuditOptions](/api/@graphorin/security/interfaces/BridgeMemoryGuardToAuditOptions.md)

***

### bridgeOAuthToAudit

Re-exports [bridgeOAuthToAudit](/api/@graphorin/security/functions/bridgeOAuthToAudit.md)

***

### BridgeOAuthToAuditOptions

Re-exports [BridgeOAuthToAuditOptions](/api/@graphorin/security/interfaces/BridgeOAuthToAuditOptions.md)

***

### bridgeSecretsToAudit

Re-exports [bridgeSecretsToAudit](/api/@graphorin/security/functions/bridgeSecretsToAudit.md)

***

### BridgeSecretsToAuditOptions

Re-exports [BridgeSecretsToAuditOptions](/api/@graphorin/security/interfaces/BridgeSecretsToAuditOptions.md)

***

### bridgeSupplyChainToAudit

Re-exports [bridgeSupplyChainToAudit](/api/@graphorin/security/functions/bridgeSupplyChainToAudit.md)

***

### BridgeSupplyChainToAuditOptions

Re-exports [BridgeSupplyChainToAuditOptions](/api/@graphorin/security/interfaces/BridgeSupplyChainToAuditOptions.md)

***

### canonicalJson

Re-exports [canonicalJson](/api/@graphorin/security/functions/canonicalJson.md)

***

### computeAuditHash

Re-exports [computeAuditHash](/api/@graphorin/security/functions/computeAuditHash.md)

***

### computeAuditTreeHead

Re-exports [computeAuditTreeHead](/api/@graphorin/security/functions/computeAuditTreeHead.md)

***

### exportAudit

Re-exports [exportAudit](/api/@graphorin/security/functions/exportAudit.md)

***

### ExportAuditOptions

Re-exports [ExportAuditOptions](/api/@graphorin/security/interfaces/ExportAuditOptions.md)

***

### generateAuditSigningKeyPair

Re-exports [generateAuditSigningKeyPair](/api/@graphorin/security/functions/generateAuditSigningKeyPair.md)

***

### GENESIS\_PREV\_HASH

Re-exports [GENESIS_PREV_HASH](/api/@graphorin/security/variables/GENESIS_PREV_HASH.md)

***

### getDefaultAuditDbBinding

Re-exports [getDefaultAuditDbBinding](/api/@graphorin/security/functions/getDefaultAuditDbBinding.md)

***

### listAuditDbBindings

Re-exports [listAuditDbBindings](/api/@graphorin/security/functions/listAuditDbBindings.md)

***

### MemoryGuardBridgeTeardown

Re-exports [MemoryGuardBridgeTeardown](/api/@graphorin/security/interfaces/MemoryGuardBridgeTeardown.md)

***

### OAuthBridgeTeardown

Re-exports [OAuthBridgeTeardown](/api/@graphorin/security/interfaces/OAuthBridgeTeardown.md)

***

### openAuditDb

Re-exports [openAuditDb](/api/@graphorin/security/functions/openAuditDb.md)

***

### OpenAuditDbOptions

Re-exports [OpenAuditDbOptions](/api/@graphorin/security/interfaces/OpenAuditDbOptions.md)

***

### proveAuditConsistency

Re-exports [proveAuditConsistency](/api/@graphorin/security/functions/proveAuditConsistency.md)

***

### proveAuditInclusion

Re-exports [proveAuditInclusion](/api/@graphorin/security/functions/proveAuditInclusion.md)

***

### pruneAudit

Re-exports [pruneAudit](/api/@graphorin/security/functions/pruneAudit.md)

***

### PruneAuditLogEvent

Re-exports [PruneAuditLogEvent](/api/@graphorin/security/interfaces/PruneAuditLogEvent.md)

***

### PruneAuditOptions

Re-exports [PruneAuditOptions](/api/@graphorin/security/interfaces/PruneAuditOptions.md)

***

### PruneAuditResult

Re-exports [PruneAuditResult](/api/@graphorin/security/interfaces/PruneAuditResult.md)

***

### registerAuditDbBinding

Re-exports [registerAuditDbBinding](/api/@graphorin/security/functions/registerAuditDbBinding.md)

***

### SecretsBridgeTeardown

Re-exports [SecretsBridgeTeardown](/api/@graphorin/security/interfaces/SecretsBridgeTeardown.md)

***

### signAuditCheckpoint

Re-exports [signAuditCheckpoint](/api/@graphorin/security/functions/signAuditCheckpoint.md)

***

### SignedAuditCheckpoint

Re-exports [SignedAuditCheckpoint](/api/@graphorin/security/interfaces/SignedAuditCheckpoint.md)

***

### StoredAuditEntry

Re-exports [StoredAuditEntry](/api/@graphorin/security/interfaces/StoredAuditEntry.md)

***

### SupplyChainBridgeTeardown

Re-exports [SupplyChainBridgeTeardown](/api/@graphorin/security/interfaces/SupplyChainBridgeTeardown.md)

***

### verifyAuditAgainstCheckpoint

Re-exports [verifyAuditAgainstCheckpoint](/api/@graphorin/security/functions/verifyAuditAgainstCheckpoint.md)

***

### verifyAuditChain

Re-exports [verifyAuditChain](/api/@graphorin/security/functions/verifyAuditChain.md)

***

### verifyAuditCheckpointSignature

Re-exports [verifyAuditCheckpointSignature](/api/@graphorin/security/functions/verifyAuditCheckpointSignature.md)

***

### verifyAuditConsistency

Re-exports [verifyAuditConsistency](/api/@graphorin/security/functions/verifyAuditConsistency.md)

***

### verifyAuditInclusion

Re-exports [verifyAuditInclusion](/api/@graphorin/security/functions/verifyAuditInclusion.md)
