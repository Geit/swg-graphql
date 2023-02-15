import { Arg, Query, Resolver, FieldResolver, Root, Authorized } from 'type-graphql';
import { Inject, Service } from 'typedi';
import { ServerObjectService } from '@core/services/ServerObjectService';
import { Account } from '@core/types';

import { TransactionRollupService } from '../services/TransactionRollupService';
import { TransactionService } from '../services/TransactionService';
import { TransactionRollup, TransactionRollupParty, RollupPartyEntity } from '../types/TransactionRollup';

@Service()
@Resolver()
export class RootResolver {
  @Inject()
  private readonly rollupService: TransactionRollupService;

  @Query(() => TransactionRollup, { nullable: true })
  @Authorized()
  transactionRollup(
    @Arg('partyA', { nullable: true }) partyA: string,
    @Arg('partyB', { nullable: true }) partyB: string,
    @Arg('from', { defaultValue: 'now-30d' }) from: string,
    @Arg('until', { defaultValue: 'now' }) until: string
  ): Promise<TransactionRollup | null> {
    // TODO: Need to check that both parties are actually valid.

    return this.rollupService.getRollupBetweenParties(partyA, partyB, from, until);
  }
}

@Service()
@Resolver(() => TransactionRollupParty)
export class TransactionRollupPartyResolver {
  constructor(
    // constructor injection of a service
    private readonly rollupService: TransactionRollupService,
    private readonly transactionService: TransactionService,
    private readonly objectService: ServerObjectService
  ) {
    // Do nothing
  }

  @FieldResolver(() => RollupPartyEntity, { nullable: true })
  entity(@Root() party: TransactionRollupParty) {
    if (party.identifierType === 'stationId') {
      const account = new Account();
      account.id = parseInt(party.identifier);
      return account;
    }

    if (party.identifierType === 'oid') {
      return this.objectService.getOne(party.identifier);
    }

    return null;
  }
}
