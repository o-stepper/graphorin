---
'@graphorin/memory': patch
---

W-085: the fusion-slice widening condition now includes `trustWeighting` (on by default) and `includeQuarantined`. The reranker previously cut to `finalTopK` BEFORE the C5 trust discount ran, so the discount could only reorder WITHIN the page - a down-weighted foreign-provenance/quarantined hit was never displaced past the boundary and a first-party candidate at fused rank topK+1 could never enter. Page membership of default searches changes only in the presence of foreign-provenance facts (that is the fix); purely first-party result sets stay byte-identical (discount factor 1 everywhere), pinned by a regression test.
