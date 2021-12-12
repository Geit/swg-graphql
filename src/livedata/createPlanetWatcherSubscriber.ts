import { readFileSync } from 'fs';
import path from 'path';

import { PubSub, withFilter } from 'graphql-subscriptions';

import { PlanetWatcherArgs } from '../types/PlanetWatcherArgs';

import PlanetWatcher from './PlanetWatcher';

export const pubsub = new PubSub();

export interface PubSubPayload {
  clientId?: string;
  planet: string;

  data: unknown;
}

interface ConnectionDetails {
  host: string;
  port: number;
}

interface PlanetWatcherConnectionStatus {
  count: number;
  instance: PlanetWatcher;
}
const planetWatcherPool = new Map<string, PlanetWatcherConnectionStatus>();

/**
 * Creates (or attaches to an existing) planet watcher connection, and emits messages
 * using a PubSub engine. These should then be forwarded on to any clients of the
 * GraphQL Server
 *
 * @param topic The topic produced by a PlanetWatcher connection to subsribe to
 * @returns Subsriber that can be used with graphlql-js
 */
export const createPlanetWatcherSubscriber = (topic: string) => {
  return withFilter(
    (_rv, args: PlanetWatcherArgs) => {
      const PLANET = args.planet;
      const CLIENT_ID = args.clientId;

      // Return an asyncIterator
      const asyncIterator = pubsub.asyncIterator(topic);

      const existingVal = planetWatcherPool.get(PLANET);

      if (existingVal) {
        planetWatcherPool.set(PLANET, {
          ...existingVal,
          count: existingVal.count + 1,
        });
        setImmediate(() => existingVal.instance.replayTopic(topic, CLIENT_ID));
      } else {
        // Reload the config each time, individual server layout can change each time
        // Sync file read is a bit bleh though, maybe extract this into a job later?
        const serverConfigFile = path.join(__dirname, '../../data/planet-servers.json');
        const allServerDetails: Record<string, ConnectionDetails> = JSON.parse(
          readFileSync(serverConfigFile, { encoding: 'ascii' })
        );

        const serverDetails = allServerDetails[PLANET];
        const newPw = new PlanetWatcher(serverDetails.host, serverDetails.port, PLANET, pubsub);
        planetWatcherPool.set(PLANET, {
          count: 1,
          instance: newPw,
        });
        newPw.connect();
      }

      return {
        next() {
          return asyncIterator.next();
        },
        return() {
          const poolVal = planetWatcherPool.get(PLANET);

          if (poolVal) {
            if (poolVal.count - 1 <= 0) {
              poolVal.instance.disconnect();
              planetWatcherPool.delete(PLANET);
            } else {
              planetWatcherPool.set(PLANET, {
                ...poolVal,
                count: poolVal.count + -1,
              });
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return asyncIterator.return!();
        },
        throw(error: Error) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return asyncIterator.throw!(error);
        },
        [Symbol.asyncIterator]() {
          return this;
        },
      };
    },
    (payload: PubSubPayload, args: PlanetWatcherArgs) => {
      if (payload.clientId) {
        // Replay payloads have a clientId attached. Otherwise, messages are generally
        // multi-cast to all connected parties for the given planet server.
        return args.clientId === payload.clientId;
      }

      return args.planet === payload.planet;
    }
  );
};

export default createPlanetWatcherSubscriber;
