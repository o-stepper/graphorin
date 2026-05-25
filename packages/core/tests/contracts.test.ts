/**
 * Type-level regression tests. These never run — Vitest compiles them as
 * part of the test suite, so any breakage here surfaces as a test
 * failure.
 *
 * The point is to lock the *shape* of every public contract that other
 * @graphorin/* packages will type their parameters against. Any source-
 * level rename / signature change that breaks one of these surfaces will
 * also break every downstream consumer; better to catch it here.
 */

import { describe, expectTypeOf, it } from 'vitest';

import type {
  AISpan,
  AuthTokenStore,
  CheckpointStore,
  EmbedderProvider,
  EvalScorer,
  LocalProviderTrust,
  Logger,
  MemoryStore,
  ModelHint,
  ModelSpec,
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  ReasoningContract,
  ReasoningRetention,
  RedactionValidator,
  Sandbox,
  SecretsStore,
  SecretValue,
  SessionStore,
  TokenCounter,
  Tool,
  ToolExecutionContext,
  ToolReturn,
  Tracer,
  TriggerStore,
} from '../src/contracts/index.js';
import type {
  AgentEvent,
  EntityRole,
  Episode,
  Fact,
  GraphEntity,
  MemoryKind,
  MemoryProvenance,
  MemorySearchOptions,
  MemoryStatus,
  Message,
  RunContext,
  RunState,
  Sensitivity,
  SessionScope,
  StopCondition,
  ToolError,
  Usage,
  WorkflowEvent,
} from '../src/types/index.js';

describe('public type surface', () => {
  it('Provider.stream returns AsyncIterable<ProviderEvent>', () => {
    expectTypeOf<Provider['stream']>().parameter(0).toEqualTypeOf<ProviderRequest>();
    expectTypeOf<ReturnType<Provider['stream']>>().toEqualTypeOf<AsyncIterable<ProviderEvent>>();
    expectTypeOf<ReturnType<Provider['generate']>>().toEqualTypeOf<Promise<ProviderResponse>>();
  });

  it('MemoryStore exposes the six tier sub-namespaces', () => {
    expectTypeOf<MemoryStore['working']>().toBeObject();
    expectTypeOf<MemoryStore['session']>().toBeObject();
    expectTypeOf<MemoryStore['episodic']>().toBeObject();
    expectTypeOf<MemoryStore['semantic']>().toBeObject();
    expectTypeOf<MemoryStore['procedural']>().toBeObject();
    expectTypeOf<MemoryStore['shared']>().toBeObject();
  });

  it('CheckpointStore.list returns AsyncIterable', () => {
    expectTypeOf<ReturnType<CheckpointStore['list']>>().toMatchTypeOf<AsyncIterable<unknown>>();
  });

  it('SecretsStore.require returns Promise<SecretValue>', () => {
    expectTypeOf<ReturnType<SecretsStore['require']>>().toEqualTypeOf<Promise<SecretValue>>();
  });

  it('Tracer.span returns the user fn return value as a Promise', () => {
    type SpanFn = Tracer['span'];
    type CallResult = SpanFn extends (
      opts: infer _O,
      fn: (s: infer _S) => infer R | Promise<infer R>,
    ) => infer Out
      ? [Out, R]
      : never;
    expectTypeOf<CallResult[0]>().toEqualTypeOf<Promise<unknown>>();
    expectTypeOf<AISpan>().toBeObject();
  });

  it('TokenCounter.count operates on Message arrays', () => {
    expectTypeOf<TokenCounter['count']>().parameter(0).toEqualTypeOf<ReadonlyArray<Message>>();
  });

  it('EmbedderProvider.embed returns Float32Array vectors', () => {
    expectTypeOf<ReturnType<EmbedderProvider['embed']>>().toEqualTypeOf<
      Promise<ReadonlyArray<Float32Array>>
    >();
  });

  it('Sandbox / SessionStore / TriggerStore / AuthTokenStore are objects', () => {
    expectTypeOf<Sandbox>().toBeObject();
    expectTypeOf<SessionStore>().toBeObject();
    expectTypeOf<TriggerStore>().toBeObject();
    expectTypeOf<AuthTokenStore>().toBeObject();
    expectTypeOf<EvalScorer>().toBeObject();
    expectTypeOf<RedactionValidator>().toBeObject();
  });

  it('AgentEvent is a discriminated union with literal type fields', () => {
    type Types = AgentEvent['type'];
    expectTypeOf<Types>().toMatchTypeOf<string>();
  });

  it('WorkflowEvent is generic over TState', () => {
    type Variants = WorkflowEvent<{ x: number }>['type'];
    expectTypeOf<Variants>().toMatchTypeOf<string>();
  });

  it('SessionScope.userId is required', () => {
    expectTypeOf<SessionScope['userId']>().toEqualTypeOf<string>();
  });

  it('Sensitivity is a fixed string literal union', () => {
    expectTypeOf<Sensitivity>().toEqualTypeOf<'public' | 'internal' | 'secret'>();
  });

  it('MemoryProvenance + MemoryStatus are fixed unions (P1-4)', () => {
    expectTypeOf<MemoryProvenance>().toEqualTypeOf<
      'user' | 'tool' | 'extraction' | 'reflection' | 'imported'
    >();
    expectTypeOf<MemoryStatus>().toEqualTypeOf<'active' | 'quarantined'>();
  });

  it('Fact + Episode carry optional provenance + status; MemorySearchOptions gates quarantine (P1-4)', () => {
    expectTypeOf<Fact['provenance']>().toEqualTypeOf<MemoryProvenance | undefined>();
    expectTypeOf<Fact['status']>().toEqualTypeOf<MemoryStatus | undefined>();
    expectTypeOf<Episode['provenance']>().toEqualTypeOf<MemoryProvenance | undefined>();
    expectTypeOf<Episode['status']>().toEqualTypeOf<MemoryStatus | undefined>();
    expectTypeOf<MemorySearchOptions['includeQuarantined']>().toEqualTypeOf<boolean | undefined>();
  });

  it('Fact carries the optional s/p/o triple + GraphEntity is the canonical entity (P2-1)', () => {
    expectTypeOf<Fact['subject']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Fact['predicate']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<Fact['object']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<EntityRole>().toEqualTypeOf<'subject' | 'object'>();
    expectTypeOf<GraphEntity['id']>().toEqualTypeOf<string>();
    expectTypeOf<GraphEntity['normalizedName']>().toEqualTypeOf<string>();
    expectTypeOf<GraphEntity['mergedInto']>().toEqualTypeOf<string | undefined>();
  });

  it('MemoryKind covers exactly the six tiers', () => {
    expectTypeOf<MemoryKind>().toEqualTypeOf<
      'working' | 'session' | 'episodic' | 'semantic' | 'procedural' | 'shared'
    >();
  });

  it('RunContext exposes streaming-friendly fields', () => {
    expectTypeOf<RunContext>().toHaveProperty('signal').toEqualTypeOf<AbortSignal>();
    expectTypeOf<RunContext>().toHaveProperty('runId').toEqualTypeOf<string>();
    expectTypeOf<RunState>().toHaveProperty('messages');
  });

  it('StopCondition.check returns a boolean', () => {
    expectTypeOf<StopCondition['check']>().parameter(0).toEqualTypeOf<RunState>();
    expectTypeOf<ReturnType<StopCondition['check']>>().toEqualTypeOf<boolean>();
  });

  it('ToolError is a typed kind union', () => {
    expectTypeOf<ToolError['kind']>().toMatchTypeOf<string>();
  });

  it('Usage carries token totals', () => {
    expectTypeOf<Usage>().toHaveProperty('totalTokens').toEqualTypeOf<number>();
  });

  it('Tool is generic over input / output / deps', () => {
    type MyTool = Tool<{ a: number }, { b: string }, { db: 'pg' }>;
    expectTypeOf<MyTool['name']>().toEqualTypeOf<string>();
    expectTypeOf<MyTool['description']>().toEqualTypeOf<string>();
    expectTypeOf<MyTool>().toHaveProperty('execute');
    expectTypeOf<ToolReturn<{ b: string }>>().toHaveProperty('output');
  });

  it('ToolExecutionContext carries tracer / logger / signal', () => {
    expectTypeOf<ToolExecutionContext>().toHaveProperty('tracer').toEqualTypeOf<Tracer>();
    expectTypeOf<ToolExecutionContext>().toHaveProperty('logger').toEqualTypeOf<Logger>();
    expectTypeOf<ToolExecutionContext>().toHaveProperty('signal').toEqualTypeOf<AbortSignal>();
    expectTypeOf<ToolExecutionContext>().toHaveProperty('toolCallId').toEqualTypeOf<string>();
  });

  it('SecretValue declares all the leakage barriers required by Phase 02', () => {
    expectTypeOf<SecretValue>().toHaveProperty('use');
    expectTypeOf<SecretValue>().toHaveProperty('useBuffer');
    expectTypeOf<SecretValue>().toHaveProperty('reveal');
    expectTypeOf<SecretValue>().toHaveProperty('dispose');
    expectTypeOf<SecretValue>().toHaveProperty('toJSON');
    // [Symbol.toPrimitive], [SECRET_VALUE_BRAND] and the
    // [Symbol.for('nodejs.util.inspect.custom')] entry are well-known
    // symbol-keyed properties — toHaveProperty cannot type-check those;
    // the in-source `interface SecretValue { ... }` declaration carries
    // the structural lock.
  });

  it('ModelHint locks the cost-tier vocabulary triple', () => {
    expectTypeOf<ModelHint>().toEqualTypeOf<'fast' | 'balanced' | 'smart'>();
  });

  it('LocalProviderTrust enumerates the four-tier classifier', () => {
    expectTypeOf<LocalProviderTrust>().toEqualTypeOf<
      'loopback' | 'private' | 'public-tls' | 'public-cleartext'
    >();
  });

  it('ReasoningRetention enumerates the three-arm policy', () => {
    expectTypeOf<ReasoningRetention>().toEqualTypeOf<
      'strip' | 'pass-through-claude' | 'pass-through-all'
    >();
  });

  it('ReasoningContract enumerates the three-arm capability declaration', () => {
    expectTypeOf<ReasoningContract>().toEqualTypeOf<
      'hidden' | 'round-trip-required' | 'optional'
    >();
  });

  it('ModelSpec admits both bare provider and provider+model declarations', () => {
    type Bare = Extract<ModelSpec, { name: string }>;
    expectTypeOf<Bare['name']>().toEqualTypeOf<string>();
    expectTypeOf<Bare['modelId']>().toEqualTypeOf<string>();
    type WithModel = Extract<ModelSpec, { provider: unknown }>;
    expectTypeOf<WithModel['model']>().toEqualTypeOf<string>();
  });

  it('ProviderRequest carries the optional reasoning-retention override', () => {
    expectTypeOf<ProviderRequest['reasoningRetention']>().toEqualTypeOf<
      ReasoningRetention | undefined
    >();
  });
});
