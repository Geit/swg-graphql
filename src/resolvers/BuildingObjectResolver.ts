import { Arg, FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { BuildingObjectService } from '../services/BuildingObjectService';
import { NameResolutionService } from '../services/NameResolutionService';
import { ObjVarService, stringArrayObjvar, stringObjvar } from '../services/ObjVarService';
import { BuildingObject, IServerObject, PlayerCreatureObject } from '../types';

import { ServerObjectService } from '@core/services/ServerObjectService';
import { PropertyListService } from '@core/services/PropertyListService';
import { PropertyListIds } from '@core/types/PropertyList';
import { AccessListEntry } from '@core/types/BuildingObject';
import { GuildService } from '@core/services/GuildService';
import { isPresent } from '@core/utils/utility-types';

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

  async #fetchObjvarAccessList(objectId: string, objVar: string) {
    // Fetch from VAR_ADMIN_LIST. Can only be PlayerCharacterObjects in practice, but the
    // data store will allow guilds too.
    const objvars = await this.objvarService.getObjVarsForObject(objectId);

    const adminList = objvars.find(stringArrayObjvar(objVar));

    return this.objectService.getMany({ objectIds: adminList?.value ?? [] });
  }

  @FieldResolver(() => [PlayerCreatureObject])
  adminList(@Root() object: IServerObject) {
    return this.#fetchObjvarAccessList(object.id, 'player_structure.admin.adminList');
  }

  @FieldResolver(() => [PlayerCreatureObject])
  hopperList(@Root() object: IServerObject) {
    return this.#fetchObjvarAccessList(object.id, 'player_structure.hopper.hopperList');
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

  @FieldResolver(() => [AccessListEntry])
  banList(@Root() object: IServerObject) {
    return this.#fetchPropertyListAccessList(object.id, PropertyListIds.Banned);
  }
}
