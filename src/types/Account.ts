import { Field, Int, ObjectType } from 'type-graphql';

import { PlayerCreatureObject } from './PlayerCreatureObject';
import { UnenrichedServerObject } from './ServerObject';

@ObjectType()
export class Account {
  @Field(() => Int, { description: 'Station ID for the account' })
  stationId: number;

  @Field(() => [PlayerCreatureObject], { description: 'Characters owned by this account', nullable: true })
  characters: UnenrichedServerObject[];
}

export type UnenrichedAccount = Pick<Account, 'stationId'>;
