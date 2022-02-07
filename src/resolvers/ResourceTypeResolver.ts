import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { StringFileLoader } from '../services/StringFileLoader';
import { ResourceType, ResourceTypeAttribute } from '../types/ResourceType';

@Resolver(() => ResourceType)
@Service()
export class ResourceTypeResolver {
  constructor(private readonly stringService: StringFileLoader) {
    // Do nothing
  }

  @FieldResolver(() => String, { nullable: true, description: 'Name of the resource class' })
  async resourceClassName(@Root() resource: ResourceType) {
    if (!resource.resourceClassId) return null;

    const resourceClassNames = await this.stringService.load('resource/resource_names');

    return resourceClassNames?.[resource.resourceClassId] ?? null;
  }
}

@Resolver(() => ResourceTypeAttribute)
@Service()
export class ResourceTypeAttributeResolver {
  constructor(private readonly stringService: StringFileLoader) {
    // Do nothing
  }

  @FieldResolver(() => String, { nullable: true, description: 'Resolved name of the attribute' })
  async attributeName(@Root() attribute: ResourceTypeAttribute) {
    if (!attribute.attributeId) return null;

    const attributeNames = await this.stringService.load('obj_attr_n');

    return attributeNames?.[attribute.attributeId] ?? null;
  }
}
