[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / RecoveryHint

# Type Alias: RecoveryHint

```ts
type RecoveryHint = "retry_later" | "check_input" | "try_alternative" | "report_to_user";
```

Defined in: [packages/core/src/types/tool.ts:255](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/types/tool.ts#L255)

Model-facing recovery guidance attached to a [ToolError](/api/@graphorin/core/interfaces/ToolError.md) (C3).
Practitioner evidence converges on these two fields being what changes
model behaviour after a failure:

- `'retry_later'`      - transient; the same call is expected to work
                         after a pause (rate limits, timeouts).
- `'check_input'`      - the arguments are wrong; re-read the schema
                         and fix them before retrying.
- `'try_alternative'`  - this tool/approach failed non-transiently;
                         try a different tool or strategy.
- `'report_to_user'`   - a policy/authorization stop; do not retry,
                         surface the situation instead.

## Stable
