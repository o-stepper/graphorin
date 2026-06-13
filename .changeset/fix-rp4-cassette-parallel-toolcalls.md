---
'@graphorin/sessions': patch
---

fix(sessions): cassette cursor accepts parallel tool-calls in one step (RP-4)

The cassette reader required strictly lexicographically-increasing `toolCallId`s
within a step, but the recorder writes them in arrival order and provider ids
(`toolu_…`, `call_…`) carry no lexicographic guarantee — so a cassette with two
legitimate parallel tool-calls in one step was rejected by its own reader.

The cursor now rejects only a step-number regression or an exact duplicate
(same `stepNumber` **and** `toolCallId`, tracked per step), allowing
any-order parallel tool-calls within a step.

Red-first: a test reads two parallel tool-calls with "decreasing" ids in one
step, and a second asserts an exact duplicate id in the same step is still
rejected.
