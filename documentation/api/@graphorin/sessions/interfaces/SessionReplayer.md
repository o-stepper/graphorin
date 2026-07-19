[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionReplayer

# Interface: SessionReplayer

Defined in: packages/sessions/src/replay/replayer.ts:62

**`Stable`**

Convenience surface returned by [createSessionReplayer](/api/@graphorin/sessions/functions/createSessionReplayer.md). The
replayer is async-iterable; the agent runtime drives it under
`for await`.

## Methods

### run()

```ts
run(options): AsyncIterable<SessionReplayEvent>;
```

Defined in: packages/sessions/src/replay/replayer.ts:74

Run the replay engine. The caller threads in:
 - `traceSource`: an iterable of `SpanRecord`s (from the
   observability trace log).
 - `target`: e.g. `'session:<id>'`.
 - `liveInvocation(record)`: a callback the engine invokes for
   every cassette `tool-call` record so the runtime can supply
   the live `args` + the `idempotencyKey` callback output. The
   callback returns the live invocation surface; when omitted,
   the engine treats the recorded args as the live args.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SessionReplayOptions`](/api/@graphorin/sessions/interfaces/SessionReplayOptions.md) & \{ `liveInvocation?`: (`record`) => `Promise`\&lt;\{ `args`: `unknown`; `idempotencyKey?`: `string`; `validateRecordedOutput?`: (`output`) =&gt; `string` \| `null`; \}\>; `target`: `string`; `traceSource?`: \| `AsyncIterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;, `any`, `any`\> \| `Iterable`\<[`SpanRecord`](/api/@graphorin/observability/interfaces/SpanRecord.md)\&lt;[`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md)\&gt;, `any`, `any`\>; \} |

#### Returns

`AsyncIterable`\&lt;[`SessionReplayEvent`](/api/@graphorin/sessions/type-aliases/SessionReplayEvent.md)\&gt;
