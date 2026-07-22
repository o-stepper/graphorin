[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / InboundSanitizationPreamble

# Interface: InboundSanitizationPreamble

Defined in: packages/memory/src/context-engine/locale-packs/types.ts:51

**`Stable`**

Inbound-sanitization preamble fragment. Injected after the
cache breakpoint (Layer 5/6 territory) on steps containing
untrusted tool output.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-text"></a> `text` | `readonly` | `string` | Verbatim text appended to the system message when fired. | packages/memory/src/context-engine/locale-packs/types.ts:53 |
