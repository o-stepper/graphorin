---
'@graphorin/tools': minor
---

W-117: honest streaming backpressure semantics + a bounded aggregation buffer. The README no longer claims a drop-oldest queue: sink delivery is synchronous, the `streamingEventQueueDepth` guard only trips on sink re-entrancy and drops the CURRENT (newest) event. New `maxBufferBytes` on `StreamingChannelOptions` (threaded from `ExecutorOptions.streamingMaxBufferBytes`, default 8 MiB, exported as `DEFAULT_MAX_BUFFER_BYTES`): past the cap, chunks keep delivering to subscribers but stop accumulating in the buffer-becomes-output `chunks`, dropped bytes are counted (`tool.streaming.buffer.dropped-bytes.total`) and the additive `StreamingAggregator.bufferTruncated` flag marks the assembled body incomplete for the envelope / spill path. A runaway streaming tool can no longer grow host memory without bound; sub-cap behaviour is byte-identical (lossless buffer).
