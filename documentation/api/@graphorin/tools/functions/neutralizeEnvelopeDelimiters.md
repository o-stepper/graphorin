[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / neutralizeEnvelopeDelimiters

# Function: neutralizeEnvelopeDelimiters()

```ts
function neutralizeEnvelopeDelimiters(body, options?): string;
```

Defined in: [packages/tools/src/inbound/envelope.ts:90](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/inbound/envelope.ts#L90)

Replace untrusted-content envelope markers embedded in `body` with
the visible `[[` / `]]` bracket-substitution so the body cannot
prematurely close (or spoof a nested opening of) the envelope that
`applyInboundSanitization` wraps around it.

The substitution scheme is identical to the memory package's CE-15
summary neutralization on literal markers:
`<<</untrusted_content>>>` becomes `[[/untrusted_content]]` and the
`<<<untrusted_content` prefix becomes `[[untrusted_content`. Bodies
that contain no envelope markers are returned bytes-equal.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `string` |
| `options?` | [`NeutralizeEnvelopeDelimitersOptions`](/api/@graphorin/tools/interfaces/NeutralizeEnvelopeDelimitersOptions.md) |

## Returns

`string`

## Stable
