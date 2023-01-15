import { Arg, FieldResolver, Int, Resolver, Root } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { NameResolutionService } from '../services/NameResolutionService';
import { ResourceContainerObjectService } from '../services/ResourceContainerObjectService';
import { ResourceTypeService } from '../services/ResourceTypeService';
import { ResourceContainerObject, IServerObject } from '../types';
import { ResourceType } from '../types/ResourceType';

import { ResourceTypeResolver } from './ResourceTypeResolver';

@Resolver(() => ResourceContainerObject)
@Service()
export class ResourceContainerObjectResolver {
  @Inject()
  nameResolutionService: NameResolutionService;

  @Inject()
  resourceTypeService: ResourceTypeService;

  @Inject()
  rcObjectService: ResourceContainerObjectService;

  @Inject()
  resourceTypeResolvers: ResourceTypeResolver;

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

  @FieldResolver(() => String)
  async resourceTypeId(@Root() object: IServerObject) {
    const rc = await this.rcObjectService.load(object.id);

    return rc?.RESOURCE_TYPE;
  }

  @FieldResolver(() => ResourceType, { nullable: true })
  async resourceType(@Root() object: IServerObject) {
    const rc = await this.rcObjectService.load(object.id);

    if (!rc?.RESOURCE_TYPE) return null;

    return this.resourceTypeService.getOne(rc.RESOURCE_TYPE.toString());
  }

  @FieldResolver()
  async source(@Root() object: IServerObject) {
    const rc = await this.rcObjectService.load(object.id);
    return rc?.SOURCE;
  }

  @FieldResolver(() => String)
  async resolvedName(
    @Root() object: IServerObject,
    @Arg('resolveCustomNames', { defaultValue: true }) resolveCustomNames: boolean
  ): Promise<string> {
    if (resolveCustomNames) {
      const rType = await this.resourceType(object);

      if (rType) {
        const className = await this.resourceTypeResolvers.className(rType);

        return `${className} (${rType.name})`;
      }
    }

    return this.nameResolutionService.resolveName(object, resolveCustomNames);
  }
}
