/**
 * `@graphorin/server/channels` - B1.6 lifecycle adapter for a
 * channel gateway (structural typing over `@graphorin/channels`; no
 * package dependency).
 *
 * @packageDocumentation
 */

export {
  type ChannelGatewayLike,
  type ChannelGatewayStatusLike,
  type ChannelStatusLike,
  type ChannelsDaemon,
  type CreateChannelsDaemonOptions,
  createChannelsDaemon,
} from './daemon.js';
