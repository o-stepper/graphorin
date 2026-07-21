---
'@graphorin/provider': patch
---

Single-flight cold parameter recovery for OpenAI-shaped adapters (thirteenth deep retest, P1). While one call (the leader) climbs the HTTP-400 recovery ladder (`max_tokens` remap, `temperature` strip, tools `reasoning_effort`), concurrent siblings that hit their own recoverable 400 now wait for the leader and retry once from the fully learned state instead of climbing every remaining rung themselves: a cold five-way batch (the LLM-reranker shape) drops from 15 HTTP calls to 11, and only the leader ever sends doomed intermediate parameter shapes - less 400 noise and less rate-limit pressure during the learning window. The 0.13.11 correctness guarantee is unchanged: each call keeps its own per-call attempt ledger, so a waiter still recovers independently when the leader dies mid-ladder (429, network error), proven by a dedicated test alongside new tri-recovery interleaving coverage.
