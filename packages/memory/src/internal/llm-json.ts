/**
 * Shared tolerant-parsing primitives for LLM text completions that are
 * expected to carry JSON. Every consolidator phase and search transformer
 * that parses a model response uses these two helpers; they used to be
 * copy-pasted per module (7 copies of {@link stripFence}, 3 of
 * {@link sliceJsonObject}) until the CodeQL ReDoS fix (06b7552) had to be
 * applied to all of them at once - the canonical demonstration of why the
 * single definition lives here now.
 *
 * Package-local (`internal/`): not part of the public `@graphorin/memory`
 * API surface.
 *
 * @packageDocumentation
 */

/**
 * Strip a single surrounding Markdown code fence, if present. The
 * info-string is matched with `[^\n]*` (never across lines) so a hostile
 * megabyte-long first line cannot trigger polynomial backtracking; an
 * unterminated fence leaves the text untouched and the caller's JSON
 * parsing fails soft instead.
 */
export function stripFence(text: string): string {
  const match = /^```[^\n]*\n([\s\S]*?)\n```/u.exec(text.trim());
  return match?.[1] ?? text;
}

/**
 * Best-effort recovery slice for completions that wrap a JSON object in
 * prose: everything from the first `{` to the last `}`. Returns `null`
 * when no plausible object span exists.
 */
export function sliceJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  return text.slice(start, end + 1);
}
