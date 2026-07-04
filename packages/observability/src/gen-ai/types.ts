/**
 * Type definitions for the OpenTelemetry GenAI semantic-conventions
 * conformance helpers.
 *
 * @packageDocumentation
 */

import type { SpanType } from '@graphorin/core';

/**
 * Canonical OpenTelemetry semantic-conventions vendor enum used as the
 * value of the `gen_ai.system` attribute.
 *
 * @stable
 */
export type GenAISystem =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'mistral'
  | 'ollama'
  | 'openrouter'
  | 'azure_ai_inference'
  | 'aws.bedrock'
  | 'cohere'
  | 'vertex_ai'
  | 'graphorin-llamacpp'
  | 'graphorin-openai-compatible'
  | (string & { readonly __genAiSystem?: never });

/**
 * `gen_ai.tool.type` enum value. Defaults to `'function'` for
 * user-defined and MCP-derived tools without explicit declaration.
 *
 * @stable
 */
export type GenAIToolType =
  | 'function'
  | 'web_search'
  | 'database'
  | 'code_interpreter'
  | 'image_generation'
  | 'file_search';

/**
 * Canonical `gen_ai.operation.name` enum used per the OpenTelemetry
 * GenAI semantic conventions for AI agent + framework spans.
 *
 * @stable
 */
export type GenAIOperationName =
  // E8: `invoke_agent` is the canonical OTel GenAI agent operation and what
  // the runtime emits; the legacy `agent.run`/`agent.step` members remain for
  // compatibility with older recorded traces.
  | 'invoke_agent'
  | 'agent.run'
  | 'agent.step'
  | 'agent.handoff'
  | 'agent.suspend'
  | 'agent.resume'
  | 'agent.fanout.spawned'
  | 'agent.fanout.merged'
  | 'agent.evaluator.iteration'
  | 'chat'
  | 'embedding'
  | 'execute_tool'
  | 'memory.read'
  | 'memory.write'
  | 'memory.search'
  | 'memory.consolidate'
  | 'memory.conflict'
  | 'workflow.run'
  | 'workflow.step'
  | 'workflow.task'
  | 'workflow.checkpoint'
  | 'mcp.connect'
  | 'mcp.call'
  | 'mcp.list-tools'
  | 'skill.activate'
  | 'skill.load'
  | 'replay.run'
  | 'replay.skipped';

/**
 * Per-message event type used by {@link emitGenAIMessageEvents}.
 *
 * @stable
 */
export type GenAIMessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Single per-message record passed to {@link emitGenAIMessageEvents}.
 *
 * @stable
 */
export interface GenAIMessage {
  readonly role: GenAIMessageRole;
  readonly content: string;
  /** Optional model-specific metadata (tool calls, names, …). */
  readonly toolCalls?: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly arguments: string;
  }>;
  readonly toolCallId?: string;
  readonly name?: string;
}

/**
 * Per-span attribute payload expected by {@link emitGenAIAttributes}.
 * The fields mirror the OpenTelemetry GenAI semantic conventions and
 * are merged with the existing Graphorin-prefixed attributes — the
 * `gen_ai.*` family is additive, never replacing.
 *
 * @stable
 */
export interface GenAIAttributes {
  readonly system?: GenAISystem;
  readonly requestModel?: string;
  readonly responseModel?: string;
  readonly responseId?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly finishReasons?: ReadonlyArray<string>;
  readonly operation?: GenAIOperationName;
  readonly agentId?: string;
  readonly agentName?: string;
  readonly sessionId?: string;
  readonly toolName?: string;
  readonly toolType?: GenAIToolType;
  readonly toolCallId?: string;
  readonly toolDescription?: string;
}

/**
 * Mapping from a Graphorin `SpanType` to the canonical
 * `gen_ai.operation.name` value. Returns `undefined` for span types
 * that do not have a canonical operation enum (`replay.*` is recorded
 * as `'replay.run'` / `'replay.skipped'` per the doc table).
 *
 * @stable
 */
export type SpanTypeToOperationName = (type: SpanType) => GenAIOperationName | undefined;
