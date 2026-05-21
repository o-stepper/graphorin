/**
 * The {@link ToolCall} leaf type lives in its own module so that
 * `message.ts` (which references `ToolCall`) and `tool.ts` (which
 * references `MessageContent`) can both depend on it without forming a
 * circular import. `tool.ts` re-exports `ToolCall` for backwards
 * compatibility, so external import paths are unchanged.
 *
 * @packageDocumentation
 */

/**
 * A single tool invocation the model requested, normalised by the
 * provider layer and handed to the tool executor for parallel dispatch.
 *
 * @stable
 */
export interface ToolCall {
  /** Stable identifier the model uses to correlate input and output. */
  readonly toolCallId: string;
  /** Tool name as registered in the `ToolRegistry`. */
  readonly toolName: string;
  /** Validated input matching the tool's `inputSchema`. */
  readonly args: unknown;
}
