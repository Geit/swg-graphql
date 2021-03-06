import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ManfSchematicObjectService } from '../services/ManfSchematicObjectService';
import { ManfSchematicObject, IServerObject } from '../types';

@Resolver(() => ManfSchematicObject)
@Service()
export class ManfSchematicObjectResolver {
  constructor(private readonly manfschematicObjectService: ManfSchematicObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async creatorName(@Root() object: IServerObject) {
    const rc = await this.manfschematicObjectService.load(object.id);
    return rc?.CREATOR_NAME;
  }

  @FieldResolver()
  async itemsPerContainer(@Root() object: IServerObject) {
    const rc = await this.manfschematicObjectService.load(object.id);
    return rc?.ITEMS_PER_CONTAINER;
  }

  @FieldResolver()
  async manufactureTime(@Root() object: IServerObject) {
    const rc = await this.manfschematicObjectService.load(object.id);
    return rc?.MANUFACTURE_TIME;
  }

  @FieldResolver()
  async draftSchematic(@Root() object: IServerObject) {
    const rc = await this.manfschematicObjectService.load(object.id);
    return rc?.DRAFT_SCHEMATIC;
  }
}
