[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / dataflow

# dataflow

Provenance / taint-based data-flow policy for `@graphorin/security`
(P1-3, toward CaMeL).

Enforces data-flow rules at a tool-execution boundary using the
provenance Graphorin already tracks (trust class + source + sensitivity)
rather than pattern scans alone, defusing the lethal trifecta. Pure and
I/O-free; the enforcement point (the `@graphorin/tools` executor, via
the agent runtime) threads a per-run [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md) through and acts
on the [DataFlowPolicy](/api/@graphorin/security/interfaces/DataFlowPolicy.md) verdict.

## References

### ArgsTaintProbe

Re-exports [ArgsTaintProbe](/api/@graphorin/security/interfaces/ArgsTaintProbe.md)

***

### createDataFlowPolicy

Re-exports [createDataFlowPolicy](/api/@graphorin/security/functions/createDataFlowPolicy.md)

***

### createTaintLedger

Re-exports [createTaintLedger](/api/@graphorin/security/functions/createTaintLedger.md)

***

### DataFlowDecision

Re-exports [DataFlowDecision](/api/@graphorin/security/type-aliases/DataFlowDecision.md)

***

### DataFlowEvaluation

Re-exports [DataFlowEvaluation](/api/@graphorin/security/interfaces/DataFlowEvaluation.md)

***

### DataFlowFinding

Re-exports [DataFlowFinding](/api/@graphorin/security/interfaces/DataFlowFinding.md)

***

### DataFlowMode

Re-exports [DataFlowMode](/api/@graphorin/security/type-aliases/DataFlowMode.md)

***

### DataFlowPolicy

Re-exports [DataFlowPolicy](/api/@graphorin/security/interfaces/DataFlowPolicy.md)

***

### DataFlowPolicyConfig

Re-exports [DataFlowPolicyConfig](/api/@graphorin/security/interfaces/DataFlowPolicyConfig.md)

***

### deriveTaintLabel

Re-exports [deriveTaintLabel](/api/@graphorin/security/functions/deriveTaintLabel.md)

***

### TaintFlowKind

Re-exports [TaintFlowKind](/api/@graphorin/security/type-aliases/TaintFlowKind.md)

***

### TaintLabel

Re-exports [TaintLabel](/api/@graphorin/security/interfaces/TaintLabel.md)

***

### TaintLedger

Re-exports [TaintLedger](/api/@graphorin/security/interfaces/TaintLedger.md)
