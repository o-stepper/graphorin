/**
 * Graphorin v0.2.0 — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Minimal `SlackClient` interface plus a deterministic in-memory
 * implementation used by the smoke test. The interface surfaces the
 * same shape that `@slack/web-api`'s `WebClient.chat.postMessage` /
 * `WebClient.views.open` expose, so an operator can swap the stub for
 * the real client by passing a thin adapter into
 * `createSlackBotApp({ slackClient })`. The README documents the
 * adapter recipe.
 */

/** Slack interactive button. Mirrors the subset of Block Kit actions the example uses. */
export interface SlackInteractiveButton {
  readonly text: string;
  readonly value: string;
  readonly style?: 'primary' | 'danger';
}

/**
 * Slack `chat.postMessage` payload. The stub records the full envelope
 * verbatim so tests can assert on every field the app supplied.
 */
export interface SlackPostMessageRequest {
  readonly channel: string;
  readonly text: string;
  readonly thread_ts?: string;
  readonly buttons?: ReadonlyArray<SlackInteractiveButton>;
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Frozen response from the in-memory `chat.postMessage` stub. */
export interface SlackPostMessageResponse {
  readonly ok: true;
  readonly ts: string;
  readonly channel: string;
}

/** Minimal Slack client surface the example consumes. */
export interface SlackClient {
  postMessage(req: SlackPostMessageRequest): Promise<SlackPostMessageResponse>;
}

/** Recorded message envelope returned by the in-memory client. */
export interface RecordedSlackMessage extends SlackPostMessageRequest {
  readonly ts: string;
  readonly recordedAt: string;
}

/** In-memory client — exposes the recorded message log. */
export interface InMemorySlackClient extends SlackClient {
  readonly messages: ReadonlyArray<RecordedSlackMessage>;
  /** Drop every recorded message. Tests reuse this between scenarios. */
  reset(): void;
}

/**
 * Build a deterministic in-memory Slack client. Each `postMessage` call
 * appends a new {@link RecordedSlackMessage} to {@link messages}; the
 * stub never opens a network socket. The optional `now` and `newTs`
 * overrides make the recorded timestamps reproducible inside tests.
 */
export function createInMemorySlackClient(
  options: { readonly now?: () => Date; readonly newTs?: () => string } = {},
): InMemorySlackClient {
  const now = options.now ?? (() => new Date());
  const newTs = options.newTs ?? defaultNewTs();
  const messages: RecordedSlackMessage[] = [];
  return {
    get messages(): ReadonlyArray<RecordedSlackMessage> {
      return messages;
    },
    async postMessage(req: SlackPostMessageRequest): Promise<SlackPostMessageResponse> {
      const ts = newTs();
      const recorded: RecordedSlackMessage = Object.freeze({
        channel: req.channel,
        text: req.text,
        ...(req.thread_ts !== undefined ? { thread_ts: req.thread_ts } : {}),
        ...(req.buttons !== undefined ? { buttons: Object.freeze([...req.buttons]) } : {}),
        ...(req.metadata !== undefined ? { metadata: Object.freeze({ ...req.metadata }) } : {}),
        ts,
        recordedAt: now().toISOString(),
      });
      messages.push(recorded);
      return Object.freeze({ ok: true as const, ts, channel: req.channel });
    },
    reset(): void {
      messages.length = 0;
    },
  };
}

function defaultNewTs(): () => string {
  let n = 1;
  return () => {
    // Slack timestamps look like `1700000000.000001`. The exact shape
    // is not asserted; the stub returns a monotonic counter so test
    // runs are reproducible.
    const value = `1700000000.${String(n).padStart(6, '0')}`;
    n += 1;
    return value;
  };
}
