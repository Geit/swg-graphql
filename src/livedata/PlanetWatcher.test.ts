import { EventEmitter } from 'events';

import { PubSubEngine } from 'graphql-subscriptions';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import getStringCrc from '../utils/crc';

import { SBMessageTypes } from './messages';
import { FrameEndData } from './messages/FrameEndMessage';
import { PlanetNodeStatusData } from './messages/PlanetNodeStatusMessage';
import { PlanetObjectStatus } from './messages/PlanetObjectStatusMessage';
import PlanetWatcher from './PlanetWatcher';

class FakeSocket extends EventEmitter {
  setTimeout = vi.fn();
  setKeepAlive = vi.fn();

  destroy = vi.fn(() => {
    this.emit('close');
  });
}

const sockets: FakeSocket[] = [];

vi.mock('net', () => ({
  default: {
    connect: vi.fn(() => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    }),
  },
}));

const objectStatus = (id: number, overrides: Partial<PlanetObjectStatus> = {}): PlanetObjectStatus => ({
  networkId: BigInt(id),
  locationX: 0,
  locationZ: 0,
  authoritativeServer: 1,
  interestRadius: 0,
  deleteObject: 0,
  objectTypeTag: 0,
  level: 0,
  hibernating: 0,
  templateCrc: 0,
  aiActivity: 0,
  creationType: 0,
  ...overrides,
});

const nodeStatus = (x: number, z: number): PlanetNodeStatusData => ({
  locationX: x,
  locationZ: z,
  isLoaded: 1,
  serverCount: 1,
  serverIds: [1],
  subscriptionCount: 0,
  subscriptions: [],
});

const objectMessage = (objectStatuses: PlanetObjectStatus[]) =>
  ({
    type: 'PlanetObjectStatusMessage',
    data: { count: objectStatuses.length, objectStatuses },
  }) as unknown as SBMessageTypes;

const nodeMessage = (nodeStatuses: PlanetNodeStatusData[]) =>
  ({
    type: 'PlanetNodeStatusMessage',
    data: { count: nodeStatuses.length, nodeStatus: nodeStatuses },
  }) as unknown as SBMessageTypes;

const frameEndMessage = (data: FrameEndData) => ({ type: 'FrameEndMessage', data }) as unknown as SBMessageTypes;

interface Published {
  topic: string;
  payload: { clientId?: string; planet: string; data: unknown[] };
}

describe('PlanetWatcher', () => {
  let published: Published[];
  let pubsub: PubSubEngine;

  const publishedOn = (topic: string) => published.filter(p => p.topic === topic);
  const objectIds = (p: Published) => (p.payload.data as PlanetObjectStatus[]).map(o => Number(o.networkId));

  const createWatcher = (options = {}) =>
    new PlanetWatcher('localhost', 1234, 'naboo', pubsub, {
      flushIntervalMs: 50,
      flushMaxItems: 100,
      replayChunkSize: 3,
      ...options,
    });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sockets.length = 0;
    published = [];
    pubsub = {
      publish: vi.fn((topic: string, payload: Published['payload']) => {
        published.push({ topic, payload });
        return Promise.resolve();
      }),
    } as unknown as PubSubEngine;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('live object update coalescing', () => {
    it('should buffer object updates and publish them together once the flush interval elapses', () => {
      const watcher = createWatcher();

      watcher.onMessage(objectMessage([objectStatus(1)]));
      watcher.onMessage(objectMessage([objectStatus(2), objectStatus(3)]));

      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(0);

      vi.advanceTimersByTime(49);
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(0);

      vi.advanceTimersByTime(1);
      const messages = publishedOn('OBJECT_UPDATE:naboo');
      expect(messages).toHaveLength(1);
      expect(objectIds(messages[0])).toEqual([1, 2, 3]);
      expect(messages[0].payload.planet).toBe('naboo');
      expect(messages[0].payload.clientId).toBeUndefined();
    });

    it('should measure the flush interval from the first buffered update, not the latest', () => {
      const watcher = createWatcher();

      watcher.onMessage(objectMessage([objectStatus(1)]));
      vi.advanceTimersByTime(40);
      watcher.onMessage(objectMessage([objectStatus(2)]));
      vi.advanceTimersByTime(10);

      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(1);
      expect(objectIds(publishedOn('OBJECT_UPDATE:naboo')[0])).toEqual([1, 2]);
    });

    it('should flush immediately once the buffer reaches the size cap', () => {
      const watcher = createWatcher({ flushMaxItems: 5 });

      watcher.onMessage(objectMessage([1, 2, 3].map(id => objectStatus(id))));
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(0);

      watcher.onMessage(objectMessage([4, 5, 6].map(id => objectStatus(id))));
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(1);
      expect(objectIds(publishedOn('OBJECT_UPDATE:naboo')[0])).toEqual([1, 2, 3, 4, 5, 6]);

      // Nothing left to flush when the interval fires
      vi.advanceTimersByTime(100);
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(1);
    });

    it('should publish only the latest status for an object within a flush', () => {
      const watcher = createWatcher();

      watcher.onMessage(objectMessage([objectStatus(1, { locationX: 10 }), objectStatus(2)]));
      watcher.onMessage(objectMessage([objectStatus(1, { locationX: 20 })]));
      vi.advanceTimersByTime(50);

      const [message] = publishedOn('OBJECT_UPDATE:naboo');
      const data = message.payload.data as PlanetObjectStatus[];
      expect(data).toHaveLength(2);
      expect(data.find(o => o.networkId === 1n)?.locationX).toBe(20);
    });

    it('should not publish a stale create after a delete for the same object', () => {
      const watcher = createWatcher();

      watcher.onMessage(objectMessage([objectStatus(1)]));
      watcher.onMessage(objectMessage([objectStatus(1, { deleteObject: 1 })]));
      vi.advanceTimersByTime(50);

      const data = publishedOn('OBJECT_UPDATE:naboo')[0].payload.data as PlanetObjectStatus[];
      expect(data).toEqual([objectStatus(1, { deleteObject: 1 })]);
      expect(watcher.latestObjectStatuses.has(1n)).toBe(false);
    });

    it('should publish a create that arrives after a delete within the same flush', () => {
      const watcher = createWatcher();

      watcher.onMessage(objectMessage([objectStatus(1, { deleteObject: 1 })]));
      watcher.onMessage(objectMessage([objectStatus(1, { locationX: 5 })]));
      vi.advanceTimersByTime(50);

      const data = publishedOn('OBJECT_UPDATE:naboo')[0].payload.data as PlanetObjectStatus[];
      expect(data).toEqual([objectStatus(1, { locationX: 5 })]);
      expect(watcher.latestObjectStatuses.get(1n)?.locationX).toBe(5);
    });

    it('should batch frame end messages on the same interval', () => {
      const watcher = createWatcher();
      const frameEnd = (serverId: number) => ({ serverId, frameTime: 10, profilerDataLen: 0, profilerData: '' });

      watcher.onMessage(frameEndMessage(frameEnd(1)));
      watcher.onMessage(frameEndMessage(frameEnd(2)));
      expect(publishedOn('FRAME_END:naboo')).toHaveLength(0);

      vi.advanceTimersByTime(50);
      expect(publishedOn('FRAME_END:naboo')).toEqual([
        { topic: 'FRAME_END:naboo', payload: { planet: 'naboo', data: [frameEnd(1), frameEnd(2)] } },
      ]);
    });

    it('should publish node status updates immediately on the planet topic', () => {
      const watcher = createWatcher();

      watcher.onMessage(nodeMessage([nodeStatus(0, 0)]));

      expect(publishedOn('NODE_STATUS_UPDATE:naboo')).toEqual([
        { topic: 'NODE_STATUS_UPDATE:naboo', payload: { planet: 'naboo', data: [nodeStatus(0, 0)] } },
      ]);
    });
  });

  describe('replayTopic', () => {
    it('should replay cached objects in chunks, in order, targeted at the client', async () => {
      const watcher = createWatcher({ replayChunkSize: 3 });
      [1, 2, 3, 4, 5, 6, 7].forEach(id => watcher.latestObjectStatuses.set(BigInt(id), objectStatus(id)));

      const replay = watcher.replayTopic('OBJECT_UPDATE', 'client-a');
      await vi.runAllTimersAsync();
      await replay;

      const messages = publishedOn('OBJECT_UPDATE:naboo');
      expect(messages.map(objectIds)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
      messages.forEach(m => {
        expect(m.payload.clientId).toBe('client-a');
        expect(m.payload.planet).toBe('naboo');
      });
    });

    it('should yield to the event loop between chunks', async () => {
      const watcher = createWatcher({ replayChunkSize: 2 });
      [1, 2, 3, 4, 5].forEach(id => watcher.latestObjectStatuses.set(BigInt(id), objectStatus(id)));

      const replay = watcher.replayTopic('OBJECT_UPDATE', 'client-a');

      // Only the first chunk is published synchronously
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(1);

      vi.runOnlyPendingTimers();
      await Promise.resolve();
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(2);

      await vi.runAllTimersAsync();
      await replay;
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(3);
    });

    it('should use current values for later chunks and skip objects deleted mid-replay', async () => {
      const watcher = createWatcher({ replayChunkSize: 2 });
      [1, 2, 3, 4].forEach(id => watcher.latestObjectStatuses.set(BigInt(id), objectStatus(id)));

      const replay = watcher.replayTopic('OBJECT_UPDATE', 'client-a');

      watcher.onMessage(objectMessage([objectStatus(3, { deleteObject: 1 }), objectStatus(4, { locationX: 99 })]));

      await vi.runAllTimersAsync();
      await replay;

      const replayed = publishedOn('OBJECT_UPDATE:naboo').filter(p => p.payload.clientId === 'client-a');
      expect(replayed.map(objectIds)).toEqual([[1, 2], [4]]);
      expect((replayed[1].payload.data as PlanetObjectStatus[])[0].locationX).toBe(99);
    });

    it('should stop replaying if the cache is reset', async () => {
      const watcher = createWatcher({ replayChunkSize: 2 });
      [1, 2, 3, 4].forEach(id => watcher.latestObjectStatuses.set(BigInt(id), objectStatus(id)));

      const replay = watcher.replayTopic('OBJECT_UPDATE', 'client-a');
      watcher.reset();
      // The new dump repopulates the same keys
      [1, 2, 3, 4].forEach(id => watcher.latestObjectStatuses.set(BigInt(id), objectStatus(id)));

      await vi.runAllTimersAsync();
      await replay;

      expect(publishedOn('OBJECT_UPDATE:naboo').map(objectIds)).toEqual([[1, 2]]);
    });

    it('should stop replaying once cancelled', async () => {
      const watcher = createWatcher({ replayChunkSize: 2 });
      [1, 2, 3, 4, 5, 6].forEach(id => watcher.latestObjectStatuses.set(BigInt(id), objectStatus(id)));
      let cancelled = false;

      const replay = watcher.replayTopic('OBJECT_UPDATE', 'client-a', () => cancelled);
      cancelled = true;

      await vi.runAllTimersAsync();
      await replay;

      expect(publishedOn('OBJECT_UPDATE:naboo').map(objectIds)).toEqual([[1, 2]]);
    });

    it('should replay node statuses in chunks targeted at the client', async () => {
      const watcher = createWatcher({ replayChunkSize: 2 });
      watcher.onMessage(nodeMessage([nodeStatus(0, 0), nodeStatus(100, 0), nodeStatus(200, 0)]));
      published = [];

      const replay = watcher.replayTopic('NODE_STATUS_UPDATE', 'client-b');
      await vi.runAllTimersAsync();
      await replay;

      expect(publishedOn('NODE_STATUS_UPDATE:naboo')).toEqual([
        {
          topic: 'NODE_STATUS_UPDATE:naboo',
          payload: { clientId: 'client-b', planet: 'naboo', data: [nodeStatus(0, 0), nodeStatus(100, 0)] },
        },
        {
          topic: 'NODE_STATUS_UPDATE:naboo',
          payload: { clientId: 'client-b', planet: 'naboo', data: [nodeStatus(200, 0)] },
        },
      ]);
    });

    it('should replay game server statuses targeted at the client', async () => {
      const watcher = createWatcher();
      const status = {
        isOnline: 1,
        ipAddressLen: 8,
        ipAddress: '10.0.0.1',
        serverId: 3,
        systemPid: 1,
        sceneIdLen: 5,
        sceneId: 'naboo',
      };
      watcher.latestGameServerStatus.set(3, status);

      await watcher.replayTopic('GAME_SERVER_STATUS', 'client-c');

      expect(publishedOn('GAME_SERVER_STATUS:naboo')).toEqual([
        { topic: 'GAME_SERVER_STATUS:naboo', payload: { clientId: 'client-c', planet: 'naboo', data: [status] } },
      ]);
    });

    it('should not publish anything when there is nothing cached', async () => {
      const watcher = createWatcher();

      await watcher.replayTopic('OBJECT_UPDATE', 'client-a');
      await watcher.replayTopic('NODE_STATUS_UPDATE', 'client-a');
      await watcher.replayTopic('GAME_SERVER_STATUS', 'client-a');

      expect(published).toHaveLength(0);
    });
  });

  describe('connection lifecycle', () => {
    it('should report an unexpected socket close as a lost connection', () => {
      const watcher = createWatcher();
      const onConnectionLost = vi.fn();
      watcher.onConnectionLost = onConnectionLost;

      watcher.connect();
      sockets[0].emit('error', new Error('ECONNRESET'));
      sockets[0].emit('close');

      expect(onConnectionLost).toHaveBeenCalledTimes(1);
      expect(watcher.connection).toBeNull();
    });

    it('should not report a lost connection after disconnect()', () => {
      const watcher = createWatcher();
      const onConnectionLost = vi.fn();
      watcher.onConnectionLost = onConnectionLost;

      watcher.connect();
      watcher.disconnect();

      expect(sockets[0].destroy).toHaveBeenCalled();
      expect(onConnectionLost).not.toHaveBeenCalled();
    });

    it('should discard buffered updates on disconnect', () => {
      const watcher = createWatcher();

      watcher.connect();
      watcher.onMessage(objectMessage([objectStatus(1)]));
      watcher.disconnect();
      vi.advanceTimersByTime(100);

      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(0);
    });

    it('should clear cached state on reset', () => {
      const watcher = createWatcher();
      watcher.onMessage(objectMessage([objectStatus(1)]));
      watcher.onMessage(nodeMessage([nodeStatus(0, 0)]));

      watcher.reset();
      vi.advanceTimersByTime(100);

      expect(watcher.latestObjectStatuses.size).toBe(0);
      expect(watcher.latestNodeStatuses.size).toBe(0);
      expect(publishedOn('OBJECT_UPDATE:naboo')).toHaveLength(0);
    });

    it('should destroy the socket once the planet server goes silent after sending data', () => {
      const watcher = createWatcher();
      const onConnectionLost = vi.fn();
      watcher.onConnectionLost = onConnectionLost;

      watcher.connect();
      expect(sockets[0].setKeepAlive).toHaveBeenCalledWith(true, 30_000);
      expect(sockets[0].setTimeout).not.toHaveBeenCalled();

      sockets[0].emit('data', Buffer.alloc(0));
      sockets[0].emit('data', Buffer.alloc(0));
      expect(sockets[0].setTimeout).toHaveBeenCalledTimes(1);
      expect(sockets[0].setTimeout).toHaveBeenCalledWith(60_000);

      sockets[0].emit('timeout');

      expect(sockets[0].destroy).toHaveBeenCalled();
      expect(onConnectionLost).toHaveBeenCalledTimes(1);
    });

    it('should report the first data received on each connection once', () => {
      const watcher = createWatcher();
      const onDataReceived = vi.fn();
      watcher.onDataReceived = onDataReceived;

      watcher.connect();
      sockets[0].emit('connect');
      expect(onDataReceived).not.toHaveBeenCalled();

      sockets[0].emit('data', Buffer.alloc(0));
      sockets[0].emit('data', Buffer.alloc(0));
      expect(onDataReceived).toHaveBeenCalledTimes(1);

      watcher.connect();
      sockets[1].emit('data', Buffer.alloc(0));
      expect(onDataReceived).toHaveBeenCalledTimes(2);
    });

    it('should log the initial dump duration, message count and size once new objects stop arriving', () => {
      const watcher = createWatcher({ flushMaxItems: 200 });
      watcher.connect();
      sockets[0].emit('connect');

      vi.advanceTimersByTime(100);
      // 400 new objects arrive in two capped flushes
      watcher.onMessage(objectMessage(Array.from({ length: 200 }, (_, i) => objectStatus(i))));
      watcher.onMessage(objectMessage(Array.from({ length: 200 }, (_, i) => objectStatus(i + 200))));
      watcher.onMessage(objectMessage([objectStatus(1, { locationX: 1 })]));

      vi.advanceTimersByTime(900);
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Initial dump'));

      vi.advanceTimersByTime(500);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(
          /Initial dump for naboo complete 100 ms after connect: 400 objects, 0 cells, 3 OBJECT_UPDATE messages \(\d+\.\d\d MB\)/
        )
      );
    });
  });

  describe('reconnect reconciliation', () => {
    const gameServer = (serverId: number) => ({
      isOnline: 1,
      ipAddressLen: 8,
      ipAddress: '10.0.0.1',
      serverId,
      systemPid: serverId,
      sceneIdLen: 5,
      sceneId: 'naboo',
    });
    const gameServerMessage = (serverId: number) =>
      ({ type: 'GameServerStatus', data: gameServer(serverId) }) as unknown as SBMessageTypes;
    const ids = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

    const reconnect = (watcher: PlanetWatcher) => {
      watcher.reset();
      watcher.connect();
      sockets[sockets.length - 1].emit('connect');
      published = [];
    };

    const deletedIds = () =>
      publishedOn('OBJECT_UPDATE:naboo')
        .flatMap(p => p.payload.data as PlanetObjectStatus[])
        .filter(o => o.deleteObject > 0)
        .map(o => Number(o.networkId));

    it('should remove objects, cells and game servers missing from the dump after a reconnect', () => {
      const watcher = createWatcher();
      watcher.connect();
      sockets[0].emit('connect');
      watcher.onMessage(gameServerMessage(1));
      watcher.onMessage(gameServerMessage(2));
      watcher.onMessage(nodeMessage([nodeStatus(0, 0), nodeStatus(100, 0)]));
      watcher.onMessage(objectMessage(ids(1, 10).map(id => objectStatus(id))));
      vi.advanceTimersByTime(1000);

      reconnect(watcher);
      watcher.onMessage(gameServerMessage(1));
      watcher.onMessage(nodeMessage([nodeStatus(0, 0)]));
      watcher.onMessage(
        objectMessage(
          ids(1, 10)
            .filter(id => id !== 2)
            .map(id => objectStatus(id))
        )
      );

      vi.advanceTimersByTime(999);
      expect(deletedIds()).toEqual([]);

      vi.advanceTimersByTime(1);
      const deletes = publishedOn('OBJECT_UPDATE:naboo').at(-1)!;
      expect(deletes.payload.data).toEqual([objectStatus(2, { deleteObject: 1 })]);
      expect(publishedOn('NODE_STATUS_UPDATE:naboo').at(-1)!.payload.data).toEqual([
        { ...nodeStatus(100, 0), isLoaded: 0, serverCount: 0, serverIds: [], subscriptionCount: 0, subscriptions: [] },
      ]);
      expect(publishedOn('GAME_SERVER_STATUS:naboo').at(-1)!.payload.data).toEqual([{ ...gameServer(2), isOnline: 0 }]);
    });

    it('should not treat a quiet window before the dump has properly started as the end of it', () => {
      const watcher = createWatcher({ flushMaxItems: 10_000 });
      watcher.connect();
      sockets[0].emit('connect');
      watcher.onMessage(objectMessage(ids(1, 1000).map(id => objectStatus(id))));
      vi.advanceTimersByTime(1000);

      reconnect(watcher);

      vi.advanceTimersByTime(480);
      watcher.onMessage(objectMessage(ids(1, 50).map(id => objectStatus(id))));
      vi.advanceTimersByTime(40);
      watcher.onMessage(objectMessage(ids(51, 1000).map(id => objectStatus(id))));

      vi.advanceTimersByTime(5000);
      expect(deletedIds()).toEqual([]);
      expect(watcher.latestObjectStatuses.size).toBe(1000);
    });

    it('should not count silent windows from before the dump started', () => {
      const watcher = createWatcher();
      watcher.connect();
      sockets[0].emit('connect');
      watcher.onMessage(objectMessage(ids(1, 100).map(id => objectStatus(id))));
      vi.advanceTimersByTime(1000);

      reconnect(watcher);

      vi.advanceTimersByTime(1480);
      watcher.onMessage(objectMessage(ids(1, 95).map(id => objectStatus(id))));
      vi.advanceTimersByTime(40);
      watcher.onMessage(objectMessage(ids(96, 100).map(id => objectStatus(id))));

      vi.advanceTimersByTime(5000);
      expect(deletedIds()).toEqual([]);
    });

    it('should hold back removals while the new dump is much smaller than the old state', () => {
      const watcher = createWatcher();
      watcher.connect();
      sockets[0].emit('connect');
      watcher.onMessage(objectMessage(ids(1, 100).map(id => objectStatus(id))));
      vi.advanceTimersByTime(1000);

      reconnect(watcher);
      watcher.onMessage(objectMessage(ids(1, 50).map(id => objectStatus(id))));

      vi.advanceTimersByTime(29_500);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Initial dump for naboo complete'));
      expect(deletedIds()).toEqual([]);

      watcher.onMessage(objectMessage(ids(51, 60).map(id => objectStatus(id))));

      vi.advanceTimersByTime(500);
      expect(deletedIds()).toEqual(ids(61, 100));
    });

    it('should complete the dump for a planet with no objects after waiting', () => {
      const watcher = createWatcher();
      watcher.latestObjectStatuses.set(1n, objectStatus(1));
      watcher.reset();

      watcher.connect();
      sockets[0].emit('connect');

      vi.advanceTimersByTime(9500);
      expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Initial dump for naboo complete'));

      vi.advanceTimersByTime(500);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Initial dump for naboo complete'));
      expect(deletedIds()).toEqual([]);

      vi.advanceTimersByTime(20_000);
      expect(deletedIds()).toEqual([1]);
    });
  });

  describe('message framing', () => {
    const frame = (name: string, payload: Buffer) => {
      const body = Buffer.alloc(6 + payload.length);
      body.writeUInt16LE(1, 0);
      body.writeInt32LE(getStringCrc(name) | 0, 2);
      payload.copy(body, 6);

      const size = Buffer.alloc(4);
      size.writeUInt32LE(body.length);
      return Buffer.concat([size, body]);
    };

    const frameEnd = (serverId: number) => {
      const payload = Buffer.alloc(10);
      payload.writeUInt32LE(serverId, 0);
      payload.writeUInt32LE(5, 4);
      payload.writeUInt16LE(0, 8);
      return frame('FrameEndMessage', payload);
    };

    const frameEndServerIds = () =>
      publishedOn('FRAME_END:naboo').flatMap(p => (p.payload.data as FrameEndData[]).map(fe => fe.serverId));

    it('should parse messages split across and combined within chunks', () => {
      const watcher = createWatcher();
      const bytes = Buffer.concat([frameEnd(1), frameEnd(2), frameEnd(3)]);

      watcher.onData(bytes.subarray(0, 2));
      watcher.onData(bytes.subarray(2, 25));
      watcher.onData(bytes.subarray(25));
      vi.advanceTimersByTime(50);

      expect(frameEndServerIds()).toEqual([1, 2, 3]);
    });

    it('should skip a malformed message and keep parsing the ones after it', () => {
      const watcher = createWatcher();

      watcher.onData(Buffer.concat([frame('FrameEndMessage', Buffer.alloc(3)), frameEnd(7)]));
      vi.advanceTimersByTime(50);

      expect(frameEndServerIds()).toEqual([7]);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Skipped 1 malformed messages from Planet Server for naboo'),
        expect.any(Error)
      );
    });

    it('should reconnect rather than wait forever on an impossible message size', () => {
      const watcher = createWatcher();
      const onConnectionLost = vi.fn();
      watcher.onConnectionLost = onConnectionLost;
      watcher.connect();

      const corrupt = Buffer.alloc(8);
      corrupt.writeUInt32LE(0xffffffff, 0);
      sockets[0].emit('data', corrupt);

      expect(sockets[0].destroy).toHaveBeenCalled();
      expect(onConnectionLost).toHaveBeenCalledTimes(1);
    });
  });
});
