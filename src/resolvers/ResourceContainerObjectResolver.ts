import { FieldResolver, Int, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ResourceContainerObjectService } from '../services/ResourceContainerObjectService';
import { ResourceContainerObject, IServerObject } from '../types';

@Resolver(() => ResourceContainerObject)
@Service()
export class ResourceContainerObjectResolver {
  constructor(private readonly rcObjectService: ResourceContainerObjectService) {
    // Do nothing
  }

  @FieldResolver(() => Int)
  async count(@Root() object: IServerObject) {
    const rc = await this.rcObjectService.load(object.id);
    return rc?.QUANTITY;
  }

  @FieldResolver()
  async quantity(@Root() object: IServerObject) {
    const rc = await this.rcObjectService.load(object.id);
    return rc?.QUANTITY;
  }

  @FieldResolver()
  async resourceType(@Root() object: IServerObject) {
    const rc = await this.rcObjectService.load(object.id);
    return rc?.RESOURCE_TYPE;
  }

  @FieldResolver()
  async source(@Root() object: IServerObject) {
    const rc = await this.rcObjectService.load(object.id);
    return rc?.SOURCE;
  }
}
