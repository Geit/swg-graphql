import { Authorized, FieldResolver, Query, Resolver, Root } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { PERMISSIONS } from '../auth/permissions';
import { ChroniclesService } from '../services/ChroniclesService';
import { ServerObjectService } from '../services/ServerObjectService';
import { PlayerCreatureObject } from '../types';
import { ChroniclerStats } from '../types/Chronicler';

@Service()
@Resolver(() => ChroniclerStats)
export class ChroniclesResolver {
  @Inject()
  private readonly chroniclesService: ChroniclesService;

  @Inject()
  private readonly objectService: ServerObjectService;

  @Query(() => [ChroniclerStats], {
    description:
      'Chronicle Master stats, one entry per chronicler, decoded from the v3 chronicler records in the city object property list. Unranked - rank by questsCreated, questsCompleted, or rating downstream.',
  })
  @Authorized([PERMISSIONS.CHRONICLES_READ])
  chroniclers(): Promise<ChroniclerStats[]> {
    return this.chroniclesService.getChroniclers();
  }

  @FieldResolver(() => PlayerCreatureObject, {
    nullable: true,
    description:
      'The chronicler as a live character node; null if the character no longer exists. Use `name` for the durable recorded name.',
  })
  character(@Root() chronicler: ChroniclerStats) {
    return chronicler.characterOid ? this.objectService.getOne(chronicler.characterOid) : null;
  }
}
