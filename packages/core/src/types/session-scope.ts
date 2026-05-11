/**
 * Identifies a logical conversational scope: who the user is, which agent
 * is in charge, and (when known) which session they're inside.
 *
 * Used as a parameter to almost every Memory / Sessions API. The agent and
 * session fields are optional because some scopes are user-wide (e.g.
 * shared facts attached to a user, not a particular agent).
 *
 * @stable
 */
export interface SessionScope {
  /** Stable identifier of the user (single-user-per-process by default). */
  readonly userId: string;
  /** Identifier of the agent owning the scope, when applicable. */
  readonly agentId?: string;
  /** Identifier of the session, when applicable. */
  readonly sessionId?: string;
}
