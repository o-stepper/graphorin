[**Graphorin API reference v0.15.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / VercelAdapterOptions

# Interface: VercelAdapterOptions

Defined in: packages/provider/src/adapters/vercel.ts:143

**`Stable`**

Options accepted by [vercelAdapter](/api/@graphorin/provider/adapters/vercel/functions/vercelAdapter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | `Partial`\&lt;[`ProviderCapabilities`](/api/@graphorin/core/interfaces/ProviderCapabilities.md)\&gt; | Capability declaration. The adapter merges these on top of a conservative defaults table (`streaming: true`, `toolCalling: true`, `multimodal: true`, …); supply explicit values to narrow them. | packages/provider/src/adapters/vercel.ts:154 |
| <a id="property-name"></a> `name?` | `readonly` | `string` | Fully-qualified provider name, used for span / log labelling. Defaults to `${model.provider}-${model.modelId}`. | packages/provider/src/adapters/vercel.ts:148 |
| <a id="property-runtimeoverrides"></a> `runtimeOverrides?` | `readonly` | [`VercelRuntimeOverrides`](/api/@graphorin/provider/adapters/vercel/interfaces/VercelRuntimeOverrides.md) | Runtime override for the AI SDK functions. When unset, the adapter lazily `await import('ai')` on first call. Test suites pass a fixture-driven implementation directly. | packages/provider/src/adapters/vercel.ts:160 |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Opt-in deadline in milliseconds. Streaming: bounds the time to the FIRST chunk (the timer is cleared once the stream produces); `generate`: bounds the whole call - the SDK owns the transport, so headers are not observable and time-to-response scoping is impossible. On expiry the adapter throws `ProviderHttpError{ status: 0 }` (`errorKind: 'transient'`, message `request timed out ...`), the same shape the `baseUrl` adapters throw, so `withRetry` / `withFallback` treat a hung SDK call exactly like a hung HTTP server. A caller abort via `req.signal` still surfaces as `finishReason: 'aborted'`, never as a timeout. Unset or `0` = no adapter-level deadline (unlike the HTTP adapters there is no default: a whole-call deadline would break long `generate` calls if it defaulted on). | packages/provider/src/adapters/vercel.ts:176 |
