[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / GraphorinSpan

# Interface: GraphorinSpan\&lt;T\&gt;

Defined in: packages/observability/src/tracer/span.ts:38

The internal span carries the convenience `setAttribute(...)` method
exposed by the tracer surface (per-attribute sensitivity tagging) on
top of the standard [AISpan](/api/@graphorin/core/interfaces/AISpan.md) contract.

## Stable

## Extends

- [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;`T`\&gt;

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) | [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Properties

| Property | Modifier | Type | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`id`](/api/@graphorin/core/interfaces/AISpan.md#property-id) | packages/core/dist/contracts/tracer.d.ts:34 |
| <a id="property-parentid"></a> `parentId?` | `readonly` | `string` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`parentId`](/api/@graphorin/core/interfaces/AISpan.md#property-parentid) | packages/core/dist/contracts/tracer.d.ts:36 |
| <a id="property-traceid"></a> `traceId` | `readonly` | `string` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`traceId`](/api/@graphorin/core/interfaces/AISpan.md#property-traceid) | packages/core/dist/contracts/tracer.d.ts:35 |
| <a id="property-type"></a> `type` | `readonly` | `T` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`type`](/api/@graphorin/core/interfaces/AISpan.md#property-type) | packages/core/dist/contracts/tracer.d.ts:33 |

## Methods

### addEvent()

```ts
addEvent(name, attrs?): void;
```

Defined in: packages/core/dist/contracts/tracer.d.ts:40

Append a span event (attribute-bearing time-stamped marker).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `attrs?` | `Readonly`\<`Record`\&lt;`string`, [`SpanAttributeValue`](/api/@graphorin/core/type-aliases/SpanAttributeValue.md)\&gt;\> |

#### Returns

`void`

#### Inherited from

[`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`addEvent`](/api/@graphorin/core/interfaces/AISpan.md#addevent)

***

### end()

```ts
end(): void;
```

Defined in: packages/core/dist/contracts/tracer.d.ts:46

End the span. Idempotent.

#### Returns

`void`

#### Inherited from

[`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`end`](/api/@graphorin/core/interfaces/AISpan.md#end)

***

### recordException()

```ts
recordException(err): void;
```

Defined in: packages/core/dist/contracts/tracer.d.ts:42

Record an exception. Multiple calls are kept in the span event log.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

#### Returns

`void`

#### Inherited from

[`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`recordException`](/api/@graphorin/core/interfaces/AISpan.md#recordexception)

***

### setAttribute()

```ts
setAttribute(
   name, 
   value, 
   opts?): void;
```

Defined in: packages/observability/src/tracer/span.ts:39

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `value` | [`SpanAttributeValue`](/api/@graphorin/core/type-aliases/SpanAttributeValue.md) |
| `opts?` | [`SetAttributeOptions`](/api/@graphorin/observability/interfaces/SetAttributeOptions.md) |

#### Returns

`void`

***

### setAttributes()

```ts
setAttributes(attrs): void;
```

Defined in: packages/core/dist/contracts/tracer.d.ts:38

Add or replace attributes. Repeated calls are merged (last write wins).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `attrs` | [`SpanAttributes`](/api/@graphorin/core/type-aliases/SpanAttributes.md) |

#### Returns

`void`

#### Inherited from

[`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`setAttributes`](/api/@graphorin/core/interfaces/AISpan.md#setattributes)

***

### setStatus()

```ts
setStatus(status, message?): void;
```

Defined in: packages/core/dist/contracts/tracer.d.ts:44

Set the terminal status.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`SpanStatus`](/api/@graphorin/core/type-aliases/SpanStatus.md) |
| `message?` | `string` |

#### Returns

`void`

#### Inherited from

[`AISpan`](/api/@graphorin/core/interfaces/AISpan.md).[`setStatus`](/api/@graphorin/core/interfaces/AISpan.md#setstatus)
