import { Arg, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ServerObjectService } from '../services/ServerObjectService';
import { ObjVarService } from '../services/ObjVarService';
import { IServerObject, ServerObject, UnenrichedServerObject } from '../types/ServerObject';
import { NameResolutionService } from '../services/NameResolutionService';
import { PropertyListService } from '../services/PropertyListService';
import { PropertyListIds } from '../types/PropertyList';
import { CrcLookupService } from '../services/CrcLookupService';
import { StringFileLoader } from '../services/StringFileLoader';

@Resolver(() => IServerObject)
@Service()
export class ServerObjectResolver implements ResolverInterface<ServerObject> {
  constructor(
    private readonly objvarService: ObjVarService,
    private readonly objectService: ServerObjectService,
    private readonly nameResolutionService: NameResolutionService,
    private readonly propertyListService: PropertyListService,
    private readonly crcLookup: CrcLookupService,
    private readonly stringFileService: StringFileLoader
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
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean,
    @Arg('recursive', { defaultValue: false }) recursive: boolean
  ): Promise<UnenrichedServerObject[]> {
    return this.objectService.getMany({
      ...(recursive ? { containedByIdRecursive: object.id } : { containedById: object.id }),
      limit,
      excludeDeleted,
    });
  }

  @FieldResolver(() => String, { nullable: true })
  async template(@Root() object: IServerObject) {
    if (!object.templateId) return null;

    const template = await this.crcLookup.lookupCrc(object.templateId >>> 0);

    return template;
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

  @FieldResolver(() => IServerObject, { nullable: true })
  container(@Root() object: IServerObject) {
    if (!object.containedById || parseInt(object.containedById) < 0) return null;

    return this.objectService.getOne(object.containedById);
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  loadsWith(@Root() object: IServerObject) {
    if (!object.loadWithId || parseInt(object.loadWithId) < 0) return null;

    return this.objectService.getOne(object.loadWithId);
  }

  @FieldResolver(() => String, { nullable: true })
  async sceneName(@Root() object: IServerObject) {
    if (!object.scene) return null;

    const planetNames = await this.stringFileService.load('planet_n');

    return planetNames[object.scene] ?? object.scene;
  }
}
