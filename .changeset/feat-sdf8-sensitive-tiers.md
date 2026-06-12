---
'@graphorin/security': minor
'@graphorin/agent': patch
---

feat(security): widenable lethal-trifecta sensitive leg (SDF-8)

`deriveTaintLabel` marked content sensitive only when `sensitivity === 'secret'`,
and tools default to `'internal'` — so out of the box the lethal-trifecta
leg never armed without an explicit `sensitivity: 'secret'` tag, leaving
PII / ordinary user content invisible to the conservative gate.

- `deriveTaintLabel` and `DataFlowPolicyConfig` gain `sensitiveTiers`
  (default `['secret']`, byte-identical). Set `['secret', 'internal']` to
  also treat internal-tier (user/PII) content as sensitive.
- The agent's data-flow guard threads `config.sensitiveTiers` into
  `deriveTaintLabel`, so `createAgent({ dataFlowPolicy: { sensitiveTiers } })`
  is live. The verbatim `untrusted-to-sink` leg is unaffected.
