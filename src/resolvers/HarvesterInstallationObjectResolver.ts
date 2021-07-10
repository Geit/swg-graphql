import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { HarvesterInstallationObjectService } from '../services/HarvesterInstallationObjectService';
import { HarvesterInstallationObject } from '../types/HarvesterInstallationObject';
import { IServerObject } from '../types/ServerObject';

@Resolver(() => HarvesterInstallationObject)
@Service()
export class HarvesterInstallationObjectResolver implements ResolverInterface<HarvesterInstallationObject> {
  constructor(private readonly harvesterinstallationObjectService: HarvesterInstallationObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async installedEfficiency(@Root() object: IServerObject) {
    const io = await this.harvesterinstallationObjectService.load(object.id);
    return io?.INSTALLED_EFFICIENCY ?? null;
  }

  @FieldResolver()
  async maxExtractionRate(@Root() object: IServerObject) {
    const io = await this.harvesterinstallationObjectService.load(object.id);
    return io?.MAX_EXTRACTION_RATE ?? null;
  }

  @FieldResolver()
  async currentExtractionRate(@Root() object: IServerObject) {
    const io = await this.harvesterinstallationObjectService.load(object.id);
    return io?.CURRENT_EXTRACTION_RATE ?? null;
  }

  @FieldResolver()
  async maxHopperAmount(@Root() object: IServerObject) {
    const io = await this.harvesterinstallationObjectService.load(object.id);
    return io?.MAX_HOPPER_AMOUNT ?? null;
  }

  @FieldResolver()
  async hopperResource(@Root() object: IServerObject) {
    const io = await this.harvesterinstallationObjectService.load(object.id);
    return io?.HOPPER_RESOURCE ?? null;
  }

  @FieldResolver()
  async hopperAmount(@Root() object: IServerObject) {
    const io = await this.harvesterinstallationObjectService.load(object.id);
    return io?.HOPPER_AMOUNT ?? null;
  }

  @FieldResolver()
  async resourceType(@Root() object: IServerObject) {
    const io = await this.harvesterinstallationObjectService.load(object.id);
    return io?.RESOURCE_TYPE ?? null;
  }
}
