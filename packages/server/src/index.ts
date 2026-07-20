/**
 * `@graphorin/server` - standalone server runtime for the Graphorin
 * framework.
 *
 * Phase 14a entry point. Ships:
 *
 * - {@link createServer} - the single programmatic entry that wires
 *   the Hono app, the auth + scope + idempotency + audit middleware
 *   stack, REST endpoints (agents / workflows / sessions / memory /
 *   skills / mcp / tokens / audit / health), the lifecycle hooks
 *   (`beforeStart` / `onReady` / `beforeShutdown` / `onError`), the
 *   pre-bind secrets-resolution + storage-migration runner, and the
 *   graceful SIGTERM drain.
 * - {@link defineConfig} + {@link parseServerConfig} - typed
 *   configuration loader with a Zod-validated schema; missing fields
 *   fall back to documented production-ready defaults.
 * - {@link AgentRegistry} + {@link WorkflowRegistry} - read/write
 *   registries the route handlers consult to look up user-defined
 *   agents / workflows.
 * - {@link RunStateTracker} - in-memory bookkeeping for in-flight
 *   runs (run id, status, AbortController). Phase 14b/c promote the
 *   tracker to a SQLite-backed durable variant.
 * - The full middleware factory suite - re-exported from
 *   `@graphorin/server/middleware` so operators can compose a custom
 *   Hono app on top of the same primitives.
 *
 * @packageDocumentation
 */

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

export {
  type ChannelsInput,
  type CreateServerOptions,
  createServer,
  ensureStoreAuditBinding,
  type GraphorinServer,
  type TriggersDaemonInput,
  type WorkflowTimersInput,
} from './app.js';
export {
  type ChannelGatewayLike,
  type ChannelGatewayStatusLike,
  type ChannelStatusLike,
  type ChannelsDaemon,
  type CreateChannelsDaemonOptions,
  createChannelsDaemon,
} from './channels/index.js';
export {
  createDeliveryCommentarySanitizer,
  DEFAULT_APPLY_TO_EVENTS,
  DEFAULT_DELIVERY_COMMENTARY_PATTERNS,
  type DeliveryCommentaryConfig,
  type DeliveryCommentaryDecision,
  type DeliveryCommentaryPattern,
  type DeliveryCommentaryPolicy,
  type DeliveryCommentaryReason,
  type DeliveryCommentarySanitizer,
  type DeliveryCommentarySink,
  type DeliveryCommentaryTransport,
} from './commentary/index.js';
export {
  type DeliveryCommentaryPolicyConfig,
  defineConfig,
  type IdempotencyRequireKeyMode,
  parseServerConfig,
  type SecretRefString,
  type SecretsSource,
  type ServerConfigInput,
  ServerConfigSchema,
  type ServerConfigSpec,
} from './config.js';
export {
  type ConsolidatorDaemon,
  type ConsolidatorLike,
  type ConsolidatorStatusLike,
  type CreateConsolidatorDaemonOptions,
  createConsolidatorDaemon,
} from './consolidator/index.js';
export * from './errors/index.js';
export {
  type BaseHealthCheck,
  type ChannelsCheck,
  type ConsolidatorCheck,
  collectHealth,
  createExtendedHealthRoutes,
  createMetricsRoutes,
  createSecretsHealthRoutes,
  type EmbedderCheck,
  type EncryptionCheck,
  type HealthCheck,
  type HealthCheckOptions,
  type HealthChecks,
  type HealthRollup,
  type HealthRouteOptions,
  type HealthStatus,
  type HealthSummary,
  type MetricsRoutesOptions,
  type ReplayBufferCheck,
  type ReplayBufferProbe,
  rollup,
  type SecretsCheck,
  type StorageCheck,
  type TriggersCheck,
  type WorkflowTimersCheck,
} from './health/index.js';
export type {
  AuthState,
  RequestToken,
  ServerRequestState,
  ServerVariables,
} from './internal/context.js';
export {
  type BeforeShutdownContext,
  type BeforeStartContext,
  type LifecycleHooks,
  type OnErrorContext,
  type OnReadyContext,
  type PreBindResult,
  type RunPreBindOptions,
  runPreBind,
} from './lifecycle/index.js';
export {
  createServerMetricRegistry,
  type LabelSet,
  type MetricKind,
  MetricRegistry,
  SERVER_METRIC_NAMES,
} from './metrics/index.js';
export { syncToolCounters } from './metrics/tools-bridge.js';
export {
  type AuditErrorSink,
  type AuditMiddlewareOptions,
  type AuthMiddlewareOptions,
  createAuditMiddleware,
  createAuthMiddleware,
  createCorsMiddleware,
  createCsrfMiddleware,
  createIdempotencyMiddleware,
  createRateLimitMiddleware,
  createRequestStateMiddleware,
  createScopeMiddleware,
  HTTP_REQUEST_AUDIT_ACTION,
  type IdempotencyMiddlewareOptions,
  type RequestStateMiddlewareOptions,
  type ScopeRequirement,
} from './middleware/index.js';
export {
  type AgentRegistration,
  AgentRegistry,
  type AgentSummary,
  type ServerAgentLike,
  type ServerWorkflowLike,
  type WorkflowRegistration,
  WorkflowRegistry,
  type WorkflowSummary,
} from './registry/index.js';
export {
  createReplayRoutes,
  type ReplayApi,
  type ReplayMode,
  type ReplayResponse,
  type ReplayRoutesDeps,
} from './replay/index.js';
export {
  type AgentRoutesDeps,
  type AuditApi,
  type AuditRoutesDeps,
  type AuthRoutesDeps,
  createAgentRoutes,
  createAuditRoutes,
  createAuthRoutes,
  createHealthRoutes,
  createMcpRoutes,
  createMemoryRoutes,
  createRunRoutes,
  createSessionRoutes,
  createSkillsRoutes,
  createTokensRoutes,
  createWorkflowRoutes,
  type HealthRoutesDeps,
  type McpApi,
  type McpRoutesDeps,
  type MemoryApi,
  type MemoryRoutesDeps,
  type SessionApi,
  type SessionRoutesDeps,
  type SkillsApi,
  type SkillsRoutesDeps,
  type TokensRoutesDeps,
  type WorkflowRoutesDeps,
} from './routes/index.js';
export {
  createConsoleRetentionLog,
  type RetentionConfig,
  type RetentionLog,
  type RetentionLogLevel,
  type RetentionStoreLike,
  type ScheduleRetentionOptions,
  scheduleRetentionSweeps,
} from './runtime/retention.js';
export {
  type RunActivityEvent,
  type RunDescriptor,
  type RunHandle,
  type RunKind,
  type RunStateSnapshot,
  RunStateTracker,
  type RunStatus,
  type SuspendedRunPersistenceHooks,
  type TerminalRunInfo,
  type TerminalRunStatus,
} from './runtime/run-state.js';
export {
  createSuspendedRunPersistence,
  type SuspendedRunPersistenceOptions,
  type SuspendedRunPersistenceStore,
} from './runtime/suspended-run-persistence.js';
export { createSseRoutes, type SseRoutesDeps } from './sse/index.js';
export {
  bridgeToolAuditToAudit,
  type ToolAuditBridge,
  type ToolEventsAuditPolicy,
  toolAuditEventToAuditInput,
} from './tools-audit-bridge.js';
export {
  type CreateTriggersDaemonOptions,
  createTriggersDaemon,
  createTriggersRoutes,
  defaultCatchupPolicy,
  type TriggersDaemon,
  type TriggersDaemonMetrics,
  type TriggersDaemonStatus,
  type TriggersRoutesDeps,
} from './triggers/index.js';
export {
  type CreateWorkflowTimerDaemonOptions,
  createWorkflowTimerDaemon,
  type WorkflowTimerDaemon,
  type WorkflowTimerDaemonStatus,
  type WorkflowTimerDriverLike,
} from './workflows/timer-daemon.js';
export {
  type BareEventFrame,
  createReplayBuffer,
  createWsDispatcher,
  createWsTicketStore,
  createWsUpgradeEvents,
  type ParsedSubject,
  type ReplayBuffer,
  type ReplayBufferOptions,
  type ReplayBufferSlice,
  requiredScopeFor,
  type SubscribeResult,
  tryParseSubject,
  type WsDispatcher,
  type WsDispatcherOptions,
  type WsDispatcherWarning,
  type WsSubscriberHandle,
  type WsSubscriptionSnapshot,
  type WsTicket,
  type WsTicketConsumeResult,
  type WsTicketStore,
  type WsTicketStoreOptions,
  type WsUpgradeOptions,
} from './ws/index.js';
