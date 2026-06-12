---
'@graphorin/agent': patch
---

fix(agent): causality monitor 'detect-and-block' actually blocks; chain resets per run (AG-10)

The lateral-leak scan ran AFTER the assistant message was appended, so a
'block' decision only emitted an event while the laundered commentary still
landed in the durable history (and every subsequent provider request), and
the run's final output. The scan now runs before the append: on 'block' the
assistant content is replaced with a fixed withhold notice (worded to never
re-trigger the monitor), `text.complete` is suppressed, and the final output
is not set from the blocked text. Tool calls on the same step still execute.

The monitor's denial chain is also reset at every run boundary — previously
the per-agent singleton accumulated chain entries across runs, so a denial
recorded in one run could false-positive an unrelated later run.
