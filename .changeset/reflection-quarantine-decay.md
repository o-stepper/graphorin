---
'@graphorin/memory': minor
---

W-082: quarantined insights are exempt from reflection pass-decay. Default retrieval excludes quarantined rows, so the +1 retrieval reinforcement could never fire for them - every paid synthesis was soft-deleted after two reflection passes unless a human reviewed it in time. The use-it-or-lose-it (ExpeL) economics now apply to VALIDATED insights only; a quarantined insight's decay clock starts at validation. The unreviewed queue is bounded by the new `reflectionMaxQuarantinedInsights` config (default 100, threaded through `createMemory({ consolidator })`): beyond the cap the OLDEST quarantined insights are pruned.
