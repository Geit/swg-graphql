import { Field, ObjectType } from 'type-graphql';

import { Account, UnenrichedAccount } from './Account';
import { CreatureObject } from './CreatureObject';
import { IServerObject, UnenrichedServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

export enum Attributes {
  Health,
  Constitution,
  Action,
  Stamina,
  Mind,
  Willpower,
  NumberOfAttributes,
}

/**
 * Player Creature Object isn't a real SWG thing, but allows us to do type refinement and grant access
 * to additional fields for players.
 */
@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class PlayerCreatureObject extends CreatureObject {
  @Field(() => [IServerObject], { description: 'Objects which this player owns', nullable: true })
  ownedObjects: UnenrichedServerObject[];

  @Field(() => Account, { nullable: true, description: 'Information on the Account that owns this player' })
  account: UnenrichedAccount | null;
}
