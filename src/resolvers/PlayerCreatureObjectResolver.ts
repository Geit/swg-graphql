import { Arg, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { ServerObjectService } from '../services/ServerObjectService';
import { PlayerCreatureObject } from '../types/PlayerCreatureObject';

@Resolver(() => PlayerCreatureObject)
@Service()
export class PlayerCreatureObjectResolver implements ResolverInterface<PlayerCreatureObject> {
  constructor(
    private readonly playerCreatureObjectService: PlayerCreatureObjectService,
    private readonly objectService: ServerObjectService
  ) {
    // Do nothing
  }

  @FieldResolver()
  async ownedObjects(
    @Root() object: PlayerCreatureObject,
    @Arg('objectTypes', () => [Int]) objectTypes: number[],
    @Arg('excludeDeleted', { defaultValue: true }) excludeDeleted: boolean
  ) {
    const ownedObjects = await this.objectService.getMany({
      ownedBy: [object.id],
      objectTypes,
      excludeDeleted,
    });

    return ownedObjects;
  }

  @FieldResolver()
  async account(@Root() object: PlayerCreatureObject) {
    const playerRecord = await this.playerCreatureObjectService.getPlayerRecordForCharacter(object.id);

    if (!playerRecord || !playerRecord.STATION_ID) {
      return null;
    }

    return {
      stationId: playerRecord.STATION_ID,
    };
  }
}
