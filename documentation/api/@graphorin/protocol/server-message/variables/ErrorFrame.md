[**Graphorin API reference v0.15.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/protocol](/api/@graphorin/protocol/index.md) / [server-message](/api/@graphorin/protocol/server-message/index.md) / ErrorFrame

# Variable: ErrorFrame

```ts
const ErrorFrame: ZodObject<{
  code: ZodString;
  data: ZodOptional<ZodUnknown>;
  fatal: ZodOptional<ZodBoolean>;
  kind: ZodLiteral<"error">;
  message: ZodString;
  subscriptionId: ZodOptional<ZodString>;
  v: ZodLiteral<"1">;
}, "strict", ZodTypeAny, {
  code: string;
  data?: unknown;
  fatal?: boolean;
  kind: "error";
  message: string;
  subscriptionId?: string;
  v: "1";
}, {
  code: string;
  data?: unknown;
  fatal?: boolean;
  kind: "error";
  message: string;
  subscriptionId?: string;
  v: "1";
}>;
```

Defined in: src/server-message.ts:157

**`Stable`**

Zod schema behind [ServerErrorFrame](/api/@graphorin/protocol/server-message/type-aliases/ServerErrorFrame.md).
