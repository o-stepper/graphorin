[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / applyInboundSanitizationWithClassifier

# Function: applyInboundSanitizationWithClassifier()

```ts
function applyInboundSanitizationWithClassifier(opts): Promise<SanitizationOutcome>;
```

Defined in: packages/tools/src/inbound/sanitize.ts:251

**`Stable`**

Async variant of [applyInboundSanitization](/api/@graphorin/tools/functions/applyInboundSanitization.md) that additionally
consults an optional [InjectionClassifier](/api/@graphorin/tools/interfaces/InjectionClassifier.md) (default
off). Identical to the sync pass when no classifier is supplied.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`InboundSanitizationWithClassifierOptions`](/api/@graphorin/tools/interfaces/InboundSanitizationWithClassifierOptions.md) |

## Returns

`Promise`\&lt;[`SanitizationOutcome`](/api/@graphorin/tools/interfaces/SanitizationOutcome.md)\&gt;
