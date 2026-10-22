import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { pubsub, createPlanetWatcherSubscriber } from './createPlanetWatcherSubscriber';
import { PlanetWatcherPool } from './PlanetWatcherPool';

vi.mock('./PlanetWatcherPool', () => ({
  PlanetWatcherPool: vi.fn(),
  createPlanetWatcherFactory: vi.fn(),
}));

interface Iter {
  next(): Promise<IteratorResult<unknown>>;
  return(): Promise<IteratorResult<unknown>>;
}

describe('createPlanetWatcherSubscriber', () => {
  let watcher: { replayTopic: ReturnType<typeof vi.fn> };
  let pool: { acquire: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };

  const subscribe = (planet: string, clientId: string, topic = 'OBJECT_UPDATE') =>
    createPlanetWatcherSubscriber(topic, pool as unknown as PlanetWatcherPool)(
      undefined,
      { planet, clientId },
      undefined,
      undefined as never
    ) as unknown as Iter;

  const nextWithin = async (iter: Iter) => {
    const result = await Promise.race([iter.next(), new Promise(resolve => setTimeout(() => resolve('timeout'), 20))]);
    return result;
  };

  beforeEach(() => {
    watcher = { replayTopic: vi.fn().mockResolvedValue(undefined) };
    pool = { acquire: vi.fn(() => ({ watcher, existing: false })), release: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should only deliver messages for the subscribed planet', async () => {
    const iter = subscribe('naboo', 'client-a');
    const pending = iter.next();

    await new Promise(setImmediate);
    await pubsub.publish('OBJECT_UPDATE:naboo', { planet: 'naboo', data: [1] });

    expect(await pending).toEqual({ done: false, value: { planet: 'naboo', data: [1] } });
    await iter.return();
  });

  it('should not deliver another planet’s messages', async () => {
    const iter = subscribe('naboo', 'client-a');
    const pending = nextWithin(iter);

    await new Promise(setImmediate);
    await pubsub.publish('OBJECT_UPDATE:tatooine', { planet: 'tatooine', data: [1] });

    expect(await pending).toBe('timeout');
    await iter.return();
  });

  it('should deliver replay payloads only to the targeted client', async () => {
    const a = subscribe('naboo', 'client-a');
    const b = subscribe('naboo', 'client-b');
    const pendingA = nextWithin(a);
    const pendingB = nextWithin(b);

    await new Promise(setImmediate);
    await pubsub.publish('OBJECT_UPDATE:naboo', { clientId: 'client-b', planet: 'naboo', data: [2] });

    expect(await pendingA).toBe('timeout');
    expect(await pendingB).toEqual({ done: false, value: { clientId: 'client-b', planet: 'naboo', data: [2] } });
    await a.return();
    await b.return();
  });

  it('should replay cached state once the subscription starts listening', async () => {
    pool.acquire.mockReturnValue({ watcher, existing: true });

    const iter = subscribe('naboo', 'client-a', 'NODE_STATUS_UPDATE');
    await new Promise(setImmediate);
    expect(watcher.replayTopic).not.toHaveBeenCalled();

    iter.next();
    iter.next();
    await new Promise(setImmediate);

    expect(pool.acquire).toHaveBeenCalledWith('naboo');
    expect(watcher.replayTopic).toHaveBeenCalledTimes(1);
    expect(watcher.replayTopic).toHaveBeenCalledWith('NODE_STATUS_UPDATE', 'client-a', expect.any(Function));
    await iter.return();
  });

  it('should deliver a replay published as soon as it starts', async () => {
    watcher.replayTopic.mockImplementation(async (topic: string, clientId: string) => {
      await pubsub.publish(`${topic}:naboo`, { clientId, planet: 'naboo', data: [3] });
    });
    pool.acquire.mockReturnValue({ watcher, existing: true });

    const iter = subscribe('naboo', 'client-a');

    expect(await nextWithin(iter)).toEqual({
      done: false,
      value: { clientId: 'client-a', planet: 'naboo', data: [3] },
    });
    await iter.return();
  });

  it('should cancel the replay when the subscription ends', async () => {
    pool.acquire.mockReturnValue({ watcher, existing: true });

    const iter = subscribe('naboo', 'client-a');
    iter.next();
    await new Promise(setImmediate);
    const isCancelled = watcher.replayTopic.mock.calls[0][2] as () => boolean;

    expect(isCancelled()).toBe(false);
    await iter.return();
    expect(isCancelled()).toBe(true);
  });

  it('should not replay when the watcher was just created', async () => {
    const iter = subscribe('naboo', 'client-a');
    iter.next();

    await new Promise(setImmediate);
    expect(watcher.replayTopic).not.toHaveBeenCalled();
    await iter.return();
  });

  it('should release the pool reference exactly once', async () => {
    const iter = subscribe('naboo', 'client-a');

    await iter.return();
    await iter.return();

    expect(pool.release).toHaveBeenCalledTimes(1);
    expect(pool.release).toHaveBeenCalledWith('naboo');
  });
});
