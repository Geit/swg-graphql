import { Arg, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { PropertyListService } from '../services/PropertyListService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { PlayerCreatureObject } from '../types';
import { PropertyListIds } from '../types/PropertyList';

@Resolver(() => PlayerCreatureObject)
@Service()
export class PlayerCreatureObjectResolver implements ResolverInterface<PlayerCreatureObject> {
  constructor(
    private readonly playerCreatureObjectService: PlayerCreatureObjectService,
    private readonly objectService: ServerObjectService,
    private readonly propertyListService: PropertyListService,
    private readonly stringFileService: StringFileLoader
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
      id: playerRecord.STATION_ID,
    };
  }

  @FieldResolver()
  async lastLoginTime(@Root() object: PlayerCreatureObject) {
    const playerRecord = await this.playerCreatureObjectService.getPlayerRecordForCharacter(object.id);

    return playerRecord?.LAST_LOGIN_TIME?.toISOString() ?? null;
  }

  @FieldResolver()
  async createdTime(@Root() object: PlayerCreatureObject) {
    const playerRecord = await this.playerCreatureObjectService.getPlayerRecordForCharacter(object.id);

    return playerRecord?.CREATE_TIME?.toISOString() ?? null;
  }

  @FieldResolver()
  async skills(@Root() object: PlayerCreatureObject) {
    const [pLists, skillNames, skillTitles, skillDescriptions] = await Promise.all([
      this.propertyListService.load({ objectId: object.id, listId: PropertyListIds.Skills }),
      this.stringFileService.load('skl_n'),
      this.stringFileService.load('skl_t'),
      this.stringFileService.load('skl_d'),
    ]);

    const skills = pLists.map(val => {
      return {
        id: val.value,
        name: skillNames[val.value] ?? null,
        title: skillTitles[val.value] ?? null,
        description: skillDescriptions[val.value] ?? null,
      };
    });

    return skills;
  }
}
