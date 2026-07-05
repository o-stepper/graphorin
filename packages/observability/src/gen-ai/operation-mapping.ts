/**
 * Mapping table from Graphorin `SpanType` values to canonical
 * `gen_ai.operation.name` enum values.
 *
 * The table mirrors the canonical-mapping reference table published
 * in the architecture documentation and is the authoritative source
 * for the `emitGenAIAttributes` helper.
 *
 * @packageDocumentation
 */

import type { SpanType } from '@graphorin/core';

import type { GenAIOperationName } from './types.js';

const TABLE: ReadonlyArray<readonly [SpanType, GenAIOperationName]> = Object.freeze([
  // E8: match what the runtime actually emits (agent factory stamps
  // `gen_ai.operation.name: 'invoke_agent'` on both run + step spans) and the
  // OTel GenAI operation enum, which has `invoke_agent` and no step concept.
  ['agent.run', 'invoke_agent'],
  ['agent.step', 'invoke_agent'],
  ['agent.handoff', 'agent.handoff'],
  ['agent.suspend', 'agent.suspend'],
  ['agent.resume', 'agent.resume'],

  ['provider.generate', 'chat'],
  ['provider.stream', 'chat'],

  ['tool.execute', 'execute_tool'],
  ['tool.approval', 'execute_tool'],

  ['memory.read.working', 'memory.read'],
  ['memory.read.session', 'memory.read'],
  ['memory.read.episodic', 'memory.read'],
  ['memory.read.semantic', 'memory.read'],
  ['memory.read.procedural', 'memory.read'],
  ['memory.read.shared', 'memory.read'],
  ['memory.write.working', 'memory.write'],
  ['memory.write.session', 'memory.write'],
  ['memory.write.episodic', 'memory.write'],
  ['memory.write.semantic', 'memory.write'],
  ['memory.write.procedural', 'memory.write'],
  ['memory.write.shared', 'memory.write'],
  ['memory.search.working', 'memory.search'],
  ['memory.search.session', 'memory.search'],
  ['memory.search.episodic', 'memory.search'],
  ['memory.search.semantic', 'memory.search'],
  ['memory.search.procedural', 'memory.search'],
  ['memory.search.shared', 'memory.search'],
  ['memory.consolidate.light', 'memory.consolidate'],
  ['memory.consolidate.standard', 'memory.consolidate'],
  ['memory.consolidate.deep', 'memory.consolidate'],
  ['memory.conflict', 'memory.conflict'],
  ['memory.embed', 'embedding'],

  ['workflow.run', 'workflow.run'],
  ['workflow.step', 'workflow.step'],
  ['workflow.task', 'workflow.task'],
  ['workflow.checkpoint', 'workflow.checkpoint'],

  ['skill.activate', 'skill.activate'],
  ['skill.load', 'skill.load'],

  ['mcp.connect', 'mcp.connect'],
  ['mcp.call', 'mcp.call'],
  ['mcp.list-tools', 'mcp.list-tools'],
] as const);

const LOOKUP = new Map<SpanType, GenAIOperationName>(TABLE);

/**
 * Resolve the canonical `gen_ai.operation.name` value for a Graphorin
 * span type. Returns `undefined` if no mapping exists (e.g. for
 * `replay.*` markers, which are emitted via a separate code path).
 *
 * @stable
 */
export function operationNameFor(type: SpanType): GenAIOperationName | undefined {
  return LOOKUP.get(type);
}

/**
 * Full canonical span-to-operation table - exposed for tooling
 * (documentation generators, fixture tests) that need to introspect
 * the mapping.
 *
 * @stable
 */
export const OPERATION_NAME_TABLE: ReadonlyArray<readonly [SpanType, GenAIOperationName]> = TABLE;
