import { Field, ObjectType, ID } from 'type-graphql';

import { PlayerCreatureObject } from './PlayerCreatureObject';
import { IServerObject, UnenrichedServerObject } from './ServerObject';

@ObjectType()
export class AccountVeteranRewardEntry {
  @Field(() => String)
  type: 'event' | 'item';

  @Field()
  id: string;

  @Field()
  claimDate: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String)
  characterId: string;

  @Field(() => PlayerCreatureObject, { nullable: true })
  character: UnenrichedServerObject | null;
}

@ObjectType()
export class Account {
  @Field(() => ID, { description: 'Station ID for the account' })
  id: number;

  @Field(() => String, { description: 'Name for the account', nullable: true })
  accountName: string | null;

  @Field(() => [PlayerCreatureObject], { description: 'Characters owned by this account', nullable: true })
  characters: UnenrichedServerObject[];

  @Field(() => [IServerObject], { description: 'Objects which this account owns', nullable: true })
  ownedObjects: UnenrichedServerObject[];

  @Field(() => [AccountVeteranRewardEntry], { description: 'Objects which this account owns', nullable: true })
  veteranRewards: AccountVeteranRewardEntry[];
}

export type UnenrichedAccount = Pick<Account, 'id'>;
