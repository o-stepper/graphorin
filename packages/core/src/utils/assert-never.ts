/**
 * Exhaustiveness helper. Place at the end of a `switch (...)` over a
 * discriminated union: TypeScript narrows the operand to `never` if
 * every variant is handled. Adding a new variant later turns the call
 * site into a compile error — the regression net for our event unions.
 *
 * @example
 * ```ts
 * function describe(event: AgentEvent): string {
 *   switch (event.type) {
 *     case 'agent.start': return 'started';
 *     case 'agent.end':   return 'ended';
 *     // ... every other variant ...
 *     default:
 *       return assertNever(event, 'Unhandled AgentEvent variant');
 *   }
 * }
 * ```
 *
 * @stable
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message ?? `graphorin: unhandled discriminated-union variant: ${String(value)}`);
}
