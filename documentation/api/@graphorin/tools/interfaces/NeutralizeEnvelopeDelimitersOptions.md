[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / NeutralizeEnvelopeDelimitersOptions

# Interface: NeutralizeEnvelopeDelimitersOptions

Defined in: [packages/tools/src/inbound/envelope.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/envelope.ts#L49)

Options for [neutralizeEnvelopeDelimiters](/api/@graphorin/tools/functions/neutralizeEnvelopeDelimiters.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-neutralizeangleruns"></a> `neutralizeAngleRuns?` | `readonly` | `boolean` | Also collapse ANY run of three-or-more angle brackets (`<<<` / `>>>`) to `[[` / `]]`, not just runs that spell an envelope marker. Off by default: legitimate content routinely carries such runs (Python doctest / REPL `>>>`, shell heredoc `<<<EOF`) and mangling them would corrupt benign tool results. The envelope boundary is already protected by the marker-specific substitution without this. | [packages/tools/src/inbound/envelope.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/envelope.ts#L59) |
