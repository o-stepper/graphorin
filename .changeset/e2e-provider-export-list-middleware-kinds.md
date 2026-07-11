---
'@graphorin/provider': minor
---

Export `listMiddlewareKinds` from the package barrel (e2e 2026-07-11 minor finding): the `@stable`-documented chain walker existed in `src/middleware/compose.ts` but was omitted from the middleware barrel, so it never reached the built dist and `import { listMiddlewareKinds } from '@graphorin/provider'` failed while its siblings `getMiddlewareKind` and `providerHasMiddleware` worked. The function is now re-exported alongside them; a regression test pins the public surface and walks a composed `withTracing` + `withRetry` chain through the public import.
