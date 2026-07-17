---
'@graphorin/server': minor
---

BREAKING: `metrics.requireAuth` now defaults to `true` - `GET /v1/metrics` requires a verified token with the `admin:metrics:read` scope out of the box (the exposition leaks operational intel: trigger ids in labels, consolidator budgets). Give your Prometheus scrape job a token (`authorization.credentials_file`) or restore the old behaviour explicitly with `metrics: { requireAuth: false }` for trusted-network scrapes; the existing non-loopback WARN still fires on the opt-out.
