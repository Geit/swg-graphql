import { Authorized, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { PERMISSIONS } from '../auth/permissions';
import { ServerFirstService } from '../services/ServerFirstService';
import { ServerObjectService } from '../services/ServerObjectService';
import { PlayerCreatureObject } from '../types';
import { ServerFirst } from '../types/ServerFirst';

@Service()
@Resolver(() => ServerFirst)
export class ServerFirstResolver {
  @Inject()
  private readonly serverFirstService: ServerFirstService;

  @Inject()
  private readonly objectService: ServerObjectService;

  @Query(() => [ServerFirst], {
    description:
      'Server-first collection completions: the first character on the galaxy to finish each Collection, newest first. Read from the Tatooine planet object objvars.',
  })
  @Authorized([PERMISSIONS.SERVER_FIRSTS_READ])
  serverFirsts(): Promise<ServerFirst[]> {
    return this.serverFirstService.getServerFirsts();
  }

  @FieldResolver(() => PlayerCreatureObject, {
    nullable: true,
    description:
      'The first completer as a full character node, loaded by oid so it batches; null if the character no longer exists. Use `characterName` for the durable recorded name.',
  })
  character(@Root() serverFirst: ServerFirst) {
    return serverFirst.characterOid ? this.objectService.getOne(serverFirst.characterOid) : null;
  }
}
