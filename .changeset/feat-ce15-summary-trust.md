---
'@graphorin/memory': minor
---

feat(memory): compaction summary trust — no injection laundering (CE-15)

The compaction summary was committed as a bare trusted `system` message even
when the summarized window contained `<<<untrusted_content>>>`-wrapped tool
results — a classic injection-laundering path (untrusted text re-entering the
buffer as authoritative summary prose), backstopped only by summarizer prompt
wording.

The compactor now closes this structurally:

- window detection: any untrusted envelope in the compacted window makes the
  LLM-authored summary body commit inside a
  `<<<untrusted_content trust="derived" tool="compaction-summarizer">>>`
  envelope;
- output scan: the summarizer output itself is run through the offline
  injection heuristics (`@graphorin/observability/redaction`), and a hit
  degrades the summary to the derived envelope independently of the window;
- break-out prevention: envelope marker sequences inside the body are
  neutralized before wrapping;
- sticky: a derived summary re-triggers detection when it is itself compacted
  later, so taint never washes out (consistent with the WI-12 data-flow
  policy's no-laundering rule).

`CompactionResult` gains optional `summaryTrust: 'trusted' | 'untrusted-derived'`.
Clean-window, clean-summary compactions are byte-identical to before. The
summary-9-section docblock no longer declares the summary unconditionally
trusted; new `security.md` § "Compaction summary trust" + agent-runtime.md
note.
