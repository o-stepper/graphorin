[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CassetteReplayDecision

# Type Alias: CassetteReplayDecision

```ts
type CassetteReplayDecision = 
  | {
  reason: CassetteReplayReason;
  sideEffectClass: SideEffectClass;
  stepNumber: number;
  substitutedOutput: unknown;
  toolCallId: string;
  toolName: string;
  type: "tool.cassette.replay.substituted";
}
  | {
  reason: CassetteReplayReason;
  sideEffectClass: SideEffectClass;
  stepNumber: number;
  toolCallId: string;
  toolName: string;
  type: "tool.cassette.replay.live";
  warnLevel: "INFO" | "WARN-non-silenceable" | "WARN";
}
  | {
  decision: "continue-with-recorded" | "aborted" | "fallback-live";
  liveIdempotencyKey?: string;
  liveSha256OfArgs: string;
  recordedIdempotencyKey?: string;
  recordedSha256OfArgs: string;
  sideEffectClass: SideEffectClass;
  stepNumber: number;
  toolCallId: string;
  toolName: string;
  type: "tool.cassette.replay.idempotency-mismatch";
}
  | {
  decision: "aborted" | "fallback-live";
  missingArtifactPath: string;
  stepNumber: number;
  toolCallId: string;
  toolName: string;
  type: "tool.cassette.replay.artifact-missing";
};
```

Defined in: [packages/sessions/src/cassette/replay.ts:39](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L39)

Single decision the replay engine reports per cassette record.

## Stable
