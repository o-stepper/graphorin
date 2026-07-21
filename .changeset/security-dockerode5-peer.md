---
'@graphorin/security': patch
---

Twelfth external deep retest, P2: the `dockerode` peer range now accepts v5 (`^4.0.0 || ^5.0.0`), and the workspace tests the Docker sandbox against 5.0.1 (stub suite plus the live-daemon leg). dockerode 5 drops the `uuid` dependency entirely, which removes the moderate `uuid@10` advisory chain from consumer installs; the security guide documents the recommendation and the override for consumers staying on 4.x.
