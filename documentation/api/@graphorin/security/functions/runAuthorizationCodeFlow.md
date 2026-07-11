[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / runAuthorizationCodeFlow

# Function: runAuthorizationCodeFlow()

```ts
function runAuthorizationCodeFlow(args): Promise<OAuthSession>;
```

Defined in: [packages/security/src/oauth/authorize-code-flow.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/authorize-code-flow.ts#L50)

Drive the Authorization Code + PKCE flow. The function is exposed
for tests and for higher-level orchestration in `client.ts`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | [`AuthorizationCodeFlowArgs`](/api/@graphorin/security/interfaces/AuthorizationCodeFlowArgs.md) |

## Returns

`Promise`\&lt;[`OAuthSession`](/api/@graphorin/security/interfaces/OAuthSession.md)\&gt;

## Stable
