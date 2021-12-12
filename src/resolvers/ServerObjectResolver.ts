import { Arg, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { ServerObjectService } from '../services/ServerObjectService';
import { ObjVarService } from '../services/ObjVarService';
import { StringFileLoader } from '../services/StringFileLoader';
import { IServerObject, ServerObject, UnenrichedServerObject } from '../types/ServerObject';

@Resolver(() => IServerObject)
@Service()
export class ServerObjectResolver implements ResolverInterface<ServerObject> {
  constructor(
    private readonly objvarService: ObjVarService,
    private readonly objectService: ServerObjectService,
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
    @Arg('excludeDeleted', { defaultValue: false }) excludeDeleted: boolean
  ): Promise<UnenrichedServerObject[]> {
    return this.objectService.getMany({ containedById: object.id, limit, excludeDeleted });
  }

  @FieldResolver()
  async resolvedName(@Root() object: IServerObject): Promise<string> {
    const trimmedName = object.name?.trim();

    if (trimmedName) return trimmedName;

    if (object.staticItemName) {
      const strings = await this.stringFileService.load('static_item_n');

      return strings[object.staticItemName] || `@static_item_n:${object.staticItemName}`;
    }

    if (object.nameStringTable && object.nameStringText) {
      const strings = await this.stringFileService.load(object.nameStringTable);

      return strings[object.nameStringText] || `@${object.nameStringTable}:${object.nameStringText}`;
    }
    // TODO: Come up with some better default name (perhaps based on the object type or template?)
    return 'UNKNOWN';
  }

  @FieldResolver()
  containedItemCount(@Root() object: IServerObject) {
    return this.objectService.countMany({ containedById: object.id, excludeDeleted: true });
  }
}
