import { Arg, FieldResolver, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { CellObjectService } from '../services/CellObjectService';
import { CellObject } from '../types/CellObject';
import { IServerObject } from '../types/ServerObject';

@Resolver(() => CellObject)
@Service()
export class CellObjectResolver implements ResolverInterface<CellObject> {
  constructor(private readonly cellObjectService: CellObjectService) {
    // Do nothing
  }

  @FieldResolver()
  async cellNumber(@Root() object: IServerObject) {
    const rc = await this.cellObjectService.load(object.id);
    return rc?.CELL_NUMBER ?? null;
  }

  @FieldResolver()
  async isPublic(@Root() object: IServerObject) {
    const rc = await this.cellObjectService.load(object.id);
    return rc?.IS_PUBLIC === 'Y';
  }

  @FieldResolver(() => String)
  async resolvedName(
    @Root() object: IServerObject,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Arg('resolveCustomNames', { defaultValue: false }) _resolveCustomNames: boolean
  ) {
    const rc = await this.cellObjectService.load(object.id);

    if (!rc || !rc.CELL_NUMBER) {
      return 'Cell Object';
    }

    return `Cell #${rc?.CELL_NUMBER}`;
  }
}
