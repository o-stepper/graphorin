---
'@graphorin/security': patch
'@graphorin/sessions': patch
---

Fourteenth deep retest P2: `DockerSandbox` no longer inherits the image's default user (root in most bases) - containers now run as `10001:10001` by default with the `/work` tmpfs owned by that uid, plus a PID ceiling (`pidsLimit`, default 128) and a CPU allowance (`cpus`, default 1) so hostile code cannot fork or busy-loop until the external timeout; all three are `createDockerSandbox` options, and live negative tests prove the uid, rootfs/network denials, and the pids cgroup ceiling on a real daemon. AES-GCM call sites (sessions export, encrypted-file secret store/resolver) now pass an explicit `authTagLength: 16` - behaviour is unchanged (both formats already sliced exactly 16 tag bytes); the invariant is now self-documenting and scanner-quiet.
