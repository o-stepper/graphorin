---
"@graphorin/memory": patch
---

fix(memory): BUFFER-N-01 warn at construction for an invalid consolidator trigger spec

`registerConsolidatorTriggers` throws on a malformed spec, but a buffer-only
library deployment never calls it - so `createMemory({ triggers: ['buffer:0'] })`
accepted the spec silently and left the buffer memory-formation loop inert
(`notifyActivity` always returned null). The consolidator now emits a one-shot
stderr WARN for every unparseable trigger spec at construction, naming the spec
and stating the loop it was meant to arm will never fire.
