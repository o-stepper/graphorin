[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / SessionCounters

# Interface: SessionCounters

Defined in: packages/sessions/src/facade.ts:104

Counter receiver used by the commentary sanitizer + the cassette
audit emissions. Defaults to a no-op. Hook your `@graphorin/observability`
meter into this when wiring the session manager into a server.

## Stable

## Methods

### inc()

```ts
inc(
   name, 
   value, 
   labels?): void;
```

Defined in: packages/sessions/src/facade.ts:105

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | `number` |
| `labels?` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> |

#### Returns

`void`
