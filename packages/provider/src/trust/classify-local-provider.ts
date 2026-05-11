/**
 * Shared trust classifier for every `baseUrl`-driven local-LLM
 * adapter. Emits one of four discriminant values per
 * {@link LocalProviderTrust}:
 *
 * - `'loopback'`         — the URL points at the same host as the
 *   running process (`localhost`, `127.0.0.0/8`, `::1`, or a
 *   `unix:///path` socket).
 * - `'private'`          — RFC 1918 / RFC 6598 / link-local /
 *   multicast-DNS-style hostname.
 * - `'public-tls'`       — public host AND `https://`.
 * - `'public-cleartext'` — public host AND `http://`.
 *
 * The dispatcher is a pure function: it sees the URL string and
 * nothing else. DNS resolution is deferred to the adapter layer
 * (cross-cut DEC-149 § DNS-rebinding mitigation), where the resolved
 * IP is re-classified on TTL expiry and the lowest-trust value wins.
 *
 * @packageDocumentation
 */

import type { LocalProviderTrust, Sensitivity } from '@graphorin/core';

/**
 * Result of {@link classifyLocalProvider}. Carries both the trust
 * class and a short human-readable reason for the WARN log produced
 * by the consuming adapter.
 *
 * @stable
 */
export interface LocalProviderClassification {
  readonly trust: LocalProviderTrust;
  /** One-line reason — `'loopback IP 127.0.0.1'`, `'public IP 5.6.7.8 over HTTPS'`, ... */
  readonly reason: string;
  /** Default `acceptsSensitivity` for this trust class. */
  readonly acceptsSensitivity: ReadonlyArray<Sensitivity>;
}

/**
 * Per-tier default sensitivity envelope. Lifted to a constant so
 * downstream code (and tests) can import it without re-deriving the
 * matrix.
 *
 * @stable
 */
export const SENSITIVITY_DEFAULTS_PER_TRUST: Readonly<
  Record<LocalProviderTrust, ReadonlyArray<Sensitivity>>
> = Object.freeze({
  loopback: Object.freeze(['public', 'internal', 'secret'] as const),
  private: Object.freeze(['public', 'internal'] as const),
  'public-tls': Object.freeze(['public'] as const),
  'public-cleartext': Object.freeze([] as const),
});

/**
 * Classify a URL string into one of the four {@link LocalProviderTrust}
 * tiers. Throws `TypeError` if the URL is unparseable so adapters
 * fail fast at construction time (programming error; not a runtime
 * fault).
 *
 * @stable
 */
export function classifyLocalProvider(baseUrl: string): LocalProviderClassification {
  if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
    throw new TypeError('classifyLocalProvider: baseUrl must be a non-empty string.');
  }

  if (baseUrl.startsWith('unix://') || baseUrl.startsWith('unix:/')) {
    return {
      trust: 'loopback',
      reason: `unix domain socket (${baseUrl})`,
      acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.loopback,
    };
  }

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch (cause) {
    throw new TypeError(`classifyLocalProvider: baseUrl '${baseUrl}' is not a valid URL.`, {
      cause,
    });
  }

  const protocol = url.protocol;
  const hostname = url.hostname;
  if (protocol !== 'http:' && protocol !== 'https:') {
    // Custom protocols (e.g. ws://) are out of scope for the four
    // bundled adapters; treat as private so a downstream WARN fires.
    return {
      trust: 'private',
      reason: `non-HTTP protocol '${protocol}'`,
      acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.private,
    };
  }

  const ipv4 = parseIpv4(hostname);
  if (ipv4 !== null) {
    if (isLoopbackIpv4(ipv4)) {
      return {
        trust: 'loopback',
        reason: `loopback IPv4 ${hostname}`,
        acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.loopback,
      };
    }
    if (isPrivateIpv4(ipv4)) {
      return {
        trust: 'private',
        reason: `private IPv4 ${hostname}`,
        acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.private,
      };
    }
    return classifyPublic(protocol, `public IPv4 ${hostname}`);
  }

  if (isIpv6(hostname)) {
    if (isLoopbackIpv6(hostname)) {
      return {
        trust: 'loopback',
        reason: `loopback IPv6 ${hostname}`,
        acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.loopback,
      };
    }
    if (isPrivateIpv6(hostname)) {
      return {
        trust: 'private',
        reason: `private IPv6 ${hostname}`,
        acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.private,
      };
    }
    return classifyPublic(protocol, `public IPv6 ${hostname}`);
  }

  if (isLoopbackHostname(hostname)) {
    return {
      trust: 'loopback',
      reason: `loopback hostname '${hostname}'`,
      acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.loopback,
    };
  }
  if (isPrivateHostnameSuffix(hostname)) {
    return {
      trust: 'private',
      reason: `private hostname suffix '${hostname}'`,
      acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.private,
    };
  }

  return classifyPublic(protocol, `public hostname '${hostname}'`);
}

function classifyPublic(protocol: string, reason: string): LocalProviderClassification {
  if (protocol === 'https:') {
    return {
      trust: 'public-tls',
      reason: `${reason} over HTTPS`,
      acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST['public-tls'],
    };
  }
  return {
    trust: 'public-cleartext',
    reason: `${reason} over HTTP`,
    acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST['public-cleartext'],
  };
}

function parseIpv4(hostname: string): [number, number, number, number] | null {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (match === null) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  const c = Number(match[3]);
  const d = Number(match[4]);
  if (a > 255 || b > 255 || c > 255 || d > 255) return null;
  return [a, b, c, d];
}

function isLoopbackIpv4(ip: readonly [number, number, number, number]): boolean {
  return ip[0] === 127;
}

function isPrivateIpv4(ip: readonly [number, number, number, number]): boolean {
  // RFC 1918
  if (ip[0] === 10) return true;
  if (ip[0] === 192 && ip[1] === 168) return true;
  if (ip[0] === 172 && ip[1] >= 16 && ip[1] <= 31) return true;
  // RFC 6598 (CGNAT — Tailscale-friendly)
  if (ip[0] === 100 && ip[1] >= 64 && ip[1] <= 127) return true;
  // Link-local
  if (ip[0] === 169 && ip[1] === 254) return true;
  return false;
}

function isIpv6(hostname: string): boolean {
  const stripped =
    hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
  return stripped.includes(':');
}

function normaliseIpv6(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

function isLoopbackIpv6(hostname: string): boolean {
  const norm = normaliseIpv6(hostname).toLowerCase();
  return norm === '::1' || norm === '0:0:0:0:0:0:0:1';
}

function isPrivateIpv6(hostname: string): boolean {
  const norm = normaliseIpv6(hostname).toLowerCase();
  // Link-local fe80::/10
  if (
    norm.startsWith('fe80:') ||
    norm.startsWith('fe8') ||
    norm.startsWith('fe9') ||
    norm.startsWith('fea') ||
    norm.startsWith('feb')
  ) {
    return true;
  }
  // Unique local fc00::/7 (covers fc:: and fd::)
  if (norm.startsWith('fc') || norm.startsWith('fd')) return true;
  return false;
}

function isLoopbackHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === 'localhost' || lower === 'localhost.';
}

function isPrivateHostnameSuffix(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower.endsWith('.local') ||
    lower.endsWith('.lan') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.home.arpa') ||
    lower.endsWith('.intranet')
  );
}

/**
 * Permanent loopback classification used by in-process adapters
 * (e.g. the `llamaCppNodeAdapter` companion package). Adapters that
 * have no `baseUrl` declare this directly to make the source-of-truth
 * symmetry obvious.
 *
 * @stable
 */
export const PERMANENT_LOOPBACK_CLASSIFICATION: LocalProviderClassification = Object.freeze({
  trust: 'loopback',
  reason: 'in-process adapter (no baseUrl)',
  acceptsSensitivity: SENSITIVITY_DEFAULTS_PER_TRUST.loopback,
});
