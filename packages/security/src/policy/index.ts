/**
 * Declarative tool-argument policies + Rule-of-Two capability profiles
 * (D4). Pure decision engines consumed by the tool executor's policy
 * hook and the agent runtime's capability floor.
 *
 * @packageDocumentation
 */

export {
  buildRuleOfTwoPolicy,
  evaluatePermissionDecision,
  evaluateToolArgumentPolicy,
  isToolDeniedByName,
  type NameDenialDecision,
  type PermissionDecision,
  type PermissionEffect,
  type PolicySideEffectClass,
  type RuleOfTwoCompilation,
  type RuleOfTwoProfile,
  type ToolArgumentPolicy,
  type ToolArgumentRule,
  type ToolCallFacts,
  type ToolPolicyDecision,
  type ToolRuleEffect,
  type TrifectaLeg,
} from './tool-argument-policy.js';
