/**
 * Adapter barrel - re-exports the four bundled adapters.
 *
 * @packageDocumentation
 */

export type { LlamaCppServerAdapterOptions } from './llamacpp-server.js';
export { llamaCppServerAdapter } from './llamacpp-server.js';
export type { OllamaAdapterOptions } from './ollama.js';
export { ollamaAdapter } from './ollama.js';
export type { OpenAICompatibleAdapterOptions } from './openai-compatible.js';
export { openAICompatibleAdapter } from './openai-compatible.js';
export type { VercelAdapterOptions } from './vercel.js';
export { vercelAdapter } from './vercel.js';
