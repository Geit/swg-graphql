import { Arg, Authorized, FieldResolver, ID, Query, Resolver, Root } from 'type-graphql';
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
      'Chronicle Master stats decoded from the v3 chronicler records in the city object property list; one entry per chronicler, with no inherent ordering.',
  })
  @Authorized([PERMISSIONS.CHRONICLES_READ])
  chroniclers(): Promise<ChroniclerStats[]> {
    return this.chroniclesService.getChroniclers();
  }

  @Query(() => ChroniclerStats, {
    nullable: true,
    description: "A single chronicler's stats by character oid, or null if that chronicler has no record.",
  })
  @Authorized([PERMISSIONS.CHRONICLES_READ])
  chronicler(@Arg('oid', () => ID) oid: string): Promise<ChroniclerStats | null> {
    return this.chroniclesService.getChronicler(oid);
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
