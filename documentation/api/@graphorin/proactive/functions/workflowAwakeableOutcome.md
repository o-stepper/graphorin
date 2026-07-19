[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/proactive](/api/@graphorin/proactive/index.md) / [](/api/@graphorin/proactive/README.md) / workflowAwakeableOutcome

# Function: workflowAwakeableOutcome()

```ts
function workflowAwakeableOutcome(args): 
  | ProactiveQuestionOutcome
  | ProactiveReviewOutcome;
```

Defined in: packages/proactive/src/ladder.ts:88

**`Stable`**

Build a `question` / `review` outcome for a task parked inside a
durable WORKFLOW (`awaitExternal` / `requestApproval`): the resolve
ref is the serialized awakeable address (`wf:&lt;workflowId&gt;:&lt;threadId&gt;:
&lt;name&gt;`, decision D-1/A3), resolved through the existing
`POST /v1/workflows/:id/resume` route and ticked by the workflow
timer-daemon - this package composes with that daemon, it never
re-hosts it (D-9).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `firedAt?`: `string`; `kind`: `"question"` \| `"review"`; `name`: `string`; `options?`: readonly [`ProactiveOutcomeOption`](/api/@graphorin/core/interfaces/ProactiveOutcomeOption.md)[]; `sessionId?`: `string`; `taskId`: `string`; `text`: `string`; `threadId`: `string`; `workflowId`: `string`; \} |
| `args.firedAt?` | `string` |
| `args.kind` | `"question"` \| `"review"` |
| `args.name` | `string` |
| `args.options?` | readonly [`ProactiveOutcomeOption`](/api/@graphorin/core/interfaces/ProactiveOutcomeOption.md)[] |
| `args.sessionId?` | `string` |
| `args.taskId` | `string` |
| `args.text` | `string` |
| `args.threadId` | `string` |
| `args.workflowId` | `string` |

## Returns

  \| [`ProactiveQuestionOutcome`](/api/@graphorin/core/interfaces/ProactiveQuestionOutcome.md)
  \| [`ProactiveReviewOutcome`](/api/@graphorin/core/interfaces/ProactiveReviewOutcome.md)
