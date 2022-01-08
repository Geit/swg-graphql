import { promises as dns } from 'dns';

import { Resolver, Subscription, Root, Args } from 'type-graphql';
import { Service } from 'typedi';

import { PubSubPayload, createPlanetWatcherSubscriber } from '../livedata/createPlanetWatcherSubscriber';
import { FrameEndData } from '../livedata/messages/FrameEndMessage';
import { GameServerStatusData } from '../livedata/messages/GameServerStatus';
import { PlanetNodeStatusData } from '../livedata/messages/PlanetNodeStatusMessage';
import { PlanetObjectStatus } from '../livedata/messages/PlanetObjectStatusMessage';
import PlanetWatcher from '../livedata/PlanetWatcher';
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
Recieve updates in real-time about objects on a planet.\n
${sharedPlanetWatcherDocumentation}`,
  })
  planetWatcherObject(
    @Root() updatePayload: ObjectUpdatePayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args() args: PlanetWatcherArgs
  ): PlanetWatcherObjectUpdate[] {
    return updatePayload.data.map(obj => ({
      networkId: obj.networkId.toString(),
      location: [obj.locationX, 0, obj.locationZ],
      authoritativeServer: obj.authoritativeServer,
      interestRadius: obj.interestRadius,
      deleteObject: obj.deleteObject,
      objectTypeTag: obj.objectTypeTag,
      level: obj.level,
      hibernating: obj.hibernating,
      templateCrc: obj.templateCrc,
      aiActivity: obj.aiActivity,
      creationType: obj.creationType,
    }));
  }

  @Subscription(() => [PlanetWatcherNodeStatusUpdate], {
    subscribe: createPlanetWatcherSubscriber('NODE_STATUS_UPDATE'),
    description: `
Recieve updates in real-time about cell/node updates on a planet.\n
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
Recieve updates in real-time about the game server status for a given planet.\n
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
        hostName: (await dns.reverse(gs.ipAddress))[0],
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
Recieve real-time performance data about game servers on a given planet.\n
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
