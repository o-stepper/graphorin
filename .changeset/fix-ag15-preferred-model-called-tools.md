---
'@graphorin/agent': patch
---

fix(agent): preferred-model resolves from CALLED tools, not the advertised catalogue (AG-15)

The per-tool preferred-model ladder consulted the hints of every tool
ADVERTISED on the step — built before the provider call — so one
smart-hinted but never-invoked tool pinned the entire conversation to the
top cost tier (the module docstring already promised "AFTER the model has
decided which tool(s) to call"). The ladder now consults only the tools the
model actually called on the previous step; steps without prior calls fall
through to the agent-preferred default. Direct cost amplification removed;
docstring and implementation agree.
