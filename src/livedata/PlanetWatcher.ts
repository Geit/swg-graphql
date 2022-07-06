import net from 'net';

import { PubSubEngine } from 'graphql-subscriptions';

import { parse, SBMessageTypes } from './messages';
import { GameServerStatusData } from './messages/GameServerStatus';
import { PlanetNodeStatusData } from './messages/PlanetNodeStatusMessage';
import { PlanetObjectStatus } from './messages/PlanetObjectStatusMessage';

const PLANET_CELL_WIDTH = 100;
const PLANET_CELL_AXIS_COUNT = 160;

class PlanetWatcher {
  sceneName: string;
  host: string;
  port: number;
  connection: net.Socket | null;
  latestObjectStatuses: Map<bigint, PlanetObjectStatus>;
  latestNodeStatuses: Map<number, PlanetNodeStatusData>;
  latestGameServerStatus: Map<number, GameServerStatusData>;
  pubsub: PubSubEngine;

  private queuedMessages = Buffer.alloc(0);

  constructor(host: string, port: number, sceneName: string, pubsub: PubSubEngine) {
    this.host = host;
    this.port = port;
    this.latestObjectStatuses = new Map();
    this.latestNodeStatuses = new Map();
    this.latestGameServerStatus = new Map();
    this.pubsub = pubsub;
    this.sceneName = sceneName;
  }

  connect() {
    this.connection = net.connect(this.port, this.host);

    this.connection.on('connect', this.onConnect.bind(this));
    this.connection.on('data', this.onData.bind(this));
    this.connection.on('end', this.onEnd.bind(this));

    console.log(`[PlanetWatcher] Connecting to Planet Server for ${this.sceneName} on ${this.host}:${this.port}`);
  }

  disconnect() {
    if (this.connection) {
      this.connection.destroy();
    }

    console.log(`[PlanetWatcher] Disconnected from Planet Server for ${this.sceneName}`);
  }

  onConnect() {
    console.log(`[PlanetWatcher] Connected to Planet Server for ${this.sceneName} on ${this.host}:${this.port}`);
  }

  onEnd() {
    console.log(`[PlanetWatcher] Conncted ended to Planet Server for ${this.sceneName}`);
  }

  /**
   * Called when we recieve data from the PlanetWatcher socket. Does not
   * gaurentee a message, and may also produce multiple messages. Individual
   * message processing actions are performed in onMessage.
   */
  onData(data: Buffer) {
    let msgOffset = 0;
    this.queuedMessages = Buffer.concat([this.queuedMessages, data]);
    /**
     * Every message is prefixed by its size in bytes in Little Endian.
     *
     * A single packet may contain multiple messages.
     * A single message may span multiple packets.
     */
    try {
      while (msgOffset < this.queuedMessages.length) {
        const nextMsgSize = this.queuedMessages.readUInt32LE(msgOffset);
        msgOffset += 4;

        if (nextMsgSize <= this.queuedMessages.length - msgOffset) {
          // There is enough data in the buffer to parse this message
          const msgView = this.queuedMessages.subarray(msgOffset, msgOffset + nextMsgSize);
          msgOffset += nextMsgSize;

          // const msg = SwgNetworkMessage.parse(msgView);
          const msg = parse(msgView);

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
    } catch (err) {
      this.queuedMessages = Buffer.alloc(0);
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

        this.pubsub.publish('NODE_STATUS_UPDATE', {
          planet: this.sceneName,
          data: msg.data.nodeStatus,
        });
        break;
      }

      case 'PlanetObjectStatusMessage': {
        msg.data.objectStatuses.forEach(object => {
          if (object.deleteObject > 0) {
            // Object has been deleted, do not store
            this.latestObjectStatuses.delete(object.networkId);
          } else {
            // Store the latest object status so it can be sent to new subscribers later
            this.latestObjectStatuses.set(object.networkId, object);
          }
        });
        this.pubsub.publish('OBJECT_UPDATE', {
          planet: this.sceneName,
          data: msg.data.objectStatuses,
        });
        break;
      }

      case 'GameServerStatus': {
        this.latestGameServerStatus.set(msg.data.serverId, msg.data);
        this.pubsub.publish('GAME_SERVER_STATUS', {
          planet: this.sceneName,
          data: [msg.data],
        });
        break;
      }

      case 'FrameEndMessage': {
        this.pubsub.publish('FRAME_END', {
          planet: this.sceneName,
          data: [msg.data],
        });
        break;
      }

      default:
        // Do nothing?
        break;
    }

    // console.dir(msg, { depth: null });
  }

  replayTopic(topic: string, clientId: string) {
    console.log(`Replaying topic ${topic} for client ${clientId}`);

    switch (topic) {
      case 'OBJECT_UPDATE':
        this.pubsub.publish('OBJECT_UPDATE', {
          clientId,
          planet: this.sceneName,

          data: [...this.latestObjectStatuses.values()],
        });
        break;

      case 'NODE_STATUS_UPDATE':
        this.pubsub.publish('NODE_STATUS_UPDATE', {
          planet: this.sceneName,
          data: [...this.latestNodeStatuses.values()],
        });
        break;

      case 'GAME_SERVER_STATUS':
        this.pubsub.publish('GAME_SERVER_STATUS', {
          planet: this.sceneName,
          data: [...this.latestGameServerStatus.values()],
        });
        break;

      default:
        // do nothing
        break;
    }
  }

  static getPlanetCellIndex(x: number, z: number): number {
    const zeroBasedX = Math.floor((x + 8000) / PLANET_CELL_WIDTH);
    const zeroBasedZ = Math.floor((z + 8000) / PLANET_CELL_WIDTH);

    return zeroBasedX * PLANET_CELL_AXIS_COUNT + zeroBasedZ;
  }
}

export default PlanetWatcher;
