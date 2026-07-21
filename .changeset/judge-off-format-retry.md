---
'@graphorin/evals': patch
---

`llmJudge` retries a missing `SCORE: <n>` marker once with a constrained reprompt (thirteenth deep retest, P3). Reasoning-model judges can burn a tight `maxOutputTokens` on hidden reasoning and return an empty visible reply - observed live with a Luna judge on the HaluMem QA smoke. The retry re-sends the conversation with an explicit marker-only instruction and a raised output budget (`max(32, 2 x maxOutputTokens)`); `offFormatRetries: 0` restores single-shot fail-loud. When retries are exhausted the scorer now throws the typed `JudgeOffFormatError` carrying the stable `judge-off-format:` marker, so benchmark reports can classify "the judge failed to grade" separately from "the subject answered badly" - the HaluMem runner prints those cases as `status=JUDGE_FAILED` (still a non-zero exit) and stamps `benchConfig.judgeOffFormatCases`.
