---
'@graphorin/memory': patch
---

fix(memory): emit context layers in a KV-cache-stable order, separate from truncation priority (CE-9)

`assemble` emitted the system-prompt layers in the same order the budget
allocator returns them — i.e. **truncation priority** — which places the
volatile `memoryMetadata` block (its "Indexed messages: N" / "Facts: N" counts
change every turn) second, right after identity and *before* the rules, working
blocks, and skills. Any change to the message or fact count therefore
invalidated the provider's — and a local llama.cpp / vLLM server's — KV-cache
prefix for the stable layers, defeating the documented cache breakpoint.

Emission order is now separate from truncation priority: the allocator still
trims by `DEFAULT_LAYER_PRIORITY`, but layers are emitted in a fixed stability
order — identity → rules → blocks → skills → [cache breakpoint] → metadata →
auto-recall — so the Layer 1-4 prefix stays byte-identical across turns while
only the volatile tail moves. Adds a prefix-stability test (assert the Layer 1-4
prefix is byte-identical across two turns that change only the counts), fixes
the stale `annotationForLayer` identity comment, and aligns the `token-budget`
doc (the priority ladder governs truncation, not render order).
