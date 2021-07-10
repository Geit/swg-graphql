import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { BuildingObjectService } from '../services/BuildingObjectService';
import { BuildingObject } from '../types/BuildingObject';
import { IServerObject } from '../types/ServerObject';

@Resolver(() => BuildingObject)
@Service()
export class BuildingObjectResolver implements ResolverInterface<BuildingObject> {
  constructor(private readonly buildingObjectService: BuildingObjectService) {
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
}
