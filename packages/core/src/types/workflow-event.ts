/**
 * Discriminated union of every event produced by `Workflow.execute(...)`
 * and `Workflow.resume(...)`.
 *
 * Generic over `TState` so that downstream consumers can discriminate on
 * the workflow's typed state shape.
 *
 * @stable
 */
export type WorkflowEvent<TState = unknown> =
  | WorkflowStartEvent
  | WorkflowStepStartEvent<TState>
  | WorkflowStepEndEvent<TState>
  | WorkflowTaskStartEvent
  | WorkflowTaskEndEvent
  | WorkflowChannelUpdateEvent<TState>
  | WorkflowCheckpointWrittenEvent
  | WorkflowSuspendedEvent<TState>
  | WorkflowResumedEvent<TState>
  | WorkflowEndEvent<TState>
  | WorkflowErrorEvent
  | WorkflowCustomEvent;

/** @stable */
export interface WorkflowStartEvent {
  readonly type: 'workflow.start';
  readonly threadId: string;
  readonly workflowId: string;
}

/** @stable */
export interface WorkflowStepStartEvent<TState = unknown> {
  readonly type: 'workflow.step.start';
  readonly stepNumber: number;
  readonly state: TState;
}

/** @stable */
export interface WorkflowStepEndEvent<TState = unknown> {
  readonly type: 'workflow.step.end';
  readonly stepNumber: number;
  readonly state: TState;
}

/** @stable */
export interface WorkflowTaskStartEvent {
  readonly type: 'workflow.task.start';
  readonly stepNumber: number;
  readonly taskId: string;
  readonly nodeName: string;
}

/** @stable */
export interface WorkflowTaskEndEvent {
  readonly type: 'workflow.task.end';
  readonly stepNumber: number;
  readonly taskId: string;
  readonly nodeName: string;
  readonly status: 'completed' | 'failed' | 'paused';
  readonly durationMs: number;
}

/** @stable */
export interface WorkflowChannelUpdateEvent<TState = unknown> {
  readonly type: 'workflow.channel.update';
  readonly stepNumber: number;
  readonly channel: keyof TState & string;
  readonly version: number;
}

/** @stable */
export interface WorkflowCheckpointWrittenEvent {
  readonly type: 'workflow.checkpoint.written';
  readonly checkpointId: string;
  readonly stepNumber: number;
}

/**
 * Workflow paused — for HITL approvals or programmatic `pause(value)`
 * calls. Carries the value passed to `pause(...)` so the caller can
 * choose how to surface the prompt to the user.
 *
 * @stable
 */
export interface WorkflowSuspendedEvent<TState = unknown> {
  readonly type: 'workflow.suspended';
  readonly threadId: string;
  readonly stepNumber: number;
  readonly state: TState;
  readonly value: unknown;
}

/** @stable */
export interface WorkflowResumedEvent<TState = unknown> {
  readonly type: 'workflow.resumed';
  readonly threadId: string;
  readonly stepNumber: number;
  readonly state: TState;
}

/** @stable */
export interface WorkflowEndEvent<TState = unknown> {
  readonly type: 'workflow.end';
  readonly threadId: string;
  readonly state: TState;
}

/** @stable */
export interface WorkflowErrorEvent {
  readonly type: 'workflow.error';
  readonly threadId: string;
  readonly error: { readonly message: string; readonly code: string };
}

/**
 * Application-defined event emitted from inside a workflow node via
 * `ctx.emit(name, payload)`. The runtime never produces these on its own.
 *
 * @stable
 */
export interface WorkflowCustomEvent {
  readonly type: 'workflow.custom';
  readonly name: string;
  readonly payload: unknown;
}
