# Kubernetes deployment template

A `deployment.yaml` manifest set (ConfigMap + Deployment + Service, with a
"restricted" Pod Security profile) for the **Graphorin standalone server**.
This is a deployment *template*, not a runnable example app.

## Prerequisites

- An image built and pushed from [`../docker/Dockerfile`](../docker), tagged
  e.g. `ghcr.io/<org>/graphorin:0.14.0`. There is no official published image;
  the operator builds it (CI only smoke-builds the Dockerfile).
- A `Secret` named `graphorin-secrets` in the namespace with keys `pepper`,
  `db-passphrase`, `audit-passphrase`.
- A `PVC` named `graphorin-data` for the SQLite store.

## Apply

```bash
kubectl create namespace graphorin
kubectl apply -n graphorin -f examples/k8s/deployment.yaml
```

The `securityContext` mirrors the framework's process-hardening discipline and
the Pod Security Standards "restricted" profile (non-root, read-only root FS,
dropped capabilities). Adjust the image reference, resources, and storage class
for your cluster.

**`trustProxy: true` caution.** The template config trusts `X-Forwarded-*`
headers because the ClusterIP Service assumes a trusted ingress in front that
OVERWRITES them. If clients can reach the pod directly (NodePort,
LoadBalancer, `kubectl port-forward` exposed to others), set `trustProxy` to
`false` - otherwise any client can spoof its source IP past rate limits and
audit logs.

See [Standalone server](../../documentation/guide/standalone-server.md),
[Storage backends](../../documentation/guide/storage.md), and
[Secrets](../../documentation/guide/secrets.md). Related templates:
[`../docker`](../docker), [`../systemd`](../systemd),
[`../github-actions`](../github-actions).
