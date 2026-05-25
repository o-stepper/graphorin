[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / InstallSkillFromGitOptions

# Interface: InstallSkillFromGitOptions

Defined in: packages/security/src/supply-chain/installer.ts:166

Options accepted by [installSkillFromGit](/api/@graphorin/security/functions/installSkillFromGit.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-actor"></a> `actor?` | `readonly` | [`SupplyChainAuditActor`](/api/@graphorin/security/interfaces/SupplyChainAuditActor.md) | - | packages/security/src/supply-chain/installer.ts:177 |
| <a id="property-dryrun"></a> `dryRun?` | `readonly` | `boolean` | Skip the clone; runs the policy + audit pipeline only. | packages/security/src/supply-chain/installer.ts:174 |
| <a id="property-policy"></a> `policy?` | `readonly` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) | - | packages/security/src/supply-chain/installer.ts:170 |
| <a id="property-ref"></a> `ref?` | `readonly` | `string` | - | packages/security/src/supply-chain/installer.ts:168 |
| <a id="property-repourl"></a> `repoUrl` | `readonly` | `string` | - | packages/security/src/supply-chain/installer.ts:167 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Cancellation. | packages/security/src/supply-chain/installer.ts:172 |
| <a id="property-skillmd"></a> `skillMd?` | `readonly` | `string` | Optional pre-fetched SKILL.md content for offline verification. | packages/security/src/supply-chain/installer.ts:176 |
| <a id="property-trustlevel"></a> `trustLevel?` | `readonly` | [`SkillTrustLevel`](/api/@graphorin/security/type-aliases/SkillTrustLevel.md) | - | packages/security/src/supply-chain/installer.ts:169 |
