[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setBrowserOpenerForTesting

# Function: \_setBrowserOpenerForTesting()

```ts
function _setBrowserOpenerForTesting(opener): 
  | BrowserOpener
  | null;
```

Defined in: packages/security/src/oauth/browser.ts:34

**`Experimental`**

Override the active browser opener. Returns the previous opener so
tests can restore the default at the end of a fixture.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opener` | \| [`BrowserOpener`](/api/@graphorin/security/type-aliases/BrowserOpener.md) \| `null` |

## Returns

  \| [`BrowserOpener`](/api/@graphorin/security/type-aliases/BrowserOpener.md)
  \| `null`
