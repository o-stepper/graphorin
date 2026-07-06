---
'@graphorin/server': patch
---

The server's sibling peer floors (`@graphorin/agent`/`memory`/`sessions`/`workflow`) now track the current minor (W-135): the static `workspace:>=0.5.0 <1.0.0` range let npm silently assemble a mixed install (agent@0.5.0 under server@0.6.x). The floor is rewritten to the just-computed minor by `bump-version --sync` AFTER `changeset version` (a statically narrow range would re-trigger the changesets fixed-group escalation to a phantom 1.0.0), and `check-version-consistency` fails any release pass that skips the rewrite.
