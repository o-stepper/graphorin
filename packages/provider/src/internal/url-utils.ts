/**
 * Tiny URL helpers shared between the provider adapters. Kept regex-free
 * so CodeQL does not flag the (otherwise harmless) `/+` quantifier on
 * adapter base URLs.
 *
 * @internal
 */

/**
 * Strip every trailing `/` from a URL string. Operates in `O(n)` time
 * with a single linear scan from the end, so it is safe to call on
 * adversarial inputs without bounding the length first.
 *
 * @internal
 */
export function stripTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url.charCodeAt(end - 1) === 0x2f /* '/' */) end -= 1;
  return end === url.length ? url : url.slice(0, end);
}
