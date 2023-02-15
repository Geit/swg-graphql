import { Arg, Authorized, FieldResolver, Int, Query, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Service } from 'typedi';

import { Transaction, TransactionServiceResponse } from '../types/Transaction';
import { TransactionService, GetManyFilters } from '../services/TransactionService';

@Service()
@Resolver()
export class RootResolver {
  constructor(
    // constructor injection of a service
    private readonly transactionService: TransactionService
  ) {
    // Do nothing
  }

  @Query(() => Transaction, { nullable: true })
  @Authorized()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transaction(@Arg('transaction', { nullable: false }) transactionId: string): Promise<Transaction | null> {
    //return this.objectService.getOne(transactionId);
    return new Promise(resolve => resolve(null));
  }

  @Query(() => TransactionServiceResponse, { nullable: true })
  @Authorized()
  transactions(
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('from', () => Int, { defaultValue: 0 }) from: number,
    @Arg('arePartiesSameAccount', () => Boolean, { defaultValue: null, nullable: true })
    arePartiesSameAccount: boolean | null,
    @Arg('beforeDate', { defaultValue: 'now' }) beforeDate: string,
    @Arg('afterDate', { defaultValue: 'now-1d' }) afterDate: string,
    @Arg('searchText', { nullable: true }) searchText?: string,
    @Arg('parties', () => [String], { nullable: true }) parties?: string[],
    @Arg('sortField', () => String, { nullable: true }) sortField?: GetManyFilters['sortField'],
    @Arg('sortDirection', () => String, { nullable: true }) sortDirection?: GetManyFilters['sortDirection']
  ): Promise<TransactionServiceResponse | null> {
    // Note: Sometimes when selecting a date like "this year", Elastic's date pickers will set both the before/until
    // to the same value.
    const realBeforeDate = beforeDate === afterDate ? 'now' : beforeDate;

    return this.transactionService.getMany({
      searchText,
      arePartiesSameAccount,
      size: limit,
      from,
      untilDate: realBeforeDate,
      fromDate: afterDate,
      parties,
      sortField,
      sortDirection,
    });
  }
}

@Service()
@Resolver(() => Transaction)
export class TransactionResolver implements ResolverInterface<Transaction> {
  @FieldResolver()
  date(@Root() transaction: Transaction) {
    // @ts-expect-error oops
    return transaction['@timestamp'];
  }
}
