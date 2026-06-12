---
'@graphorin/memory': patch
---

fix(memory): escape model-writable tags in prompt renderers (CE-8)

Three context-engine renderers interpolated fact/rule `tags` raw into the
`tags="…"` XML attribute while escaping id/text right next to them:
`renderAutoRecalledFacts` (engine.ts), `reanchorPinnedFacts`, and
`reanchorProjectRules`. Tags are model-writable via `fact_remember` /
rule definitions, so a tag containing `"` or `>` could break out of the
attribute and forge prompt structure inside a system-role message
(memory-poisoning → system-prompt structure injection). The tag join now
passes through the same XML-attribute escaping as the neighbouring
fields in all three renderers.
