import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql';

enum TransactionType {
  'Auction' = 'Auction',
  'Trade' = 'Trade',
  'PickupTrade' = 'PickupTrade',
  'DropTrade' = 'DropTrade',
  'Tip' = 'Tip',
}

registerEnumType(TransactionType, {
  name: 'TransactionType',
});

@ObjectType()
export class TransactionItem {
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
}

@ObjectType()
export class TransactionParty {
  @Field(() => ID)
  stationId: string;

  @Field(() => ID)
  oid: string;

  @Field()
  name: string;

  @Field(() => [TransactionItem])
  itemsReceived: TransactionItem[];

  @Field(() => Int)
  creditsReceived: number;
}

@ObjectType()
export class Transaction {
  @Field(() => ID)
  id: string;

  @Field(() => TransactionType)
  type: TransactionType;

  @Field()
  date: string;

  @Field(() => Int)
  transactionValue: number;

  @Field(() => Int)
  itemCount: number;

  @Field()
  arePartiesSameAccount: boolean;

  @Field(() => [TransactionParty])
  parties: TransactionParty[];
}

@ObjectType()
export class TransactionServiceResponse {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [Transaction])
  results: Transaction[];
}
