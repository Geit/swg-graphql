import { readFileSync } from 'fs';
import path from 'path';

import { PubSubEngine } from 'graphql-subscriptions';

import { PLANET_WATCHER_IDLE_GRACE_MS } from '../config';

import PlanetWatcher from './PlanetWatcher';

export type PooledPlanetWatcher = Pick<
  PlanetWatcher,
  'connect' | 'disconnect' | 'reset' | 'replayTopic' | 'onDataReceived' | 'onConnectionLost'
>;

export type PlanetWatcherFactory = (planet: string) => PooledPlanetWatcher;

export interface PlanetWatcherPoolOptions {
  idleGraceMs?: number;
  /** Doubles on each failed attempt, up to reconnectMaxDelayMs */
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
}

interface PoolEntry {
  count: number;
  watcher: PooledPlanetWatcher;
  idleTimer: ReturnType<typeof setTimeout> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
}

interface ConnectionDetails {
  host: string;
  port: number;
}

/**
 * Reference counts one PlanetWatcher per planet. Idle connections are kept for a grace period. Dropped connections
 * reconnect with backoff while subscribed, or are removed if idle.
 */
export class PlanetWatcherPool {
  private entries = new Map<string, PoolEntry>();
  private readonly idleGraceMs: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;

  constructor(
    private readonly factory: PlanetWatcherFactory,
    options: PlanetWatcherPoolOptions = {}
  ) {
    this.idleGraceMs = options.idleGraceMs ?? PLANET_WATCHER_IDLE_GRACE_MS;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 1000;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 30 * 1000;
  }

  /**
   * @returns `existing` is true when the watcher may have cached state to replay
   */
  acquire(planet: string): { watcher: PooledPlanetWatcher; existing: boolean } {
    const entry = this.entries.get(planet);

    if (entry) {
      entry.count += 1;

      if (entry.idleTimer) {
        clearTimeout(entry.idleTimer);
        entry.idleTimer = null;
        console.log(`[PlanetWatcherPool] Reusing idle connection for ${planet}`);
      }

      return { watcher: entry.watcher, existing: true };
    }

    const watcher = this.factory(planet);
    const newEntry: PoolEntry = { count: 1, watcher, idleTimer: null, reconnectTimer: null, reconnectAttempts: 0 };

    // Only reset the backoff once data flows, so a server that accepts and immediately closes still backs off
    watcher.onDataReceived = () => {
      newEntry.reconnectAttempts = 0;
    };
    watcher.onConnectionLost = () => this.handleConnectionLost(planet, watcher);

    this.entries.set(planet, newEntry);

    try {
      watcher.connect();
    } catch (err) {
      this.entries.delete(planet);
      throw err;
    }

    return { watcher, existing: false };
  }

  release(planet: string) {
    const entry = this.entries.get(planet);
    if (!entry || entry.count <= 0) return;

    entry.count -= 1;

    if (entry.count === 0) {
      entry.idleTimer = setTimeout(() => {
        console.log(`[PlanetWatcherPool] No subscribers for ${planet} in ${this.idleGraceMs} ms, disconnecting`);
        this.destroy(planet);
      }, this.idleGraceMs);
    }
  }

  getSubscriberCount(planet: string) {
    return this.entries.get(planet)?.count ?? 0;
  }

  has(planet: string) {
    return this.entries.has(planet);
  }

  private handleConnectionLost(planet: string, watcher: PooledPlanetWatcher) {
    const entry = this.entries.get(planet);

    if (entry?.watcher !== watcher) return;

    if (entry.count === 0) {
      this.destroy(planet);
      return;
    }

    if (entry.reconnectTimer) return;

    const delay = Math.min(this.reconnectBaseDelayMs * 2 ** entry.reconnectAttempts, this.reconnectMaxDelayMs);
    entry.reconnectAttempts += 1;

    console.log(`[PlanetWatcherPool] Reconnecting to ${planet} in ${delay} ms (attempt ${entry.reconnectAttempts})`);

    entry.reconnectTimer = setTimeout(() => {
      entry.reconnectTimer = null;
      // The planet server resends its full state on connect
      entry.watcher.reset();
      entry.watcher.connect();
    }, delay);
  }

  private destroy(planet: string) {
    const entry = this.entries.get(planet);
    if (!entry) return;

    if (entry.idleTimer) clearTimeout(entry.idleTimer);
    if (entry.reconnectTimer) clearTimeout(entry.reconnectTimer);
    entry.idleTimer = null;
    entry.reconnectTimer = null;

    entry.watcher.onDataReceived = undefined;
    entry.watcher.onConnectionLost = undefined;
    entry.watcher.disconnect();

    this.entries.delete(planet);
  }
}

export const createPlanetWatcherFactory =
  (pubsub: PubSubEngine): PlanetWatcherFactory =>
  planet => {
    // Reload the config each time, individual server layout can change each time
    const serverConfigFile = path.join(__dirname, '../../data/planet-servers.json');
    const allServerDetails: Record<string, ConnectionDetails> = JSON.parse(
      readFileSync(serverConfigFile, { encoding: 'ascii' })
    );

    const serverDetails = allServerDetails[planet];
    if (!serverDetails) {
      throw new Error(`No planet server configured for '${planet}'`);
    }

    return new PlanetWatcher(serverDetails.host, serverDetails.port, planet, pubsub);
  };
