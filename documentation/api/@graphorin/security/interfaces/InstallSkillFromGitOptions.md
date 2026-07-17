[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InstallSkillFromGitOptions

# Interface: InstallSkillFromGitOptions

Defined in: [packages/security/src/supply-chain/installer.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L206)

Options accepted by [installSkillFromGit](/api/@graphorin/security/functions/installSkillFromGit.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`SupplyChainAuditActor`](/api/@graphorin/security/interfaces/SupplyChainAuditActor.md) | - | [packages/security/src/supply-chain/installer.ts:219](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L219) |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | Skip the clone; runs the policy + audit pipeline only. | [packages/security/src/supply-chain/installer.ts:216](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L216) |
| <a id="property-policy"></a> `policy?` | `readonly` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) | - | [packages/security/src/supply-chain/installer.ts:212](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L212) |
| <a id="property-ref"></a> `ref?` | `readonly` | `string` | - | [packages/security/src/supply-chain/installer.ts:210](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L210) |
| <a id="property-repourl"></a> `repoUrl` | `readonly` | `string` | - | [packages/security/src/supply-chain/installer.ts:209](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L209) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | [packages/security/src/supply-chain/installer.ts:214](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L214) |
| <a id="property-skillmd"></a> `skillMd?` | `readonly` | `string` | Optional pre-fetched SKILL.md content for offline verification. | [packages/security/src/supply-chain/installer.ts:218](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L218) |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | - | [packages/security/src/supply-chain/installer.ts:211](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L211) |
| <a id="property-trustroot"></a> `trustRoot?` | `readonly` | [`SkillTrustRoot`](/api/@graphorin/security/interfaces/SkillTrustRoot.md) | Operator trust root (D4 / security-01). See [SkillTrustRoot](/api/@graphorin/security/interfaces/SkillTrustRoot.md). | [packages/security/src/supply-chain/installer.ts:208](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/installer.ts#L208) |
