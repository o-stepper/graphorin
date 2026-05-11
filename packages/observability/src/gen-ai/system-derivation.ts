/**
 * Auto-derivation lookup table for the `gen_ai.system` attribute.
 *
 * @packageDocumentation
 */

import type { GenAISystem } from './types.js';

/**
 * Canonical mapping from a provider class name (or substring) to the
 * `gen_ai.system` enum value. The table is an export so consumers
 * (e.g. provider adapters in Phase 06) can introspect or extend it.
 *
 * @stable
 */
export const PROVIDER_CLASS_TO_GEN_AI_SYSTEM: ReadonlyArray<readonly [RegExp, GenAISystem]> =
  Object.freeze([
    [/anthropic/i, 'anthropic'],
    [/openai(?!compat)/i, 'openai'],
    [/google|gemini/i, 'google'],
    [/mistral/i, 'mistral'],
    [/ollama/i, 'ollama'],
    [/openrouter/i, 'openrouter'],
    [/azure/i, 'azure_ai_inference'],
    [/bedrock|aws/i, 'aws.bedrock'],
    [/cohere/i, 'cohere'],
    [/vertex/i, 'vertex_ai'],
    [/llamacpp|llama-cpp|llama_cpp/i, 'graphorin-llamacpp'],
    [/openaicompatible|openai-compatible/i, 'graphorin-openai-compatible'],
  ] as const);

const WARNED_CLASSES = new Set<string>();
let WARN_SINK: (line: string) => void = (line) => console.warn(line);

/**
 * Override the WARN-once sink used for unrecognised provider class
 * names. Useful in tests so the suite does not pollute stderr.
 *
 * @internal
 */
export function setGenAISystemWarnSink(sink: (line: string) => void): void {
  WARN_SINK = sink;
}

/**
 * Reset the WARN-once cache. Test-only.
 *
 * @internal
 */
export function _resetGenAISystemWarningsForTesting(): void {
  WARNED_CLASSES.clear();
}

/**
 * Derive the canonical `gen_ai.system` value from a provider class
 * name. Returns `null` when the name does not match any known
 * pattern; callers should declare `Provider.genAiSystem` explicitly
 * in that case.
 *
 * The first time an unknown class name is seen, the function emits
 * one structured WARN line to the configured sink so operators
 * notice the gap. Subsequent lookups for the same class are silent.
 *
 * @stable
 */
export function deriveGenAISystem(providerClassName: string): GenAISystem | null {
  for (const [regex, system] of PROVIDER_CLASS_TO_GEN_AI_SYSTEM) {
    if (regex.test(providerClassName)) return system;
  }
  warnOnce(providerClassName);
  return null;
}

function warnOnce(providerClassName: string): void {
  if (WARNED_CLASSES.has(providerClassName)) return;
  WARNED_CLASSES.add(providerClassName);
  WARN_SINK(
    `[graphorin/observability] WARN: provider class "${providerClassName}" is not in ` +
      'the auto-derivation table for `gen_ai.system`. Declare `Provider.genAiSystem` ' +
      'explicitly on the adapter so OpenTelemetry GenAI dashboards attribute the spans ' +
      'correctly. See `@graphorin/observability/gen-ai` and the OpenTelemetry GenAI ' +
      'semantic conventions for the canonical vendor enum.',
  );
}
