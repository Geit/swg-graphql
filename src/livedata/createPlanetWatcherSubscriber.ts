import { EventEmitter } from 'events';

import { PubSub, withFilter } from 'graphql-subscriptions';

import { PlanetWatcherArgs } from '../types';

import { planetTopic } from './PlanetWatcher';
import { createPlanetWatcherFactory, PlanetWatcherPool } from './PlanetWatcherPool';

// One listener per subscription, so lift EventEmitter's default limit of 10
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(0);

export const pubsub = new PubSub({ eventEmitter });

export interface PubSubPayload {
  clientId?: string;
  planet: string;

  data: unknown;
}

export const planetWatcherPool = new PlanetWatcherPool(createPlanetWatcherFactory(pubsub));

/**
 * Creates (or attaches to an existing) planet watcher connection, and emits messages
 * using a PubSub engine. These should then be forwarded on to any clients of the
 * GraphQL Server
 *
 * @param topic The topic produced by a PlanetWatcher connection to subsribe to
 * @param pool The pool managing planet server connections
 * @returns Subsriber that can be used with graphlql-js
 */
export const createPlanetWatcherSubscriber = (topic: string, pool: PlanetWatcherPool = planetWatcherPool) => {
  return withFilter(
    (_rv, args: PlanetWatcherArgs) => {
      const PLANET = args.planet;
      const CLIENT_ID = args.clientId;

      const { watcher, existing } = pool.acquire(PLANET);

      const asyncIterator = pubsub.asyncIterator(planetTopic(topic, PLANET));

      let released = false;
      let replayStarted = !existing;

      return {
        next() {
          const result = asyncIterator.next();

          // PubSubAsyncIterator only starts listening in its first next(), so replay can't start any earlier
          if (!replayStarted) {
            replayStarted = true;
            setImmediate(() => {
              watcher
                .replayTopic(topic, CLIENT_ID, () => released)
                .catch(err => {
                  console.error(`[PlanetWatcher] Failed to replay ${topic} for ${PLANET} to ${CLIENT_ID}`, err);
                });
            });
          }

          return result;
        },
        return() {
          // return() can be called more than once
          if (!released) {
            released = true;
            pool.release(PLANET);
          }

          return asyncIterator.return!();
        },
        throw(error: Error) {
          return asyncIterator.throw!(error);
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };
    },
    (payload: PubSubPayload, args: PlanetWatcherArgs) => {
      if (payload.planet !== args.planet) return false;

      // Replay payloads have a clientId attached. Otherwise, messages are generally
      // multi-cast to all connected parties for the given planet server.
      return !payload.clientId || payload.clientId === args.clientId;
    }
  );
};

export default createPlanetWatcherSubscriber;
