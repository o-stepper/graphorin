[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / StampedSkillTool

# Interface: StampedSkillTool\&lt;TInput, TOutput, TDeps\&gt;

Defined in: [packages/skills/src/registry/bridge.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/bridge.ts#L23)

Result of [stampSkillTool](/api/@graphorin/skills/functions/stampSkillTool.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TInput` | `unknown` |
| `TOutput` | `unknown` |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-inboundsanitizationforced"></a> `inboundSanitizationForced` | `readonly` | `boolean` | `true` when the inbound sanitization policy was upgraded to the untrusted default. | [packages/skills/src/registry/bridge.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/bridge.ts#L31) |
| <a id="property-resolvedsandbox"></a> `resolvedSandbox` | `readonly` | [`ResolvedSandboxPolicy`](/api/@graphorin/security/interfaces/ResolvedSandboxPolicy.md) | Resolved sandbox policy after the tier resolver ran. | [packages/skills/src/registry/bridge.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/bridge.ts#L27) |
| <a id="property-sandboxforced"></a> `sandboxForced` | `readonly` | `boolean` | `true` when the resolver overrode the operator's choice. | [packages/skills/src/registry/bridge.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/bridge.ts#L29) |
| <a id="property-source"></a> `source` | `readonly` | [`ToolSource`](/api/@graphorin/core/type-aliases/ToolSource.md) | - | [packages/skills/src/registry/bridge.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/bridge.ts#L25) |
| <a id="property-tool"></a> `tool` | `readonly` | [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`TInput`, `TOutput`, `TDeps`\&gt; | - | [packages/skills/src/registry/bridge.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/bridge.ts#L24) |
