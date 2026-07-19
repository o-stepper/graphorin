/**
 * `memoryFlushHook` - the built-in budgeted pre-compaction flush: one
 * quiet LLM call salvages durable facts from the buffer that is about
 * to be summarized away and writes them through
 * `memory.semantic.remember` with `provenance: 'extraction'`.
 *
 * Safe-by-construction with respect to the ingest gate:
 *
 *  - the hook sees the MODEL-VISIBLE buffer (post-guardrail content -
 *    raw blocked turns never enter it);
 *  - when the facade carries an ingest gate (`memory.ingestGate`), the
 *    hook applies it to every candidate message (a throwing gate
 *    excludes the message, mirroring the consolidator's fail-closed
 *    posture);
 *  - every flushed fact lands QUARANTINED (synthesized provenance,
 *    never auto-promoted) - nothing the flush writes reaches default
 *    recall without validation / the promotion policy.
 *
 * Resilient per the re-anchor hook pattern: a provider failure or an
 * unparseable reply WARNs to stderr and flushes nothing - compaction
 * itself is never blocked. The provider call is capped
 * (`maxOutputTokens`) and the transcript slice is char-bounded, so the
 * flush is one bounded call per compaction; pick a cheap model. Note
 * the call happens OUTSIDE the agent loop, so agent run budgets do
 * not observe it - bound it here.
 *
 * Retires the inert `SessionMemory.flushImportant` stub:
 * this hook is the single flush surface.
 */

import type { Provider } from '@graphorin/core';
import { parseExtraction } from '../../../consolidator/phases/standard.js';
import type { SessionMessageRecord } from '../../../internal/storage-adapter.js';
import type { NamedPreCompactionHook } from '../types.js';

/** Options for {@link memoryFlushHook}. */
export interface MemoryFlushHookOptions {
  /** The (cheap) provider the one flush call runs on. */
  readonly provider: Provider;
  /** Upper bound on facts written per flush. Default `10`. */
  readonly maxFacts?: number;
  /** Char bound on the transcript slice sent to the provider. Default `24000`. */
  readonly maxInputChars?: number;
  /** Output-token cap for the flush call. Default `512`. */
  readonly maxOutputTokens?: number;
  /** WARN sink override - used by tests. Default `process.stderr`. */
  readonly warn?: (message: string) => void;
}

const FLUSH_SYSTEM_PROMPT = [
  'You are a memory-extraction assistant for a long-running personal-assistant runtime.',
  'The following conversation slice is about to be summarized away - extract the durable',
  'facts it asserts about the user, the world, or stable preferences that would otherwise',
  'be lost. Skip anything transient, and anything a summary would preserve on its own.',
  'Each fact text MUST be a self-contained proposition understandable with no surrounding',
  'context. Return a single JSON object: { "facts": [{ "text": string }] }.',
  'If nothing durable is at risk, return { "facts": [] }.',
].join(' ');

/**
 * Build the pre-compaction memory-flush hook. Register via
 * `contextEngine: { compaction: { preCompactionHooks: [memoryFlushHook({ provider })] } }`.
 *
 * @stable
 */
export function memoryFlushHook(options: MemoryFlushHookOptions): NamedPreCompactionHook {
  const maxFacts = options.maxFacts ?? 10;
  const maxInputChars = options.maxInputChars ?? 24_000;
  const maxOutputTokens = options.maxOutputTokens ?? 512;
  const warn =
    options.warn ?? ((message: string) => process.stderr.write(`[graphorin/memory] ${message}\n`));
  return {
    id: 'memoryFlushHook',
    async run(deps, ctx) {
      try {
        const gate = deps.memory.ingestGate;
        const candidates: string[] = [];
        let sequence = 0;
        for (const message of ctx.messages) {
          if (message.role !== 'user' && message.role !== 'assistant') continue;
          const text = flattenText(message.content);
          if (text.length === 0) continue;
          sequence += 1;
          if (typeof gate === 'function') {
            const record: SessionMessageRecord = {
              id: `flush:${ctx.runId}:${sequence}`,
              sequence,
              createdAt: new Date().toISOString(),
              tokenCount: null,
              message,
            };
            let admitted = false;
            try {
              admitted = gate(record);
            } catch {
              admitted = false; // fail-closed, mirroring the consolidator
            }
            if (!admitted) continue;
          }
          candidates.push(`${message.role}: ${text}`);
        }
        if (candidates.length === 0) return;
        let transcript = candidates.join('\n');
        if (transcript.length > maxInputChars) {
          transcript = transcript.slice(transcript.length - maxInputChars);
        }
        const response = await options.provider.generate({
          systemMessage: FLUSH_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [{ type: 'text', text: `Conversation slice:\n${transcript}` }],
            },
          ],
          temperature: 0,
          maxTokens: maxOutputTokens,
        });
        const facts = parseExtraction(response.text ?? '').slice(0, maxFacts);
        for (const fact of facts) {
          // 'extraction' provenance => synthesized => QUARANTINED (B3-safe:
          // nothing reaches default recall without validation/promotion).
          await deps.memory.semantic.remember(ctx.scope, {
            text: fact.text,
            provenance: 'extraction',
          });
        }
      } catch (error) {
        // Re-anchor hook pattern: the flush must never block compaction.
        warn(
          `memoryFlushHook: flush skipped (${error instanceof Error ? error.message : String(error)}).`,
        );
      }
    },
  };
}

function flattenText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: string[] = [];
  for (const part of content) {
    if (
      typeof part === 'object' &&
      part !== null &&
      (part as { type?: unknown }).type === 'text' &&
      typeof (part as { text?: unknown }).text === 'string'
    ) {
      parts.push((part as { text: string }).text);
    }
  }
  return parts.join('\n');
}
