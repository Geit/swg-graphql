import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';

import { PlanetWatcherFactory, PlanetWatcherPool, PooledPlanetWatcher } from './PlanetWatcherPool';

type FakeWatcher = PooledPlanetWatcher & {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
};

const createFakeWatcher = (): FakeWatcher =>
  ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    reset: vi.fn(),
    replayTopic: vi.fn().mockResolvedValue(undefined),
  }) as unknown as FakeWatcher;

describe('PlanetWatcherPool', () => {
  let watchers: FakeWatcher[];
  let factory: Mock<PlanetWatcherFactory>;
  let pool: PlanetWatcherPool;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    watchers = [];
    factory = vi.fn<PlanetWatcherFactory>(() => {
      const watcher = createFakeWatcher();
      watchers.push(watcher);
      return watcher;
    });
    pool = new PlanetWatcherPool(factory, {
      idleGraceMs: 120_000,
      reconnectBaseDelayMs: 1000,
      reconnectMaxDelayMs: 4000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('acquire', () => {
    it('should create and connect a watcher for the first subscriber', () => {
      const { watcher, existing } = pool.acquire('naboo');

      expect(factory).toHaveBeenCalledWith('naboo');
      expect(existing).toBe(false);
      expect(watcher).toBe(watchers[0]);
      expect(watchers[0].connect).toHaveBeenCalledTimes(1);
      expect(pool.getSubscriberCount('naboo')).toBe(1);
    });

    it('should share the watcher between subscribers to the same planet', () => {
      pool.acquire('naboo');
      const second = pool.acquire('naboo');

      expect(factory).toHaveBeenCalledTimes(1);
      expect(second.existing).toBe(true);
      expect(second.watcher).toBe(watchers[0]);
      expect(pool.getSubscriberCount('naboo')).toBe(2);
    });

    it('should not register anything if connecting throws', () => {
      factory.mockImplementationOnce(() => {
        const watcher = createFakeWatcher();
        watcher.connect.mockImplementation(() => {
          throw new RangeError('ERR_SOCKET_BAD_PORT');
        });
        return watcher;
      });

      expect(() => pool.acquire('naboo')).toThrow('ERR_SOCKET_BAD_PORT');
      expect(pool.has('naboo')).toBe(false);

      pool.acquire('naboo');
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should not register anything if the factory throws', () => {
      factory.mockImplementationOnce(() => {
        throw new Error('No planet server configured');
      });

      expect(() => pool.acquire('nowhere')).toThrow('No planet server configured');
      expect(pool.has('nowhere')).toBe(false);
    });
  });

  describe('idle grace period', () => {
    it('should keep the connection open for the grace period after the last subscriber leaves', () => {
      pool.acquire('naboo');
      pool.release('naboo');

      vi.advanceTimersByTime(119_999);
      expect(watchers[0].disconnect).not.toHaveBeenCalled();
      expect(pool.has('naboo')).toBe(true);

      vi.advanceTimersByTime(1);
      expect(watchers[0].disconnect).toHaveBeenCalledTimes(1);
      expect(pool.has('naboo')).toBe(false);
    });

    it('should not start the grace period while subscribers remain', () => {
      pool.acquire('naboo');
      pool.acquire('naboo');
      pool.release('naboo');

      vi.advanceTimersByTime(300_000);
      expect(watchers[0].disconnect).not.toHaveBeenCalled();
      expect(pool.getSubscriberCount('naboo')).toBe(1);
    });

    it('should cancel the pending disconnect when a subscriber returns within the window', () => {
      pool.acquire('naboo');
      pool.release('naboo');
      vi.advanceTimersByTime(60_000);

      const { watcher, existing } = pool.acquire('naboo');

      expect(existing).toBe(true);
      expect(watcher).toBe(watchers[0]);
      expect(factory).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(300_000);
      expect(watchers[0].disconnect).not.toHaveBeenCalled();
      expect(pool.getSubscriberCount('naboo')).toBe(1);
    });

    it('should restart the grace period from the latest release', () => {
      pool.acquire('naboo');
      pool.release('naboo');
      vi.advanceTimersByTime(100_000);
      pool.acquire('naboo');
      pool.release('naboo');

      vi.advanceTimersByTime(100_000);
      expect(watchers[0].disconnect).not.toHaveBeenCalled();

      vi.advanceTimersByTime(20_000);
      expect(watchers[0].disconnect).toHaveBeenCalledTimes(1);
    });

    it('should create a fresh watcher after the grace period expires', () => {
      pool.acquire('naboo');
      pool.release('naboo');
      vi.advanceTimersByTime(120_000);

      const { existing } = pool.acquire('naboo');

      expect(existing).toBe(false);
      expect(factory).toHaveBeenCalledTimes(2);
      expect(watchers[1].connect).toHaveBeenCalledTimes(1);
    });

    it('should ignore releases that have no matching acquire', () => {
      pool.acquire('naboo');
      pool.release('naboo');
      pool.release('naboo');
      pool.release('tatooine');

      expect(pool.getSubscriberCount('naboo')).toBe(0);
      pool.acquire('naboo');
      expect(pool.getSubscriberCount('naboo')).toBe(1);
    });
  });

  describe('planet server connection loss', () => {
    it('should reset and reconnect with backoff while there are subscribers', () => {
      pool.acquire('naboo');
      const watcher = watchers[0];

      watcher.onConnectionLost?.();
      expect(watcher.reset).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(watcher.reset).toHaveBeenCalledTimes(1);
      expect(watcher.connect).toHaveBeenCalledTimes(2);

      // Second failure backs off further
      watcher.onConnectionLost?.();
      vi.advanceTimersByTime(1999);
      expect(watcher.connect).toHaveBeenCalledTimes(2);
      vi.advanceTimersByTime(1);
      expect(watcher.connect).toHaveBeenCalledTimes(3);

      // Capped at the max delay
      watcher.onConnectionLost?.();
      vi.advanceTimersByTime(4000);
      watcher.onConnectionLost?.();
      vi.advanceTimersByTime(4000);
      expect(watcher.connect).toHaveBeenCalledTimes(5);

      expect(pool.getSubscriberCount('naboo')).toBe(1);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should reset the backoff once data is received', () => {
      pool.acquire('naboo');
      const watcher = watchers[0];

      watcher.onConnectionLost?.();
      vi.advanceTimersByTime(1000);
      watcher.onConnectionLost?.();
      vi.advanceTimersByTime(2000);
      watcher.onDataReceived?.();

      watcher.onConnectionLost?.();
      vi.advanceTimersByTime(1000);
      expect(watcher.connect).toHaveBeenCalledTimes(4);
    });

    it('should remove an idle watcher when its planet server drops', () => {
      pool.acquire('naboo');
      pool.release('naboo');

      watchers[0].onConnectionLost?.();

      expect(watchers[0].disconnect).toHaveBeenCalledTimes(1);
      expect(pool.has('naboo')).toBe(false);

      // The cancelled grace timer must not fire against the next watcher
      pool.acquire('naboo');
      vi.advanceTimersByTime(300_000);
      expect(watchers[1].disconnect).not.toHaveBeenCalled();
    });

    it('should stop reconnecting if the connection drops again after the last subscriber leaves', () => {
      pool.acquire('naboo');
      watchers[0].onConnectionLost?.();
      pool.release('naboo');

      vi.advanceTimersByTime(1000);
      expect(watchers[0].connect).toHaveBeenCalledTimes(2);

      // Still failing while idle: drop the entry rather than retrying
      watchers[0].onConnectionLost?.();
      expect(pool.has('naboo')).toBe(false);
      vi.advanceTimersByTime(300_000);
      expect(watchers[0].connect).toHaveBeenCalledTimes(2);
    });

    it('should cancel a pending reconnect when the entry is destroyed', () => {
      // Grace period shorter than the reconnect delay, so the entry is destroyed while a reconnect is pending
      const shortPool = new PlanetWatcherPool(factory, { idleGraceMs: 500, reconnectBaseDelayMs: 1000 });
      shortPool.acquire('tatooine');
      const watcher = watchers[0];
      watcher.onConnectionLost?.();
      shortPool.release('tatooine');

      vi.advanceTimersByTime(500);
      expect(watcher.disconnect).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(10_000);
      expect(watcher.connect).toHaveBeenCalledTimes(1);
      expect(watcher.reset).not.toHaveBeenCalled();
    });

    it('should ignore connection loss callbacks from removed watchers', () => {
      pool.acquire('naboo');
      const oldWatcher = watchers[0];
      const onConnectionLost = oldWatcher.onConnectionLost;
      pool.release('naboo');
      vi.advanceTimersByTime(120_000);

      pool.acquire('naboo');
      onConnectionLost?.();

      expect(pool.has('naboo')).toBe(true);
      vi.advanceTimersByTime(10_000);
      expect(watchers[1].reset).not.toHaveBeenCalled();
      expect(watchers[1].connect).toHaveBeenCalledTimes(1);
    });
  });
});
