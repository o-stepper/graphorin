[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / ValidatedFrontmatter

# Interface: ValidatedFrontmatter

Defined in: packages/skills/src/frontmatter/index.ts:178

Successful return of [validateFrontmatter](/api/@graphorin/skills/frontmatter/functions/validateFrontmatter.md).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-diagnostics"></a> `diagnostics` | `readonly` | readonly [`FrontmatterDiagnostic`](/api/@graphorin/skills/interfaces/FrontmatterDiagnostic.md)[] | packages/skills/src/frontmatter/index.ts:180 |
| <a id="property-raw"></a> `raw` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | packages/skills/src/frontmatter/index.ts:179 |
| <a id="property-resolved"></a> `resolved` | `readonly` | \{ `allowedTools`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `anthropicSpec`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `compatibility`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `description`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `disableModelInvocation`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `handoffInputFilter`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `license`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `metadata`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `name`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `runtimeCompat`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `sandbox`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `sensitivity`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `sensitivityDefaults`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `tools`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `trustLevel`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; `version`: [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt;; \} | packages/skills/src/frontmatter/index.ts:181 |
| `resolved.allowedTools` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:187 |
| `resolved.anthropicSpec` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:195 |
| `resolved.compatibility` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:185 |
| `resolved.description` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:183 |
| `resolved.disableModelInvocation` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:188 |
| `resolved.handoffInputFilter` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:194 |
| `resolved.license` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:184 |
| `resolved.metadata` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:186 |
| `resolved.name` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:182 |
| `resolved.runtimeCompat` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:190 |
| `resolved.sandbox` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:193 |
| `resolved.sensitivity` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:191 |
| `resolved.sensitivityDefaults` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:192 |
| `resolved.tools` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:197 |
| `resolved.trustLevel` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:189 |
| `resolved.version` | `readonly` | [`FieldResolution`](/api/@graphorin/skills/interfaces/FieldResolution.md)\&lt;`unknown`\&gt; | packages/skills/src/frontmatter/index.ts:196 |
