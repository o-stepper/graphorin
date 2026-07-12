# Harness CLI manual (loaded on demand)

This file demonstrates the "CLI tool with a README on demand" skill
pattern: the tool card that reaches the model stays one line, while the
full manual rides as a skill RESOURCE. `Skill.resources()` returns lazy
accessors - listing this file reads zero bytes; the content loads only
when a caller invokes `readText()`, typically from a tool the model
calls when it actually needs the details.

## Commands

- `note_lookup --topic tool-search` - how deferred tools are discovered
  mid-run through `tool_search` promotion.
- `note_lookup --topic read-result` - how spilled results are paged back
  on demand with byte or line ranges.
- `note_lookup --topic spill` - why large results leave the conversation
  buffer and live under a run-scoped artifact root.

## Why on demand

A minimal-scaffold agent keeps its per-step catalogue tiny. Stuffing the
manual into the system prompt or the tool description defeats that;
loading it lazily keeps the cost at zero until the run genuinely needs
the reference.
