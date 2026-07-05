---
'@graphorin/observability': minor
---

New imperative pattern `untrusted-content-delimiter-injection` (W-030 defense-in-depth): fabricated `<<<untrusted_content` / `<<</untrusted_content` envelope delimiters inside untrusted content are now detected and stripped by the `detect-and-strip*` policies, giving an audit signal (`tool.inbound.sanitization.hit`) on envelope break-out attempts. The regex is scoped strictly to the envelope markers - bare `<<<` / `>>>` runs (Python doctest, shell heredoc) never match. Minor bump per the catalogue's stability rule: existing deployments may see new counter increments.
