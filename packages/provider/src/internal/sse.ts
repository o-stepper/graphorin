/**
 * Minimal `text/event-stream` chunk parser. Lives here because three
 * adapters consume the same shape (`llamaCppServerAdapter`,
 * `openAICompatibleAdapter`, plus the OpenAI-compatible legacy path
 * inside `ollamaAdapter`). Keeping it local avoids pulling in a
 * dedicated SSE package.
 *
 * @internal
 */

/**
 * Parse a Web `Response`'s body as Server-Sent Events. Yields one
 * payload per `data: <payload>` line; ignores `event:` / `id:` / `:`
 * comments lines per the SSE spec. Terminates on `data: [DONE]` per
 * the OpenAI-compatible convention.
 *
 * @internal
 */
export async function* parseEventStream(
  body: ReadableStream<Uint8Array> | null,
  options: { readonly signal?: AbortSignal } = {},
): AsyncIterable<string> {
  if (body === null) return;
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    while (true) {
      if (options.signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let separatorIdx = findSeparator(buffer);
      while (separatorIdx !== -1) {
        const eventBlock = buffer.slice(0, separatorIdx);
        buffer = buffer.slice(separatorIdx + matchSeparatorLength(buffer, separatorIdx));
        const dataPayload = extractDataLines(eventBlock);
        if (dataPayload === '[DONE]') return;
        if (dataPayload !== null) yield dataPayload;
        separatorIdx = findSeparator(buffer);
      }
    }
    const tail = buffer.trim();
    if (tail.length > 0) {
      const dataPayload = extractDataLines(tail);
      if (dataPayload !== null && dataPayload !== '[DONE]') yield dataPayload;
    }
  } finally {
    reader.releaseLock();
  }
}

function findSeparator(buffer: string): number {
  const lf = buffer.indexOf('\n\n');
  const crlf = buffer.indexOf('\r\n\r\n');
  if (lf === -1) return crlf;
  if (crlf === -1) return lf;
  return lf < crlf ? lf : crlf;
}

function matchSeparatorLength(buffer: string, idx: number): number {
  return buffer.startsWith('\r\n\r\n', idx) ? 4 : 2;
}

function extractDataLines(block: string): string | null {
  const dataLines: string[] = [];
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine;
    if (line.startsWith(':')) continue;
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).replace(/^ /, ''));
    }
  }
  if (dataLines.length === 0) return null;
  return dataLines.join('\n');
}

/**
 * Parse a newline-delimited JSON stream. Used by the native Ollama
 * `/api/chat` path which emits one JSON object per `\n`-terminated
 * line (NOT SSE).
 *
 * @internal
 */
export async function* parseNdJsonStream(
  body: ReadableStream<Uint8Array> | null,
  options: { readonly signal?: AbortSignal } = {},
): AsyncIterable<string> {
  if (body === null) return;
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    while (true) {
      if (options.signal?.aborted) return;
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nlIdx = buffer.indexOf('\n');
      while (nlIdx !== -1) {
        const line = buffer.slice(0, nlIdx).trim();
        buffer = buffer.slice(nlIdx + 1);
        if (line.length > 0) yield line;
        nlIdx = buffer.indexOf('\n');
      }
    }
    const tail = buffer.trim();
    if (tail.length > 0) yield tail;
  } finally {
    reader.releaseLock();
  }
}
