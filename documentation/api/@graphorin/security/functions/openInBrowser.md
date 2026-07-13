[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / openInBrowser

# Function: openInBrowser()

```ts
function openInBrowser(url, signal?): Promise<void>;
```

Defined in: [packages/security/src/oauth/browser.ts:47](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/browser.ts#L47)

Default cross-platform launcher. Falls back to printing the URL on
platforms where `spawn` returns a non-zero exit code so headless
deployments still surface the URL to the operator.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;`void`\&gt;

## Stable
