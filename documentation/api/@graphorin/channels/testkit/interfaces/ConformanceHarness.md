[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [testkit](/api/@graphorin/channels/testkit/index.md) / ConformanceHarness

# Interface: ConformanceHarness

Defined in: packages/channels/src/testkit/conformance.ts:50

**`Stable`**

Hooks the suite uses to drive the adapter under test. `sendInbound`
must make the adapter produce ONE inbound message (for a real
vendor adapter: through the vendor fake; the loopback adapter's
`inject` satisfies it directly).

## Methods

### failNextDeliver()?

```ts
optional failNextDeliver(adapter): void;
```

Defined in: packages/channels/src/testkit/conformance.ts:64

Optional: make the NEXT `deliver` on `adapter` fail, so the
typed-error contract can be exercised. Omit if the adapter
cannot simulate failures; the corresponding test is skipped.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `adapter` | [`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md) |

#### Returns

`void`

***

### makeAdapter()

```ts
makeAdapter(): ChannelAdapter;
```

Defined in: packages/channels/src/testkit/conformance.ts:52

Fresh adapter instance per test.

#### Returns

[`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md)

***

### sendInbound()

```ts
sendInbound(adapter, text): Promise<InboundAcceptance>;
```

Defined in: packages/channels/src/testkit/conformance.ts:58

Cause `adapter` (already started) to emit one inbound message
with the given text; resolves with the acceptance the adapter
observed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `adapter` | [`ChannelAdapter`](/api/@graphorin/channels/interfaces/ChannelAdapter.md) |
| `text` | `string` |

#### Returns

`Promise`\&lt;[`InboundAcceptance`](/api/@graphorin/channels/interfaces/InboundAcceptance.md)\&gt;
