import { Arg, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { BuildingObjectService } from '../services/BuildingObjectService';
import { NameResolutionService } from '../services/NameResolutionService';
import { ObjVarService, stringObjvar } from '../services/ObjVarService';
import { ServerObjectService } from '../services/ServerObjectService';
import { PropertyListService } from '../services/PropertyListService';
import { BuildingObject, IServerObject, PlayerCreatureObject } from '../types';
import { PropertyListIds } from '../types/PropertyList';
import { AccessListEntry } from '../types/BuildingObject';
import { GuildService } from '../services/GuildService';
import { isPresent } from '../utils/utility-types';

@Resolver(() => BuildingObject)
@Service()
export class BuildingObjectResolver implements ResolverInterface<BuildingObject> {
  constructor(
    private readonly buildingObjectService: BuildingObjectService,
    private readonly nameResolutionService: NameResolutionService,
    private readonly objvarService: ObjVarService,
    private readonly objectService: ServerObjectService,
    private readonly propertyListService: PropertyListService,
    private readonly guildService: GuildService
  ) {
    // Do nothing
  }

  @FieldResolver()
  async maintenanceCost(@Root() object: IServerObject) {
    const bldg = await this.buildingObjectService.load(object.id);
    return bldg?.MAINTENANCE_COST ?? null;
  }

  @FieldResolver()
  async timeLastChecked(@Root() object: IServerObject) {
    const bldg = await this.buildingObjectService.load(object.id);
    return bldg?.TIME_LAST_CHECKED ?? null;
  }

  @FieldResolver()
  async isPublic(@Root() object: IServerObject) {
    const bldg = await this.buildingObjectService.load(object.id);
    return bldg?.IS_PUBLIC === 'Y';
  }

  @FieldResolver()
  async cityId(@Root() object: IServerObject) {
    const bldg = await this.buildingObjectService.load(object.id);
    return bldg?.CITY_ID ?? null;
  }

  @FieldResolver(() => String)
  async resolvedName(
    @Root() object: IServerObject,
    @Arg('resolveCustomNames', { defaultValue: true }) resolveCustomNames: boolean
  ): Promise<string> {
    if (resolveCustomNames) {
      const objvars = await this.objvarService.getObjVarsForObject(object.id);

      const structureName = objvars.find(stringObjvar('player_structure.sign.name'));

      if (structureName) return structureName.value.toString();
    }

    return this.nameResolutionService.resolveName(object, resolveCustomNames);
  }

  @FieldResolver(() => [PlayerCreatureObject])
  adminList(@Root() object: IServerObject) {
    return this.buildingObjectService.fetchObjvarAccessList(object.id, 'player_structure.admin.adminList');
  }

  @FieldResolver(() => Int)
  async adminListCount(@Root() object: IServerObject) {
    const adminList = await this.adminList(object);

    return adminList.length;
  }

  async #fetchPropertyListAccessList(
    objectId: string,
    propertyListId: PropertyListIds.Allowed | PropertyListIds.Banned
  ) {
    // Fetch from property list. Can be PlayerCharacters, guilds, factions(?)
    const propertyList = await this.propertyListService.load({ objectId, listId: propertyListId });

    const entryListPromises = propertyList
      .map(ple => {
        const [prefix, id] = ple.value.split(':');

        // `c` is a Network ID
        if (prefix === 'c') return this.objectService.getOne(id);
        // `g` is a guild name, which is unused. `G` is a Guild ID.
        if (prefix === 'G') return this.guildService.getGuild(id);

        // `n` is numeric, but I dunno what that means for permissions
        // `u` and `U` are unknown. Return nothing in that case
        return undefined;
      })
      .filter(isPresent);

    return entryListPromises;
  }

  @FieldResolver(() => [AccessListEntry])
  entryList(@Root() object: IServerObject) {
    return this.#fetchPropertyListAccessList(object.id, PropertyListIds.Allowed);
  }

  @FieldResolver(() => Int)
  async entryListCount(@Root() object: IServerObject) {
    const entryList = await this.entryList(object);

    return entryList.length;
  }

  @FieldResolver(() => [AccessListEntry])
  banList(@Root() object: IServerObject) {
    return this.#fetchPropertyListAccessList(object.id, PropertyListIds.Banned);
  }

  @FieldResolver(() => Int)
  async banListCount(@Root() object: IServerObject) {
    const banList = await this.banList(object);

    return banList.length;
  }
}
