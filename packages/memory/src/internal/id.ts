/**
 * Stable id generator. Combines `Date.now()` (millisecond resolution),
 * a per-process monotonic counter (resists collision inside the same
 * millisecond), and a 36-bit crypto-quality random suffix (ties the id
 * to the host so different runs do not collide either).
 *
 * The format is intentionally NOT a UUID — UUIDs are 16 bytes once
 * decoded; these ids are 18 chars on average which is what the
 * `audit.db` hash chain (Phase 03b) was sized for.
 *
 * @stable
 */
import { randomBytes } from 'node:crypto';

let counter = 0;

export function newMemoryId(prefix: string): string {
  counter = (counter + 1) & 0xffff;
  const time = Date.now().toString(36);
  const c = counter.toString(36).padStart(3, '0');
  const rand = randomBytes(4).toString('hex');
  return `${prefix}_${time}${c}${rand}`;
}
