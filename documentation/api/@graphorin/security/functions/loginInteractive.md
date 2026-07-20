[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / loginInteractive

# Function: loginInteractive()

```ts
function loginInteractive(options): Promise<LoginInteractiveResult>;
```

Defined in: packages/security/src/oauth/library.ts:67

**`Stable`**

Drive an interactive login flow against the supplied server. The
function chooses Authorization Code by default and falls back to
the Device Authorization Grant when `deviceFlow: true`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`LoginInteractiveOptions`](/api/@graphorin/security/interfaces/LoginInteractiveOptions.md) |

## Returns

`Promise`\&lt;[`LoginInteractiveResult`](/api/@graphorin/security/interfaces/LoginInteractiveResult.md)\&gt;
