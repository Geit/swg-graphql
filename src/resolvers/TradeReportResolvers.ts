import { Arg, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { TransactionRollupService } from '../services/TransactionRollupService';
import { TransactionService } from '../services/TransactionService';
import { TransactionRollup } from '../types/TransactionRollup';
import { isPresent } from '../utils/utility-types';

@Service()
@Resolver()
export class RootResolver {
  constructor(
    // constructor injection of a service
    private readonly rollupService: TransactionRollupService,
    private readonly transactionService: TransactionService
  ) {
    // Do nothing
  }

  @Query(() => [TransactionRollup], { nullable: true })
  async tradeReport(
    @Arg('stationId', { nullable: true }) stationId: string,
    @Arg('from', { defaultValue: 'now-30d' }) from: string,
    @Arg('until', { defaultValue: 'now' }) until: string
  ): Promise<TransactionRollup[] | null> {
    const tradingPartners = await this.transactionService.getTradingPartners(stationId, from, until);

    const rollups = await Promise.all(
      tradingPartners.map(partnerId => this.rollupService.getRollupBetweenParties(stationId, partnerId, from, until))
    );

    const filteredSortedRollups = rollups.filter(isPresent).sort((a, b) => b.totalValue - a.totalValue);

    return filteredSortedRollups;
  }
}
