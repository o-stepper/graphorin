[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / decideToolReplay

# Function: decideToolReplay()

```ts
function decideToolReplay(
   recorded, 
   live, 
   policy): CassetteReplayDecision;
```

Defined in: packages/sessions/src/cassette/replay.ts:126

Pure-function decision engine. Takes a single cassette record + the
live invocation and returns either a `'substituted'` /
`'idempotency-mismatch'` / `'live'` decision per the policy matrix.

The engine never side-effects; the runtime acts on the returned
decision.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `recorded` | [`ToolCallRecord`](/api/@graphorin/sessions/interfaces/ToolCallRecord.md) |
| `live` | [`CassetteLiveInvocation`](/api/@graphorin/sessions/interfaces/CassetteLiveInvocation.md) |
| `policy` | [`CassetteReplayPolicyOptions`](/api/@graphorin/sessions/interfaces/CassetteReplayPolicyOptions.md) |

## Returns

[`CassetteReplayDecision`](/api/@graphorin/sessions/type-aliases/CassetteReplayDecision.md)

## Stable
