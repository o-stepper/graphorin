[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / Skill

# Interface: Skill

Defined in: [packages/skills/src/types/index.ts:276](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L276)

Loaded skill record returned by [SkillRegistry.getSkill](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md#getskill) and
[loadSkills](/api/@graphorin/skills/loader/functions/loadSkills.md). Three-tier semantics:

- [Skill.metadata](/api/@graphorin/skills/interfaces/Skill.md#property-metadata) - always available (parsed at load time).
- [Skill.body](/api/@graphorin/skills/interfaces/Skill.md#body)     - lazy; resolved on first call. Cached for
  subsequent calls.
- [Skill.resources](/api/@graphorin/skills/interfaces/Skill.md#resources) - lazy listing; resource bytes are only
  read when [SkillResource.read](/api/@graphorin/skills/interfaces/SkillResource.md#read) is invoked.
- [Skill.tools](/api/@graphorin/skills/interfaces/Skill.md#tools)    - derived from the `graphorin-tools`
  declarations; the actual `Tool[]` is materialised by the agent
  runtime through the `@graphorin/tools` registry.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-basepath"></a> `basePath?` | `readonly` | `string` | [packages/skills/src/types/index.ts:279](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L279) |
| <a id="property-metadata"></a> `metadata` | `readonly` | [`SkillMetadata`](/api/@graphorin/skills/interfaces/SkillMetadata.md) | [packages/skills/src/types/index.ts:277](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L277) |
| <a id="property-signature"></a> `signature?` | `readonly` | [`SkillSignatureVerificationResult`](/api/@graphorin/skills/interfaces/SkillSignatureVerificationResult.md) | [packages/skills/src/types/index.ts:281](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L281) |
| <a id="property-source"></a> `source` | `readonly` | [`SkillSource`](/api/@graphorin/skills/type-aliases/SkillSource.md) | [packages/skills/src/types/index.ts:278](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L278) |
| <a id="property-trustpolicy"></a> `trustPolicy` | `readonly` | [`ResolvedSkillTrustPolicy`](/api/@graphorin/skills/interfaces/ResolvedSkillTrustPolicy.md) | [packages/skills/src/types/index.ts:280](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L280) |

## Methods

### body()

```ts
body(signal?): Promise<string>;
```

Defined in: [packages/skills/src/types/index.ts:282](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L282)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;`string`\&gt;

***

### diagnostics()

```ts
diagnostics(): readonly FrontmatterDiagnostic[];
```

Defined in: [packages/skills/src/types/index.ts:293](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L293)

#### Returns

readonly [`FrontmatterDiagnostic`](/api/@graphorin/skills/interfaces/FrontmatterDiagnostic.md)[]

***

### resources()

```ts
resources(signal?): Promise<readonly SkillResource[]>;
```

Defined in: [packages/skills/src/types/index.ts:283](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L283)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `signal?` | `AbortSignal` |

#### Returns

`Promise`\&lt;readonly [`SkillResource`](/api/@graphorin/skills/interfaces/SkillResource.md)[]\&gt;

***

### toolDeclarations()

```ts
toolDeclarations(): readonly SkillToolDeclaration[];
```

Defined in: [packages/skills/src/types/index.ts:292](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L292)

#### Returns

readonly [`SkillToolDeclaration`](/api/@graphorin/skills/interfaces/SkillToolDeclaration.md)[]

***

### tools()

```ts
tools(): readonly InlineSkillTool[];
```

Defined in: [packages/skills/src/types/index.ts:291](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L291)

Pre-built tools shipped with the skill. The inline source is the
only path through which the loader carries actual `Tool[]`
records; folder / npm / git sources return `[]` here and the
agent runtime (Phase 12) materialises tools from the
`graphorin-tools` declarations + the skill's `tools/` directory.

#### Returns

readonly [`InlineSkillTool`](/api/@graphorin/skills/type-aliases/InlineSkillTool.md)[]
