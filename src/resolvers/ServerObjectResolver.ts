import { Arg, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ServerObjectService } from '../services/ServerObjectService';
import { ObjVarService } from '../services/ObjVarService';
import { StringFileLoader } from '../services/StringFileLoader';
import { IServerObject, ServerObject, UnenrichedServerObject } from '../types/ServerObject';
import { NameResolutionService } from '../services/NameResolutionService';
import { PropertyListService } from '../services/PropertyListService';
import { PropertyListIds } from '../types/PropertyList';

@Resolver(() => IServerObject)
@Service()
export class ServerObjectResolver implements ResolverInterface<ServerObject> {
  constructor(
    private readonly objvarService: ObjVarService,
    private readonly objectService: ServerObjectService,
    private readonly stringFileService: StringFileLoader,
    private readonly nameResolutionService: NameResolutionService,
    private readonly propertyListService: PropertyListService
  ) {
    // Do nothing
  }

  @FieldResolver()
  // @ts-expect-error Typescript is unhappy that this won't return objvar/contents, but that kind of nesting
  // will be handled by gql recurisively calling this resolver.
  objVars(@Root() object: IServerObject) {
    return this.objvarService.getObjVarsForObject(object.id);
  }

  @FieldResolver()
  // @ts-expect-error Typescript is unhappy that this won't return objvar/contents, but that kind of nesting
  // will be handled by gql recurisively calling this resolver.
  contents(
    @Root() object: IServerObject,
    @Arg('limit', () => Int, { defaultValue: 500 }) limit: number,
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean
  ): Promise<UnenrichedServerObject[]> {
    return this.objectService.getMany({ containedById: object.id, limit, excludeDeleted });
  }

  @FieldResolver()
  resolvedName(
    @Root() object: IServerObject,
    @Arg('resolveCustomNames', { defaultValue: true }) resolveCustomNames: boolean
  ): Promise<string> {
    return this.nameResolutionService.resolveName(object, resolveCustomNames);
  }

  @FieldResolver()
  containedItemCount(@Root() object: IServerObject) {
    return this.objectService.countMany({ containedById: object.id, excludeDeleted: true });
  }

  @FieldResolver()
  async propertyLists(
    @Root() object: IServerObject,
    @Arg('listId', () => PropertyListIds, { nullable: true }) listId: PropertyListIds | null
  ) {
    const pLists = await this.propertyListService.load({ objectId: object.id, listId });

    return pLists ?? null;
  }
}
