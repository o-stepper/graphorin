---
'@graphorin/sessions': patch
---

fix(sessions): honour onMissingArtifact in replay (RP-3)

The `onMissingArtifact` replay option was `@stable` and plumbed through the
facade, but the replayer never read it: `contentPartsRefs` were never stat'd,
and `CassetteArtifactMissingError` / the `artifact-missing` decision were
constructed nowhere — so a cassette whose referenced artifacts had been moved or
deleted still "replayed" successfully. The recorder even swallowed artifact-copy
failures with a comment promising a replay-time check that did not exist.

The replayer now stats each `contentPartsRefs` path (for records whose parts are
referenced, not inlined) before substituting the recorded output. A missing
artifact is honoured per `onMissingArtifact`: `'abort'` (the default) throws
`CassetteArtifactMissingError`; `'fallback-live'` yields a
`tool.cassette.replay.artifact-missing` decision (and no substitution) so the
caller re-runs the tool live.

Red-first: a cassette record references a non-existent artifact — the default
replay aborts with the typed error, and `fallback-live` surfaces the
artifact-missing decision instead of a substitution.
