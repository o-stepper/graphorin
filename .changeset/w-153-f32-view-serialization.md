---
'@graphorin/store-sqlite': patch
---

Embedding vectors that are `Float32Array` VIEWS into a larger buffer (the standard subarray idiom of batched embedders) now serialize correctly on all four write/search paths of facts and episodes (W-153): the raw `Buffer.from(vec.buffer)` calls ignored `byteOffset`/`byteLength` and serialized the whole underlying buffer, passing the `vector.length` dim check and surfacing later as an opaque vec0 dimension error. All sites now use the existing `f32ToBlob` helper (already used for entity embeddings). Shipped embedders `.slice()` before storing, so their behaviour is byte-identical.
