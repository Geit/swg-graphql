import { Arg, Authorized, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { ENABLE_STRUCTURE_SHORTCUT } from '../config';
import { CityService } from '../services/CityService';
import { GuildService } from '../services/GuildService';
import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { PropertyListService } from '../services/PropertyListService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { City, Guild, PlayerCreatureObject } from '../types';
import { PropertyListIds } from '../types/PropertyList';
import { PlayerObject } from '../types/PlayerObject';
import TAGIFY, { STRUCTURE_TYPE_IDS } from '../utils/tagify';
import { isPresent, subsetOf } from '../utils/utility-types';
import { Skill } from '../types/PlayerCreatureObject';
import { SkillService } from '../services/SkillService';

import { CreatureObjectResolver } from './CreatureObjectResolver';

import { ROLES } from '@core/auth/roles';

@Resolver(() => PlayerCreatureObject)
@Service()
export class PlayerCreatureObjectResolver
  extends CreatureObjectResolver
  implements ResolverInterface<PlayerCreatureObject>
{
  @Inject()
  playerCreatureObjectService: PlayerCreatureObjectService;

  @Inject()
  objectService: ServerObjectService;

  @Inject()
  propertyListService: PropertyListService;

  @Inject()
  stringFileService: StringFileLoader;

  @Inject()
  cityService: CityService;

  @Inject()
  guildService: GuildService;

  @Inject()
  skillService: SkillService;

  @FieldResolver()
  async ownedObjects(
    @Root() object: PlayerCreatureObject,
    @Arg('objectTypes', () => [Int], { nullable: true }) objectTypes: number[] | null,
    @Arg('excludeDeleted', { defaultValue: true }) excludeDeleted: boolean,
    @Arg('structuresOnly', { defaultValue: false }) structuresOnly: boolean
  ) {
    // eslint-disable-next-line no-param-reassign
    if (structuresOnly) objectTypes = STRUCTURE_TYPE_IDS;

    if (ENABLE_STRUCTURE_SHORTCUT && objectTypes && subsetOf(objectTypes, STRUCTURE_TYPE_IDS)) {
      // If the user is just searching for structures, we can cheat a little and use
      // the structure objvar on characters.
      const structureOids = await this.playerCreatureObjectService.getCheapStructuresForCharacter(object.id);
      return this.objectService.getMany({
        objectTypes,
        excludeDeleted,
        objectIds: structureOids,
      });
    }

    const ownedObjects = await this.objectService.getMany({
      ownedBy: [object.id],
      objectTypes,
      excludeDeleted,
    });

    return ownedObjects;
  }

  @FieldResolver()
  @Authorized([ROLES.READ_ACCOUNTS])
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

  @FieldResolver(() => [Skill])
  async skills(@Root() object: PlayerCreatureObject) {
    const pLists = await this.propertyListService.load({ objectId: object.id, listId: PropertyListIds.Skills });

    const skillPromises = pLists.map(val => this.skillService.getSkillInformation(val.value));

    const skills = (await Promise.all(skillPromises)).filter(isPresent);

    return skills;
  }

  @FieldResolver(() => Int)
  async level(@Root() object: PlayerCreatureObject) {
    const skills = await this.skills(object);

    return this.skillService.getLevelForPlayer(skills);
  }

  @FieldResolver(() => City, { nullable: true, description: 'The City the player is Resident in' })
  city(@Root() object: PlayerCreatureObject) {
    return this.cityService.getCityForPlayer(object.id);
  }

  @FieldResolver(() => Guild, { nullable: true, description: 'The Guild the player is a member of' })
  guild(@Root() object: PlayerCreatureObject) {
    return this.guildService.getGuildForPlayer(object.id);
  }

  @FieldResolver(() => PlayerObject)
  async playerObject(@Root() object: PlayerCreatureObject) {
    const objects = await this.objectService.getMany({
      containedById: object.id,
      objectTypes: [TAGIFY('PLAY')],
    });

    if (!objects || objects.length === 0) throw new Error('Character with no player object is invalid!');

    return objects[0];
  }
}
