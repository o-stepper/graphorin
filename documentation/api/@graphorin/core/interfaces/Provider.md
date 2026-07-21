[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / Provider

# Interface: Provider

Defined in: packages/core/src/contracts/provider.ts:18

**`Stable`**

Vendor-neutral LLM provider interface. Concrete adapters live in
`@graphorin/provider` (and companion packages such as
`@graphorin/provider-llamacpp-node`).

Every provider exposes a `name` (used in spans / logs), the `modelId`
it wraps, a static `capabilities` descriptor, and the two streaming /
one-shot generation methods.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acceptssensitivity"></a> `acceptsSensitivity?` | `readonly` | readonly [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md)[] | Sensitivity tiers this provider is allowed to receive. Used by the ContextEngine sensitivity filter and the outbound redaction middleware to decide what content is safe to forward. | packages/core/src/contracts/provider.ts:37 |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | [`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md) | - | packages/core/src/contracts/provider.ts:21 |
| <a id="property-modelid"></a> `modelId` | `readonly` | `string` | - | packages/core/src/contracts/provider.ts:20 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/core/src/contracts/provider.ts:19 |

## Methods

### countTokens()?

```ts
optional countTokens(req): Promise<number>;
```

Defined in: packages/core/src/contracts/provider.ts:30

Optional: provider-native input token counter.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | [`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md) |

#### Returns

`Promise`\&lt;`number`\&gt;

***

### generate()

```ts
generate(req): Promise<ProviderResponse>;
```

Defined in: packages/core/src/contracts/provider.ts:27

Convenience wrapper that consumes the stream into a single result.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | [`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md) |

#### Returns

`Promise`\&lt;[`ProviderResponse`](/api/@graphorin/core/interfaces/ProviderResponse.md)\&gt;

***

### stream()

```ts
stream(req): AsyncIterable<ProviderEvent>;
```

Defined in: packages/core/src/contracts/provider.ts:24

Returns an async stream of fine-grained provider events.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `req` | [`ProviderRequest`](/api/@graphorin/core/interfaces/ProviderRequest.md) |

#### Returns

`AsyncIterable`\&lt;[`ProviderEvent`](/api/@graphorin/core/type-aliases/ProviderEvent.md)\&gt;
