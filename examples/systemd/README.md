# systemd deployment template

A hardened `graphorin.service` unit for running the **Graphorin standalone
server** on a Linux host. This is a deployment *template*, not a runnable
example app.

## Install

```bash
sudo cp examples/systemd/graphorin.service /etc/systemd/system/graphorin.service
sudo mkdir -p /etc/graphorin
sudo cp examples/systemd/config.example.json /etc/graphorin/config.json
sudo systemctl daemon-reload
sudo systemctl enable --now graphorin.service
sudo systemctl status graphorin.service
```

The config file must be **JSON** (or a `.js`/`.mjs` module) - the loader does
not read TOML. Edit `/etc/graphorin/config.json` before starting: the example
enables token auth + storage encryption and expects the referenced secret
files (`/etc/graphorin/pepper`, `/etc/graphorin/db-passphrase`,
`/etc/graphorin/audit-passphrase`) to exist and be readable only by the
`graphorin` user. `StateDirectory=graphorin` has systemd create
`/var/lib/graphorin` (the DB lives there) owned by the service user. Note
there is no reload support - `systemctl restart graphorin` re-reads the
config (SIGHUP would kill the daemon, so the unit defines no `ExecReload=`).

## Verify hardening

```bash
systemd-analyze security graphorin.service   # target score < 5 ("OK")
```

The unit ships with `User=graphorin` (the framework refuses to run as root on
Linux/macOS) plus the usual sandboxing directives. Create the `graphorin`
service user and a data directory it owns, and provide secrets via
`LoadCredential=` or an `EnvironmentFile=` referencing a secret manager rather
than inline values.

See [Standalone server](../../documentation/guide/standalone-server.md) and
[Security](../../documentation/guide/security.md). Related templates:
[`../docker`](../docker), [`../k8s`](../k8s),
[`../github-actions`](../github-actions).
