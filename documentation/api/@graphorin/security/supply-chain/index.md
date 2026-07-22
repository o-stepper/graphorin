[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / supply-chain

# supply-chain

Skills supply-chain subsystem of `@graphorin/security`. Implements
the install-time defences:

- ed25519 signature verification of `SKILL.md`.
- `--ignore-scripts` enforcement against npm + git installs.
- Operator-managed allow / deny lists with optional framework
  denylist hook.
- In-memory installation registry consumed by the audit CLI.

## References

### \_getSupplyChainAuditListenerCountForTesting

Re-exports [_getSupplyChainAuditListenerCountForTesting](/api/@graphorin/security/functions/getSupplyChainAuditListenerCountForTesting.md)

***

### \_resetSkillInstallationsForTesting

Re-exports [_resetSkillInstallationsForTesting](/api/@graphorin/security/functions/resetSkillInstallationsForTesting.md)

***

### \_resetSupplyChainAuditListenersForTesting

Re-exports [_resetSupplyChainAuditListenersForTesting](/api/@graphorin/security/functions/resetSupplyChainAuditListenersForTesting.md)

***

### \_setFrameworkDenylistForTesting

Re-exports [_setFrameworkDenylistForTesting](/api/@graphorin/security/functions/setFrameworkDenylistForTesting.md)

***

### \_setPackageManagerForTesting

Re-exports [_setPackageManagerForTesting](/api/@graphorin/security/functions/setPackageManagerForTesting.md)

***

### \_setPackageManagerRunnerForTesting

Re-exports [_setPackageManagerRunnerForTesting](/api/@graphorin/security/functions/setPackageManagerRunnerForTesting.md)

***

### \_setPublicKeyFetcherForTesting

Re-exports [_setPublicKeyFetcherForTesting](/api/@graphorin/security/functions/setPublicKeyFetcherForTesting.md)

***

### \_setSigstoreVerifierForTesting

Re-exports [_setSigstoreVerifierForTesting](/api/@graphorin/security/functions/setSigstoreVerifierForTesting.md)

***

### assertPolicyAllows

Re-exports [assertPolicyAllows](/api/@graphorin/security/functions/assertPolicyAllows.md)

***

### auditInstalledSkills

Re-exports [auditInstalledSkills](/api/@graphorin/security/functions/auditInstalledSkills.md)

***

### buildInstallInvocation

Re-exports [buildInstallInvocation](/api/@graphorin/security/functions/buildInstallInvocation.md)

***

### canonicalizeForSignature

Re-exports [canonicalizeForSignature](/api/@graphorin/security/functions/canonicalizeForSignature.md)

***

### detectPackageManager

Re-exports [detectPackageManager](/api/@graphorin/security/functions/detectPackageManager.md)

***

### emitSupplyChainAudit

Re-exports [emitSupplyChainAudit](/api/@graphorin/security/functions/emitSupplyChainAudit.md)

***

### evaluateSupplyChainPolicy

Re-exports [evaluateSupplyChainPolicy](/api/@graphorin/security/functions/evaluateSupplyChainPolicy.md)

***

### extractSignatureBlock

Re-exports [extractSignatureBlock](/api/@graphorin/security/functions/extractSignatureBlock.md)

***

### GraphorinSupplyChainError

Re-exports [GraphorinSupplyChainError](/api/@graphorin/security/classes/GraphorinSupplyChainError.md)

***

### installSkillFromGit

Re-exports [installSkillFromGit](/api/@graphorin/security/functions/installSkillFromGit.md)

***

### InstallSkillFromGitOptions

Re-exports [InstallSkillFromGitOptions](/api/@graphorin/security/interfaces/InstallSkillFromGitOptions.md)

***

### installSkillFromNpm

Re-exports [installSkillFromNpm](/api/@graphorin/security/functions/installSkillFromNpm.md)

***

### InstallSkillFromNpmOptions

Re-exports [InstallSkillFromNpmOptions](/api/@graphorin/security/interfaces/InstallSkillFromNpmOptions.md)

***

### matchesGlob

Re-exports [matchesGlob](/api/@graphorin/security/functions/matchesGlob.md)

***

### onSupplyChainAudit

Re-exports [onSupplyChainAudit](/api/@graphorin/security/functions/onSupplyChainAudit.md)

***

### PackageManagerKind

Re-exports [PackageManagerKind](/api/@graphorin/security/type-aliases/PackageManagerKind.md)

***

### PackageManagerResult

Re-exports [PackageManagerResult](/api/@graphorin/security/interfaces/PackageManagerResult.md)

***

### PackageManagerRunner

Re-exports [PackageManagerRunner](/api/@graphorin/security/type-aliases/PackageManagerRunner.md)

***

### parseFrontmatter

Re-exports [parseFrontmatter](/api/@graphorin/security/functions/parseFrontmatter.md)

***

### PublicKeyFetcher

Re-exports [PublicKeyFetcher](/api/@graphorin/security/type-aliases/PublicKeyFetcher.md)

***

### recordInstallation

Re-exports [recordInstallation](/api/@graphorin/security/functions/recordInstallation.md)

***

### ResolvedSkillTrustPolicy

Re-exports [ResolvedSkillTrustPolicy](/api/@graphorin/security/interfaces/ResolvedSkillTrustPolicy.md)

***

### resolveTrustPolicy

Re-exports [resolveTrustPolicy](/api/@graphorin/security/functions/resolveTrustPolicy.md)

***

### runPackageManager

Re-exports [runPackageManager](/api/@graphorin/security/functions/runPackageManager.md)

***

### SigstoreVerifier

Re-exports [SigstoreVerifier](/api/@graphorin/security/type-aliases/SigstoreVerifier.md)

***

### SkillInstallationStatus

Re-exports [SkillInstallationStatus](/api/@graphorin/security/interfaces/SkillInstallationStatus.md)

***

### SkillInstallDeniedError

Re-exports [SkillInstallDeniedError](/api/@graphorin/security/classes/SkillInstallDeniedError.md)

***

### SkillInstallError

Re-exports [SkillInstallError](/api/@graphorin/security/classes/SkillInstallError.md)

***

### SkillManifestParseError

Re-exports [SkillManifestParseError](/api/@graphorin/security/classes/SkillManifestParseError.md)

***

### SkillPublicKeyRef

Re-exports [SkillPublicKeyRef](/api/@graphorin/security/type-aliases/SkillPublicKeyRef.md)

***

### SkillSignatureBlock

Re-exports [SkillSignatureBlock](/api/@graphorin/security/interfaces/SkillSignatureBlock.md)

***

### SkillSignatureInvalidError

Re-exports [SkillSignatureInvalidError](/api/@graphorin/security/classes/SkillSignatureInvalidError.md)

***

### SkillSignatureMissingError

Re-exports [SkillSignatureMissingError](/api/@graphorin/security/classes/SkillSignatureMissingError.md)

***

### SkillSignatureVerificationResult

Re-exports [SkillSignatureVerificationResult](/api/@graphorin/security/interfaces/SkillSignatureVerificationResult.md)

***

### SkillSource

Re-exports [SkillSource](/api/@graphorin/security/type-aliases/SkillSource.md)

***

### SkillTrustLevel

Re-exports [SkillTrustLevel](/api/@graphorin/security/type-aliases/SkillTrustLevel.md)

***

### SkillTrustRoot

Re-exports [SkillTrustRoot](/api/@graphorin/security/interfaces/SkillTrustRoot.md)

***

### splitFrontmatter

Re-exports [splitFrontmatter](/api/@graphorin/security/functions/splitFrontmatter.md)

***

### SplitFrontmatter

Re-exports [SplitFrontmatter](/api/@graphorin/security/interfaces/SplitFrontmatter.md)

***

### SupplyChainAuditAction

Re-exports [SupplyChainAuditAction](/api/@graphorin/security/type-aliases/SupplyChainAuditAction.md)

***

### SupplyChainAuditActor

Re-exports [SupplyChainAuditActor](/api/@graphorin/security/interfaces/SupplyChainAuditActor.md)

***

### SupplyChainAuditDecision

Re-exports [SupplyChainAuditDecision](/api/@graphorin/security/type-aliases/SupplyChainAuditDecision.md)

***

### SupplyChainAuditEvent

Re-exports [SupplyChainAuditEvent](/api/@graphorin/security/interfaces/SupplyChainAuditEvent.md)

***

### SupplyChainAuditListener

Re-exports [SupplyChainAuditListener](/api/@graphorin/security/type-aliases/SupplyChainAuditListener.md)

***

### SupplyChainDecision

Re-exports [SupplyChainDecision](/api/@graphorin/security/type-aliases/SupplyChainDecision.md)

***

### SupplyChainPolicy

Re-exports [SupplyChainPolicy](/api/@graphorin/security/interfaces/SupplyChainPolicy.md)

***

### TrustLevelEscalationError

Re-exports [TrustLevelEscalationError](/api/@graphorin/security/classes/TrustLevelEscalationError.md)

***

### verifySkillSignature

Re-exports [verifySkillSignature](/api/@graphorin/security/functions/verifySkillSignature.md)

***

### VerifySkillSignatureOptions

Re-exports [VerifySkillSignatureOptions](/api/@graphorin/security/interfaces/VerifySkillSignatureOptions.md)
