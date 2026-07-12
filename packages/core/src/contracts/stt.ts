/**
 * Speech-to-text seam. The canonical adapter name is `SttAdapter`;
 * this single definition is consumed by the channel gateway
 * (`@graphorin/channels`, voice notes) and by any future voice
 * pipeline, so the two can never diverge on the contract.
 *
 * The framework ships NO implementations - engines (whisper.cpp,
 * faster-whisper, cloud APIs) live in application repositories or
 * opt-in packages.
 *
 * @stable
 */
export interface SttTranscriptionRequest {
  /** Raw audio bytes as received from the channel. */
  readonly audio: Uint8Array;
  /** MIME type of `audio`, e.g. `'audio/ogg'`. */
  readonly mimeType: string;
  /** Optional BCP-47 language hint, e.g. `'ru'`. */
  readonly languageHint?: string;
  readonly signal?: AbortSignal;
}

/**
 * A finished transcription. `trustClass` is pinned to
 * `'channel-inbound'` by the type: a transcript of a voice note is
 * message-borne channel content and MUST inherit the channel trust
 * boundary (sanitization + taint), no matter which engine produced
 * it.
 *
 * @stable
 */
export interface SttTranscript {
  readonly text: string;
  /** Detected BCP-47 language, when the engine reports one. */
  readonly language?: string;
  /** Engine confidence in [0, 1], when reported. */
  readonly confidence?: number;
  /** Source audio duration, when known. */
  readonly durationMs?: number;
  /** Provenance pin - see the interface docs. */
  readonly trustClass: 'channel-inbound';
}

/**
 * Pluggable speech-to-text engine.
 *
 * @stable
 */
export interface SttAdapter {
  /** Stable engine id for audit rows, e.g. `'faster-whisper'`. */
  readonly id: string;
  transcribe(request: SttTranscriptionRequest): Promise<SttTranscript>;
}
