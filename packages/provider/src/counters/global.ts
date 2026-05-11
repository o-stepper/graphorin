/**
 * Process-global token counter slot. Components (e.g. the
 * ContextEngine in Phase 10) read the global counter when no
 * per-provider counter is wired explicitly.
 *
 * @packageDocumentation
 */

import type { TokenCounter } from '@graphorin/core';

let globalCounter: TokenCounter | null = null;

/**
 * Set the process-global counter. Called once at startup by user
 * code; passing `null` clears the slot.
 *
 * @stable
 */
export function setGlobalTokenCounter(counter: TokenCounter | null): void {
  globalCounter = counter;
}

/**
 * Read the process-global counter, or `null` if unset.
 *
 * @stable
 */
export function getGlobalTokenCounter(): TokenCounter | null {
  return globalCounter;
}

/**
 * Test-only hook that resets the global slot to `null` between cases.
 *
 * @internal
 */
export function __resetGlobalTokenCounter(): void {
  globalCounter = null;
}
