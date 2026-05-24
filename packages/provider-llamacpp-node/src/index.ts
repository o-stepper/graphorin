/**
 * @graphorin/provider-llamacpp-node — in-process GGUF execution
 * adapter for the Graphorin framework. The package wraps
 * `node-llama-cpp@^3.5` to load `.gguf` model files directly into the
 * same Node process — no daemon, no port to manage, no GPU contention
 * with other processes.
 *
 * The adapter declares `trust: 'loopback'` permanently because the
 * model lives in the same trust boundary as the host process; the
 * symmetry mirrors `@graphorin/embedder-transformersjs` (in-process
 * embedder; same trust boundary).
 *
 * The companion package is operationally simpler than the HTTP-shaped
 * adapters but does NOT survive a process restart mid-stream — the
 * model context lives in the process and is lost on exit. For HITL
 * durable mid-stream resume, one of the HTTP-shaped adapters
 * (`ollamaAdapter`, `llamaCppServerAdapter`, `openAICompatibleAdapter`)
 * is the better choice.
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export { type LlamaCppNodeAdapterOptions, llamaCppNodeAdapter } from './adapter.js';
export {
  LlamaCppNativeCounter,
  type LlamaCppNativeCounterOptions,
} from './counter.js';
export type {
  LlamaCppNodeRuntimeOverrides,
  LlamaInstance,
  LlamaModelInstance,
  LlamaSessionInstance,
} from './runtime.js';
