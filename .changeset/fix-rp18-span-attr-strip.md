---
'@graphorin/observability': minor
---

fix(observability): attribute-granular redaction so spans no longer vanish (RP-18)

The mandatory exporter validation wrapper dropped the **entire span record**
the moment a single attribute exceeded the sensitivity floor. Untagged
attributes default to the `internal` tier and the default floor is `public`,
so every framework span that set attributes without explicit sensitivity tags
(all `memory.*`, `gen_ai.*` defaults, …) silently disappeared from every
exporter — operators following the docs got **empty traces**.

`sanitizeAttributes` / `sanitizeRecord` now **strip the offending attribute**
(the validator already counts each drop) and always return an exportable
record. The span survives with its safe attributes; secret / over-tier values
are removed, not leaked. `Session.replay` replays the stripped span instead of
skipping it.

Red-first tests at both the exporter boundary (a span with an untagged
attribute reaches the console exporter with that attribute stripped) and
end-to-end through `createTracer` → `withValidation` → exporter. The
`observability.md` redaction diagram is updated to show attribute-granular
stripping. (Making framework attributes *survive* via tagging + per-exporter
floor defaults is RP-19.)
