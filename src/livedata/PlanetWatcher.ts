import net from 'net';

import { PubSubEngine } from 'graphql-subscriptions';

import {
  PLANET_WATCHER_FLUSH_INTERVAL_MS,
  PLANET_WATCHER_FLUSH_MAX_ITEMS,
  PLANET_WATCHER_REPLAY_CHUNK_SIZE,
} from '../config';

import { parse, SBMessageTypes } from './messages';
import { FrameEndData } from './messages/FrameEndMessage';
import { GameServerStatusData } from './messages/GameServerStatus';
import { PlanetNodeStatusData } from './messages/PlanetNodeStatusMessage';
import { PlanetObjectStatus } from './messages/PlanetObjectStatusMessage';
import { objectUpdateByteSize } from './planetWatcherMappers';

const PLANET_CELL_WIDTH = 100;
const PLANET_CELL_AXIS_COUNT = 160;

const DUMP_CHECK_INTERVAL_MS = 500;
const DUMP_QUIET_NEW_OBJECTS = 100;
const DUMP_QUIET_WINDOWS = 2;
// An empty planet never produces a dump
const DUMP_MAX_WAIT_MS = 10 * 1000;

// Hold back reconnect removals while the new dump may still be arriving
const STALE_REMOVAL_MIN_RATIO = 0.9;
const STALE_REMOVAL_MAX_WAIT_MS = 30 * 1000;

// Armed on first data, as planets without game servers can be silent
const SOCKET_IDLE_TIMEOUT_MS = 60 * 1000;
const SOCKET_KEEPALIVE_MS = 30 * 1000;

const MAX_MESSAGE_SIZE = 16 * 1024 * 1024;
const PARSE_ERROR_LOG_INTERVAL_MS = 10 * 1000;

export interface PlanetWatcherOptions {
  flushIntervalMs?: number;
  flushMaxItems?: number;
  replayChunkSize?: number;
}

export const planetTopic = (topic: string, planet: string) => `${topic}:${planet}`;

const yieldToEventLoop = () => new Promise<void>(resolve => setImmediate(resolve));

class PlanetWatcher {
  sceneName: string;
  host: string;
  port: number;
  connection: net.Socket | null = null;
  latestObjectStatuses: Map<bigint, PlanetObjectStatus>;
  latestNodeStatuses: Map<number, PlanetNodeStatusData>;
  latestGameServerStatus: Map<number, GameServerStatusData>;
  pubsub: PubSubEngine;

  /** Called once per connection, when the first data arrives */
  onDataReceived?: () => void;
  /** Called when the socket closes without disconnect() */
  onConnectionLost?: () => void;

  private queuedMessages = Buffer.alloc(0);
  private receivedData = false;
  private parseErrors = 0;
  private lastParseErrorLogAt = 0;

  private readonly flushIntervalMs: number;
  private readonly flushMaxItems: number;
  private readonly replayChunkSize: number;

  // Keyed by networkId so the latest status per object wins within a flush
  private pendingObjectStatuses = new Map<bigint, PlanetObjectStatus>();
  private pendingFrameEnds: FrameEndData[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  // Bumped when cached state is discarded, aborting in-flight replays
  private generation = 0;

  // State from before a reconnect. Anything the new dump does not contain is removed from clients.
  private staleObjectStatuses = new Map<bigint, PlanetObjectStatus>();
  private staleNodeStatuses = new Map<number, PlanetNodeStatusData>();
  private staleGameServerStatuses = new Map<number, GameServerStatusData>();

  private connectStartedAt = 0;
  private connectedAt = 0;
  private dumpCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private dumpComplete = false;
  private dumpStarted = false;
  private dumpQuietWindows = 0;
  private dumpWindowNewObjects = 0;
  private dumpLastNewObjectAt = 0;
  private dumpObjectMessages = 0;
  private dumpObjectBytes = 0;

  constructor(host: string, port: number, sceneName: string, pubsub: PubSubEngine, options: PlanetWatcherOptions = {}) {
    this.host = host;
    this.port = port;
    this.latestObjectStatuses = new Map();
    this.latestNodeStatuses = new Map();
    this.latestGameServerStatus = new Map();
    this.pubsub = pubsub;
    this.sceneName = sceneName;
    this.flushIntervalMs = options.flushIntervalMs ?? PLANET_WATCHER_FLUSH_INTERVAL_MS;
    this.flushMaxItems = options.flushMaxItems ?? PLANET_WATCHER_FLUSH_MAX_ITEMS;
    this.replayChunkSize = options.replayChunkSize ?? PLANET_WATCHER_REPLAY_CHUNK_SIZE;
  }

  connect() {
    this.closeSocket();

    const socket = net.connect(this.port, this.host);
    this.connection = socket;
    this.receivedData = false;
    this.startDumpTracking();

    socket.setKeepAlive(true, SOCKET_KEEPALIVE_MS);
    socket.on('timeout', () => {
      console.warn(`[PlanetWatcher] No data from Planet Server for ${this.sceneName} in ${SOCKET_IDLE_TIMEOUT_MS} ms`);
      socket.destroy();
    });

    socket.on('connect', this.onConnect.bind(this));
    socket.on('data', this.onData.bind(this));
    socket.on('end', this.onEnd.bind(this));
    socket.on('error', err => {
      console.error(`[PlanetWatcher] Socket error for ${this.sceneName}: ${err.message}`);
    });
    socket.on('close', () => {
      // Ignore sockets we have replaced or torn down
      if (this.connection !== socket) return;

      this.connection = null;
      this.stopTimers();
      console.warn(`[PlanetWatcher] Lost connection to Planet Server for ${this.sceneName}`);
      this.onConnectionLost?.();
    });

    console.log(`[PlanetWatcher] Connecting to Planet Server for ${this.sceneName} on ${this.host}:${this.port}`);
  }

  disconnect() {
    this.closeSocket();
    this.stopTimers();
    this.pendingObjectStatuses.clear();
    this.pendingFrameEnds = [];
    this.staleObjectStatuses.clear();
    this.staleNodeStatuses.clear();
    this.staleGameServerStatuses.clear();
    this.generation += 1;

    console.log(`[PlanetWatcher] Disconnected from Planet Server for ${this.sceneName}`);
  }

  reset() {
    this.latestObjectStatuses.forEach((status, networkId) => this.staleObjectStatuses.set(networkId, status));
    this.latestNodeStatuses.forEach((status, cellIndex) => this.staleNodeStatuses.set(cellIndex, status));
    this.latestGameServerStatus.forEach((status, serverId) => this.staleGameServerStatuses.set(serverId, status));

    this.latestObjectStatuses.clear();
    this.latestNodeStatuses.clear();
    this.latestGameServerStatus.clear();
    this.pendingObjectStatuses.clear();
    this.pendingFrameEnds = [];
    this.queuedMessages = Buffer.alloc(0);
    this.generation += 1;
  }

  onConnect() {
    console.log(`[PlanetWatcher] Connected to Planet Server for ${this.sceneName} on ${this.host}:${this.port}`);
    this.connectedAt = Date.now();
  }

  onEnd() {
    console.log(`[PlanetWatcher] Connection ended to Planet Server for ${this.sceneName}`);
  }

  /**
   * Called when we recieve data from the PlanetWatcher socket. Does not
   * gaurentee a message, and may also produce multiple messages. Individual
   * message processing actions are performed in onMessage.
   */
  onData(data: Buffer) {
    if (!this.receivedData) {
      this.receivedData = true;
      this.connection?.setTimeout(SOCKET_IDLE_TIMEOUT_MS);
      this.onDataReceived?.();
    }

    let msgOffset = 0;
    this.queuedMessages = Buffer.concat([this.queuedMessages, data]);
    /**
     * Every message is prefixed by its size in bytes in Little Endian.
     *
     * A single packet may contain multiple messages.
     * A single message may span multiple packets.
     */
    while (msgOffset + 4 <= this.queuedMessages.length) {
      const nextMsgSize = this.queuedMessages.readUInt32LE(msgOffset);

      if (nextMsgSize > MAX_MESSAGE_SIZE) {
        // Unrecoverable desync, so reconnect for a fresh dump
        console.error(
          `[PlanetWatcher] Invalid message size ${nextMsgSize} from Planet Server for ${this.sceneName}, reconnecting`
        );
        this.queuedMessages = Buffer.alloc(0);
        this.connection?.destroy();
        return;
      }

      msgOffset += 4;

      if (nextMsgSize <= this.queuedMessages.length - msgOffset) {
        // There is enough data in the buffer to parse this message
        const msgView = this.queuedMessages.subarray(msgOffset, msgOffset + nextMsgSize);
        msgOffset += nextMsgSize;

        const msg = this.parseMessage(msgView);

        if (msg) {
          this.onMessage(msg);
        }
      } else {
        // We need to wait for more messages before attempting to read the buffer.
        msgOffset -= 4; // Ensure we don't discard the message size
        break;
      }
    }

    // Discard up to the currently processed message.
    this.queuedMessages = this.queuedMessages.subarray(msgOffset);

    // If the above made a 0 length buffer, then make a totally new buffer to ensure GC.
    if (this.queuedMessages.length === 0) this.queuedMessages = Buffer.alloc(0);
  }

  // The length prefix still marks the next message, so only the malformed one is lost
  private parseMessage(msgView: Buffer) {
    try {
      return parse(msgView);
    } catch (err) {
      this.parseErrors += 1;

      if (Date.now() - this.lastParseErrorLogAt >= PARSE_ERROR_LOG_INTERVAL_MS) {
        console.error(
          `[PlanetWatcher] Skipped ${this.parseErrors} malformed messages from Planet Server for ${this.sceneName}`,
          err
        );
        this.lastParseErrorLogAt = Date.now();
        this.parseErrors = 0;
      }

      return null;
    }
  }

  onMessage(msg: SBMessageTypes) {
    switch (msg.type) {
      case 'PlanetNodeStatusMessage': {
        msg.data.nodeStatus.forEach(planetNode => {
          // Store the latest node status by its cell index so we can send it to new clients later.
          this.latestNodeStatuses.set(
            PlanetWatcher.getPlanetCellIndex(planetNode.locationX, planetNode.locationZ),
            planetNode
          );
        });

        this.pubsub.publish(planetTopic('NODE_STATUS_UPDATE', this.sceneName), {
          planet: this.sceneName,
          data: msg.data.nodeStatus,
        });
        break;
      }

      case 'PlanetObjectStatusMessage': {
        let newObjects = 0;

        msg.data.objectStatuses.forEach(object => {
          if (object.deleteObject > 0) {
            // Object has been deleted, do not store
            this.latestObjectStatuses.delete(object.networkId);
          } else {
            if (!this.latestObjectStatuses.has(object.networkId)) newObjects += 1;
            // Store the latest object status so it can be sent to new subscribers later
            this.latestObjectStatuses.set(object.networkId, object);
          }

          this.pendingObjectStatuses.set(object.networkId, object);
        });

        if (!this.dumpComplete && newObjects > 0) {
          this.dumpStarted = true;
          this.dumpWindowNewObjects += newObjects;
          this.dumpLastNewObjectAt = Date.now();
        }

        if (this.pendingObjectStatuses.size >= this.flushMaxItems) {
          this.flush();
        } else {
          this.scheduleFlush();
        }
        break;
      }

      case 'GameServerStatus': {
        this.latestGameServerStatus.set(msg.data.serverId, msg.data);
        this.pubsub.publish(planetTopic('GAME_SERVER_STATUS', this.sceneName), {
          planet: this.sceneName,
          data: [msg.data],
        });
        break;
      }

      case 'FrameEndMessage': {
        // Hundreds per second across a planet's game servers, so batch them
        this.pendingFrameEnds.push(msg.data);
        this.scheduleFlush();
        break;
      }

      default:
        // Do nothing?
        break;
    }
  }

  flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pendingObjectStatuses.size > 0) {
      const data = [...this.pendingObjectStatuses.values()];
      this.pendingObjectStatuses.clear();

      if (!this.dumpComplete) {
        this.dumpObjectMessages += 1;
        this.dumpObjectBytes += objectUpdateByteSize(data);
      }

      this.pubsub.publish(planetTopic('OBJECT_UPDATE', this.sceneName), {
        planet: this.sceneName,
        data,
      });
    }

    if (this.pendingFrameEnds.length > 0) {
      const data = this.pendingFrameEnds;
      this.pendingFrameEnds = [];

      this.pubsub.publish(planetTopic('FRAME_END', this.sceneName), {
        planet: this.sceneName,
        data,
      });
    }
  }

  async replayTopic(topic: string, clientId: string, isCancelled: () => boolean = () => false) {
    const generation = this.generation;
    const publishTopic = planetTopic(topic, this.sceneName);
    const startedAt = Date.now();

    switch (topic) {
      case 'OBJECT_UPDATE': {
        let messages = 0;
        let items = 0;
        let bytes = 0;

        await this.replayChunked(this.latestObjectStatuses, generation, isCancelled, data => {
          messages += 1;
          items += data.length;
          bytes += objectUpdateByteSize(data);
          this.pubsub.publish(publishTopic, { clientId, planet: this.sceneName, data });
        });

        console.log(
          `[PlanetWatcher] Replayed OBJECT_UPDATE for ${this.sceneName} to client ${clientId}: ` +
            `${items} objects in ${messages} messages (${PlanetWatcher.formatBytes(bytes)}) over ${Date.now() - startedAt} ms`
        );
        break;
      }

      case 'NODE_STATUS_UPDATE':
        await this.replayChunked(this.latestNodeStatuses, generation, isCancelled, data => {
          this.pubsub.publish(publishTopic, { clientId, planet: this.sceneName, data });
        });
        break;

      case 'GAME_SERVER_STATUS':
        if (this.latestGameServerStatus.size > 0) {
          this.pubsub.publish(publishTopic, {
            clientId,
            planet: this.sceneName,
            data: [...this.latestGameServerStatus.values()],
          });
        }
        break;

      default:
        // do nothing
        break;
    }
  }

  // Values are read per chunk, not up front, so a chunk is never older than an already-published live update
  private async replayChunked<K, V>(
    cache: Map<K, V>,
    generation: number,
    isCancelled: () => boolean,
    publish: (data: V[]) => void
  ) {
    const keys = [...cache.keys()];

    for (let i = 0; i < keys.length; i += this.replayChunkSize) {
      if (generation !== this.generation || isCancelled()) return;

      const data: V[] = [];
      for (const key of keys.slice(i, i + this.replayChunkSize)) {
        const value = cache.get(key);
        if (value !== undefined) data.push(value);
      }

      if (data.length > 0) publish(data);

      if (i + this.replayChunkSize < keys.length) await yieldToEventLoop();
    }
  }

  private scheduleFlush() {
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.flush();
      }, this.flushIntervalMs);
    }
  }

  private startDumpTracking() {
    this.connectStartedAt = Date.now();
    this.connectedAt = 0;
    this.dumpComplete = false;
    this.dumpStarted = false;
    this.dumpQuietWindows = 0;
    this.dumpWindowNewObjects = 0;
    this.dumpLastNewObjectAt = 0;
    this.dumpObjectMessages = 0;
    this.dumpObjectBytes = 0;

    if (this.dumpCheckTimer) clearInterval(this.dumpCheckTimer);
    this.dumpCheckTimer = setInterval(() => this.checkDumpComplete(), DUMP_CHECK_INTERVAL_MS);
    this.dumpCheckTimer.unref?.();
  }

  private checkDumpComplete() {
    const quiet = this.dumpWindowNewObjects < DUMP_QUIET_NEW_OBJECTS;
    this.dumpWindowNewObjects = 0;

    if (!this.connectedAt) return;
    const connectedFor = Date.now() - this.connectedAt;

    if (!this.dumpComplete) {
      this.dumpQuietWindows = quiet && this.dumpStarted ? this.dumpQuietWindows + 1 : 0;

      const complete = this.dumpStarted
        ? this.dumpQuietWindows >= DUMP_QUIET_WINDOWS
        : connectedFor >= DUMP_MAX_WAIT_MS;
      if (!complete) return;

      this.flush();
      this.dumpComplete = true;

      console.log(
        `[PlanetWatcher] Initial dump for ${this.sceneName} complete ${Math.max(this.dumpLastNewObjectAt, this.connectedAt) - this.connectStartedAt} ms after connect: ` +
          `${this.latestObjectStatuses.size} objects, ${this.latestNodeStatuses.size} cells, ` +
          `${this.dumpObjectMessages} OBJECT_UPDATE messages (${PlanetWatcher.formatBytes(this.dumpObjectBytes)})`
      );
    }

    if (
      this.latestObjectStatuses.size < this.staleObjectStatuses.size * STALE_REMOVAL_MIN_RATIO &&
      connectedFor < STALE_REMOVAL_MAX_WAIT_MS
    ) {
      return;
    }

    if (this.dumpCheckTimer) clearInterval(this.dumpCheckTimer);
    this.dumpCheckTimer = null;

    this.publishStaleRemovals();
  }

  private publishStaleRemovals() {
    const deletes = [...this.staleObjectStatuses.values()]
      .filter(status => !this.latestObjectStatuses.has(status.networkId))
      .map(status => ({ ...status, deleteObject: 1 }));
    const unloaded = [...this.staleNodeStatuses.entries()]
      .filter(([cellIndex]) => !this.latestNodeStatuses.has(cellIndex))
      .map(([, status]) => ({
        ...status,
        isLoaded: 0,
        serverCount: 0,
        serverIds: [],
        subscriptionCount: 0,
        subscriptions: [],
      }));
    const offline = [...this.staleGameServerStatuses.values()]
      .filter(status => !this.latestGameServerStatus.has(status.serverId))
      .map(status => ({ ...status, isOnline: 0 }));

    this.staleObjectStatuses.clear();
    this.staleNodeStatuses.clear();
    this.staleGameServerStatuses.clear();

    for (let i = 0; i < deletes.length; i += this.replayChunkSize) {
      this.pubsub.publish(planetTopic('OBJECT_UPDATE', this.sceneName), {
        planet: this.sceneName,
        data: deletes.slice(i, i + this.replayChunkSize),
      });
    }

    for (let i = 0; i < unloaded.length; i += this.replayChunkSize) {
      this.pubsub.publish(planetTopic('NODE_STATUS_UPDATE', this.sceneName), {
        planet: this.sceneName,
        data: unloaded.slice(i, i + this.replayChunkSize),
      });
    }

    if (offline.length > 0) {
      this.pubsub.publish(planetTopic('GAME_SERVER_STATUS', this.sceneName), {
        planet: this.sceneName,
        data: offline,
      });
    }

    if (deletes.length > 0 || unloaded.length > 0 || offline.length > 0) {
      console.log(
        `[PlanetWatcher] Removed ${deletes.length} objects, ${unloaded.length} cells and ${offline.length} game servers ` +
          `from ${this.sceneName} that disappeared while reconnecting`
      );
    }
  }

  private stopTimers() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = null;
    if (this.dumpCheckTimer) clearInterval(this.dumpCheckTimer);
    this.dumpCheckTimer = null;
  }

  private closeSocket() {
    const socket = this.connection;
    this.connection = null;

    if (socket) {
      socket.removeAllListeners('data');
      socket.destroy();
    }
  }

  static formatBytes(bytes: number) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  static getPlanetCellIndex(x: number, z: number): number {
    const zeroBasedX = Math.floor((x + 8000) / PLANET_CELL_WIDTH);
    const zeroBasedZ = Math.floor((z + 8000) / PLANET_CELL_WIDTH);

    return zeroBasedX * PLANET_CELL_AXIS_COUNT + zeroBasedZ;
  }
}

export default PlanetWatcher;
