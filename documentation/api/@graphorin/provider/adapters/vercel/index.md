[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / adapters/vercel

# adapters/vercel

`vercelAdapter` - wraps a Vercel AI SDK `LanguageModel`-shaped value
into a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md). The adapter is the default cloud
path: it speaks the AI SDK's `streamText` / `generateText` API and
maps the resulting events onto the canonical
import('@graphorin/core').ProviderEvent discriminated union.

Outbound, the adapter converts Graphorin messages / tools onto the
AI SDK call contract (see `vercel-messages.ts`): tool definitions
become a name-keyed record with `jsonSchema()`-shaped input schemas,
assistant `toolCalls` become `tool-call` content parts, and
`ToolMessage`s become `tool-result` messages - the SDK zod-validates
all of these and rejects the raw Graphorin shapes.

The AI SDK is an **optional peer dependency** of `@graphorin/provider`.
Production callers leave `runtimeOverrides` unset and the adapter
dynamically imports the package on first use; test fixtures pass a
`runtimeOverrides` value to short-circuit the import and feed
fixture chunks directly. The overrides shape is intentionally
structural so users can supply hand-rolled stubs or any compatible
library.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AISDKChunk](/api/@graphorin/provider/adapters/vercel/interfaces/AISDKChunk.md) | Loose chunk shape emitted by the AI SDK's `streamText`. The shape is intentionally permissive - we accept anything that carries the fields we use and ignore the rest. This keeps the adapter tolerant of additive AI SDK schema changes. |
| [LanguageModelLike](/api/@graphorin/provider/adapters/vercel/interfaces/LanguageModelLike.md) | Structural shape the adapter expects from the AI SDK language model value. The real `LanguageModelV4` matches this shape. Re-declared here so we do not pin a hard dependency on `@ai-sdk/provider`. |
| [VercelAdapterOptions](/api/@graphorin/provider/adapters/vercel/interfaces/VercelAdapterOptions.md) | Options accepted by [vercelAdapter](/api/@graphorin/provider/adapters/vercel/functions/vercelAdapter.md). |
| [VercelRuntimeOverrides](/api/@graphorin/provider/adapters/vercel/interfaces/VercelRuntimeOverrides.md) | Subset of the AI SDK surface used by the adapter. |

## Functions

| Function | Description |
| ------ | ------ |
| [\_\_resetVercelRuntimeCache](/api/@graphorin/provider/adapters/vercel/functions/resetVercelRuntimeCache.md) | Test-only hook that resets the cached AI SDK runtime. Provider tests that mutate the cache (e.g. by injecting a mock then verifying the default loader runs) call this between scenarios. |
| [vercelAdapter](/api/@graphorin/provider/adapters/vercel/functions/vercelAdapter.md) | Wrap a Vercel AI SDK language-model value in a Graphorin [Provider](/api/@graphorin/core/interfaces/Provider.md). Outbound requests are converted onto the AI SDK call contract (name-keyed tools, `tool-call` / `tool-result` content parts - see `vercel-messages.ts`); the streaming chunks emitted by the AI SDK are translated back onto Graphorin `ProviderEvent`s. |
