[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / BrowserOpener

# Type Alias: BrowserOpener

```ts
type BrowserOpener = (url, signal?) => Promise<void>;
```

Defined in: packages/security/src/oauth/browser.ts:24

**`Experimental`**

Strategy hook used by tests so the unit suite never opens a real
browser.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |
| `signal?` | `AbortSignal` |

## Returns

`Promise`\&lt;`void`\&gt;
