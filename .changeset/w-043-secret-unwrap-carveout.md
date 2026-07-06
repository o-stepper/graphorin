---
"@graphorin/eslint-plugin": patch
---

`no-secret-unwrap` gains an opt-in `allowReceiverPattern` option for the documented collision with Zod's `.unwrap()` (ZodOptional/ZodNullable/ZodDefault) and Rust-style result libraries: when the source text of the receiver expression matches the pattern, both `unwrap` and `reveal` reports are skipped, so `['error', { allowReceiverPattern: 'Schema$' }]` lets schema-introspection code lint clean while `secret.unwrap()` keeps erroring. Default behaviour is byte-identical (no pattern, sharp deprecation cliff), and there is deliberately no built-in "looks like Zod" heuristic - an explicit narrow pattern or a file-glob override beats a nondeterministic guess. README documents both recipes.
