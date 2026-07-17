[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InboundSanitizationPreamble

# Interface: InboundSanitizationPreamble

Defined in: [packages/memory/src/context-engine/locale-packs/types.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L51)

D4 inbound-sanitization preamble fragment. Injected after the
cache breakpoint (Layer 5/6 territory) on steps containing
untrusted tool output.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-text"></a> `text` | `readonly` | `string` | Verbatim text appended to the system message when fired. | [packages/memory/src/context-engine/locale-packs/types.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/types.ts#L53) |
