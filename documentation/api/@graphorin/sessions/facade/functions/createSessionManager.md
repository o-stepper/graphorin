[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [facade](/api/@graphorin/sessions/facade/index.md) / createSessionManager

# Function: createSessionManager()

```ts
function createSessionManager(opts): SessionManager;
```

Defined in: packages/sessions/src/facade.ts:348

Build a session manager. The manager is the public entry point;
sessions are obtained via `manager.create(...)` / `manager.get(...)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`CreateSessionManagerOptions`](/api/@graphorin/sessions/facade/interfaces/CreateSessionManagerOptions.md) |

## Returns

[`SessionManager`](/api/@graphorin/sessions/facade/interfaces/SessionManager.md)

## Stable
