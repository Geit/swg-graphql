import { Field, ID, Int, ObjectType, createUnionType } from 'type-graphql';

import { Account, UnenrichedAccount, UnenrichedServerObject, PlayerCreatureObject } from '@core/types';

export const RollupPartyEntity: UnenrichedServerObject | UnenrichedAccount = createUnionType({
  name: 'RollupPartyEntity',
  types: () => [Account, PlayerCreatureObject] as const,
  resolveType: value => value.constructor.name,
});

@ObjectType()
export class TransactionRollupItem {
  @Field(() => ID)
  oid: string;

  @Field()
  name: string;

  @Field()
  basicName: string;

  @Field()
  template: string;

  @Field({ nullable: true })
  staticName: string;

  @Field(() => Int)
  count: number;

  @Field()
  wasOriginalOwner: boolean;
}

@ObjectType()
export class TransactionRollupParty {
  @Field(() => ID)
  identifier: string;

  @Field()
  identifierType: string;

  @Field(() => [TransactionRollupItem])
  itemsReceived: TransactionRollupItem[];

  @Field(() => Int)
  creditsReceived: number;
}

@ObjectType()
export class TransactionRollup {
  @Field()
  fromDate: string;

  @Field()
  untilDate: string;

  @Field(() => Int)
  totalValue: number;

  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  totalTrades: number;

  @Field(() => [TransactionRollupParty])
  parties: TransactionRollupParty[];
}
