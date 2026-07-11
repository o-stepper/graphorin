[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / ParsedActivationTrigger

# Interface: ParsedActivationTrigger

Defined in: [packages/skills/src/registry/index.ts:372](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L372)

Parsed activation trigger. The registry uses this to discriminate
slash-command activations (which override
`disable-model-invocation: true`) from model-emitted auto
activations (which honour it).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-activationkind"></a> `activationKind` | `readonly` | `"auto"` \| `"slash-command"` \| `"explicit"` | [packages/skills/src/registry/index.ts:374](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L374) |
| <a id="property-args"></a> `args?` | `readonly` | `string` | [packages/skills/src/registry/index.ts:375](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L375) |
| <a id="property-name"></a> `name` | `readonly` | `string` | [packages/skills/src/registry/index.ts:373](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/registry/index.ts#L373) |
