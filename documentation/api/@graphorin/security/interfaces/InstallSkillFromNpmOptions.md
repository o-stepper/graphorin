[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InstallSkillFromNpmOptions

# Interface: InstallSkillFromNpmOptions

Defined in: packages/security/src/supply-chain/installer.ts:48

**`Stable`**

Options accepted by [installSkillFromNpm](/api/@graphorin/security/functions/installSkillFromNpm.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`SupplyChainAuditActor`](/api/@graphorin/security/interfaces/SupplyChainAuditActor.md) | Override actor recorded in the audit event. | packages/security/src/supply-chain/installer.ts:70 |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | Where to install the package. Defaults to a fresh temp dir. | packages/security/src/supply-chain/installer.ts:60 |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | Skip the actual install; runs the policy + audit pipeline only. | packages/security/src/supply-chain/installer.ts:66 |
| <a id="property-env"></a> `env?` | `readonly` | `ProcessEnv` | Forwarded to the package-manager runner. | packages/security/src/supply-chain/installer.ts:62 |
| <a id="property-packagename"></a> `packageName` | `readonly` | `string` | - | packages/security/src/supply-chain/installer.ts:49 |
| <a id="property-policy"></a> `policy?` | `readonly` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) | - | packages/security/src/supply-chain/installer.ts:52 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | packages/security/src/supply-chain/installer.ts:64 |
| <a id="property-skillmd"></a> `skillMd?` | `readonly` | `string` | Optional pre-fetched SKILL.md content for offline verification. | packages/security/src/supply-chain/installer.ts:68 |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | - | packages/security/src/supply-chain/installer.ts:51 |
| <a id="property-trustroot"></a> `trustRoot?` | `readonly` | [`SkillTrustRoot`](/api/@graphorin/security/interfaces/SkillTrustRoot.md) | Operator trust root threaded into signature verification: a valid signature from a key not in the root is rejected. See [SkillTrustRoot](/api/@graphorin/security/interfaces/SkillTrustRoot.md). | packages/security/src/supply-chain/installer.ts:58 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | - | packages/security/src/supply-chain/installer.ts:50 |
