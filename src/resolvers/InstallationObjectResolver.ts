import { FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { InstallationObjectService } from '../services/InstallationObjectService';
import { IInstallationObject, IServerObject } from '../types';

@Resolver(() => IInstallationObject)
@Service()
export class InstallationObjectResolver implements ResolverInterface<IInstallationObject> {
  constructor(private readonly installationObjectService: InstallationObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async installationType(@Root() object: IServerObject) {
    const io = await this.installationObjectService.load(object.id);
    return io?.INSTALLATION_TYPE ?? null;
  }

  @FieldResolver()
  async activated(@Root() object: IServerObject) {
    const io = await this.installationObjectService.load(object.id);
    return io?.ACTIVATED === 'Y';
  }

  @FieldResolver()
  async tickCount(@Root() object: IServerObject) {
    const io = await this.installationObjectService.load(object.id);
    return io?.TICK_COUNT ?? null;
  }

  @FieldResolver()
  async activateStartTime(@Root() object: IServerObject) {
    const io = await this.installationObjectService.load(object.id);
    return io?.ACTIVATE_START_TIME ?? null;
  }

  @FieldResolver()
  async power(@Root() object: IServerObject) {
    const io = await this.installationObjectService.load(object.id);
    return io?.POWER ?? null;
  }

  @FieldResolver()
  async powerRate(@Root() object: IServerObject) {
    const io = await this.installationObjectService.load(object.id);
    return io?.POWER_RATE ?? null;
  }
}
