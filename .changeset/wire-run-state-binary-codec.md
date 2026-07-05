---
'@graphorin/core': minor
'@graphorin/agent': minor
---

W-004: JSON-safe binary codec for message content and a `WireRunState` projection; run-state schema 1.2.

`@graphorin/core` gains `EncodedBytes`/`EncodedUrl` envelopes, `WireMessage`/`WireMessageContent`/`WireRunState` wire twins and pure `toJsonSafeMessage`/`fromJsonSafeMessage`, `toJsonSafeContentParts`/`fromJsonSafeContentParts`, `toJsonSafeRunState`/`fromJsonSafeRunState` codecs (plus `bytesToBase64`/`base64ToBytes`, Buffer-free). `serializeRunState` in `@graphorin/agent` now projects binary payloads (`Uint8Array | URL` in `messages` and tool-outcome `contentParts`) through the codec before its detach stringify, so a run with an image checkpointed at `awaiting_approval` and resumed no longer hands the provider corrupted bytes. `RUN_STATE_SCHEMA_VERSION` is now `graphorin-run-state/1.2`; 1.0/1.1 payloads remain readable and their stringify-corrupted numeric-key byte objects are repaired best-effort on rehydration. `SerializedRunState.messages`/`.steps` are now typed as `WireMessage[]`/`WireRunStep[]` - the on-disk truth.
