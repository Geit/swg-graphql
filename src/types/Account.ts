import { Field, ObjectType, ID } from 'type-graphql';

import { PlayerCreatureObject } from './PlayerCreatureObject';
import { UnenrichedServerObject } from './ServerObject';

@ObjectType()
export class Account {
  @Field(() => ID, { description: 'Station ID for the account' })
  id: number;

  @Field(() => String, { description: 'Name for the account', nullable: true })
  accountName: string | null;

  @Field(() => [PlayerCreatureObject], { description: 'Characters owned by this account', nullable: true })
  characters: UnenrichedServerObject[];
}

export type UnenrichedAccount = Pick<Account, 'id'>;
