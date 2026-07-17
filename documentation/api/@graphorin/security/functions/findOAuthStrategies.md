[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / findOAuthStrategies

# Function: findOAuthStrategies()

```ts
function findOAuthStrategies(args): readonly OAuthStrategy[];
```

Defined in: [packages/security/src/oauth/strategies.ts:35](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/strategies.ts#L35)

Find every strategy that matches the given server descriptor. The
matching is `OR` - either the URL or the ID regex matching is
enough to enrol the strategy.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `serverId`: `string`; `serverUrl`: `string`; \} |
| `args.serverId` | `string` |
| `args.serverUrl` | `string` |

## Returns

readonly [`OAuthStrategy`](/api/@graphorin/security/interfaces/OAuthStrategy.md)[]

## Stable
