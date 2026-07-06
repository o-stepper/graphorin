---
'@graphorin/eslint-plugin': minor
'@graphorin/cli': patch
---

Tool discovery and grading are comment-aware (W-044). Discovery and every grading path run over a comment-blanked view of the source (newlines preserved, offsets stable; string/template and - conservatively - regex literals untouched): a commented-out `tool({...})` no longer appears in `graphorin tools lint` reports or the three ESLint tool rules, a commented-out property inside a live literal is never extracted, a commented email inside a live `examples:` block no longer penalizes the axis, and a `tool(` inside a string never matches. `DiscoveredTool` gains `gradingSource` (the blanked slice all graders consume) while `source` keeps the original text for reports. The description axis gets a deterministic anti-degenerate guard: 80+ chars of repeated filler (under 4 unique words, or one word over half the text) caps at 16 instead of scoring 40 - RB-49 calibration fixtures are unchanged; degenerate descriptions may now fall below `--threshold` gates. The false-positive contract (any callee lexically ending in `tool(`, renamed/wrapped calls invisible) is now documented in the module header and README.
