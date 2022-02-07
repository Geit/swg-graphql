import { Arg, FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { BuildingObjectService } from '../services/BuildingObjectService';
import { NameResolutionService } from '../services/NameResolutionService';
import { ObjVarService } from '../services/ObjVarService';
import { StringFileLoader } from '../services/StringFileLoader';
import { BuildingObject, IServerObject } from '../types';

@Resolver(() => BuildingObject)
@Service()
export class BuildingObjectResolver implements ResolverInterface<BuildingObject> {
  constructor(
    private readonly buildingObjectService: BuildingObjectService,
    private readonly nameResolutionService: NameResolutionService,
    private readonly stringFileService: StringFileLoader,
    private readonly objvarService: ObjVarService
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

      const structureName = objvars.find(ov => ov.name === 'player_structure.sign.name');

      if (structureName) return structureName.value.toString();
    }

    return this.nameResolutionService.resolveName(object, resolveCustomNames);
  }
}
