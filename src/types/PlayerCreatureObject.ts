import { Field, Int, ObjectType } from 'type-graphql';

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

@ObjectType()
export class SkillMod {
  @Field()
  id: string;

  @Field(() => Int)
  value: number;
}

@ObjectType()
export class Skill {
  @Field()
  id: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String, { nullable: true })
  title: string | null;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => [String], { nullable: true })
  commands: string[] | null;

  @Field(() => [SkillMod], { nullable: true })
  skillMods: SkillMod[] | null;

  @Field(() => [String], { nullable: true })
  schematicsRevoked: string[] | null;

  @Field(() => [String], { nullable: true })
  schematicsGranted: string[] | null;

  @Field(() => [String], { nullable: true })
  speciesRequired: string[] | null;

  @Field(() => [String], { nullable: true })
  statsRequired: string[] | null;

  @Field(() => [String], { nullable: true })
  missionsRequired: string[] | null;

  @Field(() => [String], { nullable: true })
  preclusionSkills: string[] | null;

  @Field()
  parent: string;

  @Field(() => Int)
  graphType: number;

  @Field()
  godOnly: boolean;

  @Field()
  isTitle: boolean;

  @Field()
  isProfession: boolean;

  @Field()
  isHidden: boolean;

  @Field(() => Int)
  moneyRequired: number;

  @Field(() => Int)
  pointsRequired: number;

  @Field(() => Int)
  skillsRequiredCount: number;

  @Field()
  xpType: string;

  @Field(() => Int)
  xpCost: number;

  @Field(() => Int)
  xpCap: number;

  @Field()
  apprenticeshipsRequired: string;

  @Field(() => Int)
  jediStateRequired: number;

  @Field()
  skillAbility: string;

  @Field()
  searchable: boolean;

  @Field(() => Int)
  ender: number;
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

  @Field(() => String, { nullable: true, description: 'Time when this character last logged in' })
  lastLoginTime: string | null;

  @Field(() => String, { nullable: true, description: 'Time when this character was created' })
  createdTime: string | null;

  @Field(() => [Skill], { description: 'Skills the player has' })
  skills: Skill[];
}
