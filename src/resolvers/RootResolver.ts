import { Arg, Int, Query, Resolver, Subscription, Root, Args } from 'type-graphql';
import { Service } from 'typedi';

import { PubSubPayload, createPlanetWatcherSubscriber } from '../livedata/createPlanetWatcherSubscriber';
import { GameServerStatusData } from '../livedata/messages/GameServerStatus';
import { PlanetNodeStatusData } from '../livedata/messages/PlanetNodeStatusMessage';
import { PlanetObjectStatus } from '../livedata/messages/PlanetObjectStatusMessage';
import PlanetWatcher from '../livedata/PlanetWatcher';
import { ServerObjectService } from '../services/ServerObjectService';
import { IServerObject } from '../types';
import { PlanetWatcherArgs } from '../types/PlanetWatcherArgs';
import { PlanetWatcherGameServerStatus } from '../types/PlanetWatcherGameServerStatus';
import { PlanetWatcherNodeStatusUpdate } from '../types/PlanetWatcherNodeStatusUpdate';
import { PlanetWatcherObjectUpdate } from '../types/PlanetWatcherObjectUpdate';
import { UnenrichedServerObject } from '../types/ServerObject';

interface ObjectUpdatePayload extends PubSubPayload {
  data: PlanetObjectStatus[];
}

interface NodeStatusUpdatePayload extends PubSubPayload {
  data: PlanetNodeStatusData[];
}

interface GameServerStatusPayload extends PubSubPayload {
  data: GameServerStatusData[];
}

@Service()
@Resolver()
export class RootResolver {
  constructor(
    // constructor injection of a service
    private readonly objectService: ServerObjectService
  ) {
    // Do nothing
  }

  @Query(() => IServerObject, { nullable: true })
  object(@Arg('objectId', { nullable: false }) objectId: string): Promise<Partial<IServerObject> | null> {
    return this.objectService.getOne(objectId);
  }

  @Query(() => [IServerObject], { nullable: true })
  objects(
    @Arg('searchText', { nullable: false }) searchText: string,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean
  ): Promise<Partial<UnenrichedServerObject[]> | null> {
    return this.objectService.getMany({ searchText, limit, excludeDeleted });
  }

  @Subscription(() => [PlanetWatcherObjectUpdate], {
    subscribe: createPlanetWatcherSubscriber('OBJECT_UPDATE'),
  })
  // eslint-disable-next-line class-methods-use-this
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
  })
  // eslint-disable-next-line class-methods-use-this
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
  })
  // eslint-disable-next-line class-methods-use-this
  planetWatcherGameServerStatus(
    @Root() updatePayload: GameServerStatusPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args() args: PlanetWatcherArgs
  ): PlanetWatcherGameServerStatus[] {
    return updatePayload.data.map(gs => ({
      isOnline: gs.isOnline > 0,
      ipAddress: gs.ipAddress,
      serverId: gs.serverId,
      systemPid: gs.systemPid,
      sceneId: gs.sceneId,
    }));
  }
}
