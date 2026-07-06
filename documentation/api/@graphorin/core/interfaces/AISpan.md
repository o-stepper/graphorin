[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AISpan

# Interface: AISpan\&lt;T\&gt;

Defined in: packages/core/src/contracts/tracer.ts:132

Typed span. Generic over `SpanType` so consumers can specialize a
function on a particular span kind without losing the discriminator.

## Stable

## Extended by

- [`GraphorinSpan`](/api/@graphorin/observability/interfaces/GraphorinSpan.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) | [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/core/src/contracts/tracer.ts:134 |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | packages/core/src/contracts/tracer.ts:136 |
| <a id="property-traceid"></a> `traceId` | `readonly` | `string` | packages/core/src/contracts/tracer.ts:135 |
| <a id="property-type"></a> `type` | `readonly` | `T` | packages/core/src/contracts/tracer.ts:133 |

## Methods

### addEvent()

```ts
addEvent(
   name, 
   attrs?, 
   opts?): void;
```

Defined in: packages/core/src/contracts/tracer.ts:146

Append a span event (attribute-bearing time-stamped marker). The
optional `opts` (W-094) tags the event's attributes with a
sensitivity tier so the validation exporter can pass safe ones
through the default-deny floor - untagged attributes keep being
dropped below the floor.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `attrs?` | `Readonly`\&lt;`Record`\&lt;`string`, [`SpanAttributeValue`](/api/@graphorin/core/type-aliases/SpanAttributeValue.md)\&gt;\&gt; |
| `opts?` | [`AddEventOptions`](/api/@graphorin/core/interfaces/AddEventOptions.md) |

#### Returns

`void`

***

### end()

```ts
end(): void;
```

Defined in: packages/core/src/contracts/tracer.ts:152

End the span. Idempotent.

#### Returns

`void`

***

### recordException()

```ts
recordException(err): void;
```

Defined in: packages/core/src/contracts/tracer.ts:148

Record an exception. Multiple calls are kept in the span event log.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

#### Returns

`void`

***

### setAttributes()

```ts
setAttributes(attrs): void;
```

Defined in: packages/core/src/contracts/tracer.ts:138

Add or replace attributes. Repeated calls are merged (last write wins).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `attrs` | [`SpanAttributes`](/api/@graphorin/core/type-aliases/SpanAttributes.md) |

#### Returns

`void`

***

### setStatus()

```ts
setStatus(status, message?): void;
```

Defined in: packages/core/src/contracts/tracer.ts:150

Set the terminal status.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`SpanStatus`](/api/@graphorin/core/type-aliases/SpanStatus.md) |
| `message?` | `string` |

#### Returns

`void`
