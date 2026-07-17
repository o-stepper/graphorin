[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InstallSkillFromNpmOptions

# Interface: InstallSkillFromNpmOptions

Defined in: [packages/security/src/supply-chain/installer.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L48)

Options accepted by [installSkillFromNpm](/api/@graphorin/security/functions/installSkillFromNpm.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`SupplyChainAuditActor`](/api/@graphorin/security/interfaces/SupplyChainAuditActor.md) | Override actor recorded in the audit event. | [packages/security/src/supply-chain/installer.ts:70](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L70) |
| <a id="property-cwd"></a> `cwd?` | `readonly` | `string` | Where to install the package. Defaults to a fresh temp dir. | [packages/security/src/supply-chain/installer.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L60) |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | Skip the actual install; runs the policy + audit pipeline only. | [packages/security/src/supply-chain/installer.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L66) |
| <a id="property-env"></a> `env?` | `readonly` | `ProcessEnv` | Forwarded to the package-manager runner. | [packages/security/src/supply-chain/installer.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L62) |
| <a id="property-packagename"></a> `packageName` | `readonly` | `string` | - | [packages/security/src/supply-chain/installer.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L49) |
| <a id="property-policy"></a> `policy?` | `readonly` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) | - | [packages/security/src/supply-chain/installer.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L52) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | [packages/security/src/supply-chain/installer.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L64) |
| <a id="property-skillmd"></a> `skillMd?` | `readonly` | `string` | Optional pre-fetched SKILL.md content for offline verification. | [packages/security/src/supply-chain/installer.ts:68](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L68) |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | - | [packages/security/src/supply-chain/installer.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L51) |
| <a id="property-trustroot"></a> `trustRoot?` | `readonly` | [`SkillTrustRoot`](/api/@graphorin/security/interfaces/SkillTrustRoot.md) | Operator trust root (D4 / security-01) threaded into signature verification: a valid signature from a key not in the root is rejected. See [SkillTrustRoot](/api/@graphorin/security/interfaces/SkillTrustRoot.md). | [packages/security/src/supply-chain/installer.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L58) |
| <a id="property-version"></a> `version?` | `readonly` | `string` | - | [packages/security/src/supply-chain/installer.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L50) |
