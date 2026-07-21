[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / assertNever

# Function: assertNever()

```ts
function assertNever(value, message?): never;
```

Defined in: packages/core/src/utils/assert-never.ts:22

**`Stable`**

Exhaustiveness helper. Place at the end of a `switch (...)` over a
discriminated union: TypeScript narrows the operand to `never` if
every variant is handled. Adding a new variant later turns the call
site into a compile error - the regression net for our event unions.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `never` |
| `message?` | `string` |

## Returns

`never`

## Example

```ts
function describe(event: AgentEvent): string {
  switch (event.type) {
    case 'agent.start': return 'started';
    case 'agent.end':   return 'ended';
    // ... every other variant ...
    default:
      return assertNever(event, 'Unhandled AgentEvent variant');
  }
}
```
