import { promises as dns } from 'dns';

import { Resolver, Subscription, Root, Args } from 'type-graphql';
import { Service } from 'typedi';

import { PubSubPayload, createPlanetWatcherSubscriber } from '../livedata/createPlanetWatcherSubscriber';
import { FrameEndData } from '../livedata/messages/FrameEndMessage';
import { GameServerStatusData } from '../livedata/messages/GameServerStatus';
import { PlanetNodeStatusData } from '../livedata/messages/PlanetNodeStatusMessage';
import { PlanetObjectStatus } from '../livedata/messages/PlanetObjectStatusMessage';
import PlanetWatcher from '../livedata/PlanetWatcher';
import { mapObjectStatus } from '../livedata/planetWatcherMappers';
import { ServerObjectService } from '../services/ServerObjectService';
import {
  PlanetWatcherArgs,
  PlanetWatcherFrameEnd,
  PlanetWatcherGameServerStatus,
  PlanetWatcherNodeStatusUpdate,
  PlanetWatcherObjectUpdate,
} from '../types';

interface ObjectUpdatePayload extends PubSubPayload {
  data: PlanetObjectStatus[];
}

interface NodeStatusUpdatePayload extends PubSubPayload {
  data: PlanetNodeStatusData[];
}

interface GameServerStatusPayload extends PubSubPayload {
  data: GameServerStatusData[];
}

interface FrameEndPayload extends PubSubPayload {
  data: FrameEndData[];
}

const HOSTNAME_CACHE_TTL_MS = 60 * 60 * 1000;
const HOSTNAME_FAILURE_CACHE_TTL_MS = 60 * 1000;

const hostNameCache = new Map<string, { expiresAt: number; hostName: Promise<string> }>();

/**
 * Cached reverse DNS lookup, falling back to the IP address on failure.
 */
export const lookupHostName = (ipAddress: string): Promise<string> => {
  const cached = hostNameCache.get(ipAddress);
  if (cached && cached.expiresAt > Date.now()) return cached.hostName;

  const entry = {
    expiresAt: Date.now() + HOSTNAME_CACHE_TTL_MS,
    hostName: dns
      .reverse(ipAddress)
      .then(names => names[0] ?? ipAddress)
      .catch(() => {
        entry.expiresAt = Date.now() + HOSTNAME_FAILURE_CACHE_TTL_MS;
        return ipAddress;
      }),
  };
  hostNameCache.set(ipAddress, entry);

  return entry.hostName;
};

export const clearHostNameCache = () => hostNameCache.clear();

const sharedPlanetWatcherDocumentation = `
While there are active subscribers, the GraphQL server will maintain a single connection to the relevant planet server. Further identical subscriptions will be multiplexed on to the same underlying connection, and a summary of recent information will be replayed to them.\n
This functionality requires that \`data/planet-servers.json\` be prepopulated with the planet server details for your cluster`;

@Service()
@Resolver()
export class PlanetWatcherResolvers {
  constructor(
    // constructor injection of a service
    private readonly objectService: ServerObjectService
  ) {
    // Do nothing
  }

  @Subscription(() => [PlanetWatcherObjectUpdate], {
    subscribe: createPlanetWatcherSubscriber('OBJECT_UPDATE'),
    description: `
Receive updates in real-time about objects on a planet.\n
${sharedPlanetWatcherDocumentation}`,
  })
  planetWatcherObject(
    @Root() updatePayload: ObjectUpdatePayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args() args: PlanetWatcherArgs
  ): PlanetWatcherObjectUpdate[] {
    return updatePayload.data.map(mapObjectStatus);
  }

  @Subscription(() => [PlanetWatcherNodeStatusUpdate], {
    subscribe: createPlanetWatcherSubscriber('NODE_STATUS_UPDATE'),
    description: `
Receive updates in real-time about cell/node updates on a planet.\n
${sharedPlanetWatcherDocumentation}`,
  })
  planetWatcherNodeStatus(
    @Root() updatePayload: NodeStatusUpdatePayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args() args: PlanetWatcherArgs
  ): PlanetWatcherNodeStatusUpdate[] {
    return updatePayload.data.map(node => ({
      cellIndex: PlanetWatcher.getPlanetCellIndex(node.locationX, node.locationZ),
      location: [node.locationX, 0, node.locationZ],
      isLoaded: node.isLoaded > 0,
      serverCount: node.serverCount,
      serverIds: node.serverIds,
      subscriptionCount: node.subscriptionCount,
      subscriptions: node.subscriptions,
    }));
  }

  @Subscription(() => [PlanetWatcherGameServerStatus], {
    subscribe: createPlanetWatcherSubscriber('GAME_SERVER_STATUS'),
    description: `
Receive updates in real-time about the game server status for a given planet.\n
${sharedPlanetWatcherDocumentation}`,
  })
  async planetWatcherGameServerStatus(
    @Root() updatePayload: GameServerStatusPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args() args: PlanetWatcherArgs
  ): Promise<PlanetWatcherGameServerStatus[]> {
    const results = await Promise.all(
      updatePayload.data.map(async gs => ({
        isOnline: gs.isOnline > 0,
        ipAddress: gs.ipAddress,
        hostName: await lookupHostName(gs.ipAddress),
        serverId: gs.serverId,
        systemPid: gs.systemPid,
        sceneId: gs.sceneId,
      }))
    );

    return results;
  }

  @Subscription(() => [PlanetWatcherFrameEnd], {
    subscribe: createPlanetWatcherSubscriber('FRAME_END'),
    description: `
Receive real-time performance data about game servers on a given planet.\n
${sharedPlanetWatcherDocumentation}`,
  })
  planetWatcherFrameEnd(
    @Root() updatePayload: FrameEndPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args() args: PlanetWatcherArgs
  ): PlanetWatcherFrameEnd[] {
    return updatePayload.data.map(fe => ({
      serverId: fe.serverId,
      frameTime: fe.frameTime,
      profilerData: fe.profilerData,
    }));
  }
}
