[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / SessionScope

# Interface: SessionScope

Defined in: packages/core/src/types/session-scope.ts:11

**`Stable`**

Identifies a logical conversational scope: who the user is, which agent
is in charge, and (when known) which session they're inside.

Used as a parameter to almost every Memory / Sessions API. The agent and
session fields are optional because some scopes are user-wide (e.g.
shared facts attached to a user, not a particular agent).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agentid"></a> `agentId?` | `readonly` | `string` | Identifier of the agent owning the scope, when applicable. | packages/core/src/types/session-scope.ts:15 |
| <a id="property-sessionid"></a> `sessionId?` | `readonly` | `string` | Identifier of the session, when applicable. | packages/core/src/types/session-scope.ts:17 |
| <a id="property-userid"></a> `userId` | `readonly` | `string` | Stable identifier of the user (single-user-per-process by default). | packages/core/src/types/session-scope.ts:13 |
