---
'@graphorin/tools': minor
'@graphorin/server': minor
'@graphorin/sessions': minor
---

Single-source outbound commentary catalogue (bot-adoption wave B, B2). The byte-identical 7-pattern catalogue plus the envelope helpers (`freshRegex`, `splitByWrapEnvelope`, `sha256Hex`, the wrap delimiters) move to the new `@graphorin/tools/outbound` subpath; the server delivery-layer and session-output sanitizers stay boundary-specific wrappers whose `@stable` consts (`DEFAULT_DELIVERY_COMMENTARY_PATTERNS`, `BUILT_IN_COMMENTARY_PATTERNS`) now re-export the same array reference - pinned by an identity assertion in the cross-package test, so the catalogue can never drift between layers again. `@graphorin/sessions` gains an acyclic dependency on `@graphorin/tools`. The channel gateway consumes the same catalogue as its third boundary (channel default policy `'strip'`, dropping wrapped fragments entirely - messenger peers have no envelope-collapsing UI).
