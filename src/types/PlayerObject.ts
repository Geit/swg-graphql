import { Field, Float, Int, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { IIntangibleObject } from './IntangibleObject';

@ObjectType({ implements: [IIntangibleObject, IServerObject] })
export class PlayerObject extends IIntangibleObject {
  @Field(() => Int, { nullable: true, description: "The player's station id" })
  stationId: number | null;

  @Field(() => Int, { nullable: true, description: "The player's profile id" })
  personalProfileId: string | null;

  @Field(() => String, { nullable: true, description: "The charcter's profile id" })
  characterProfileId: string | null;

  @Field(() => String, { nullable: true, description: 'Title ID that the player is currently wearing' })
  skillTitle: string | null;

  @Field(() => Int, { nullable: true, description: 'Server time the character was created at' })
  bornDate: number | null;

  @Field(() => Int, { nullable: true, description: 'Number of seconds the character has been logged in for in total' })
  playedTime: number | null;

  @Field(() => Float, { nullable: true, deprecationReason: 'Not used in NGE' })
  forceRegenRate: number | null;

  @Field(() => Int, { nullable: true, deprecationReason: 'Not used in NGE' })
  forcePower: number | null;

  @Field(() => Int, { nullable: true, deprecationReason: 'Not used in NGE' })
  maxForcePower: number | null;

  @Field(() => Int, { nullable: true, description: 'Number of lots the character has' })
  numLots: number | null;

  @Field(() => String, { nullable: true, description: 'Quests the player currently has active' })
  activeQuests: string | null;

  @Field(() => String, { nullable: true, description: 'Quests the player has completed' })
  completedQuests: string | null;

  @Field(() => Int, { nullable: true, description: 'Quest ID the player currently has active in their tracker' })
  currentQuest: number | null;

  @Field(() => String, { nullable: true, description: "Packed String representing the player's quest/task status" })
  quests: string | null;

  @Field(() => Int, { nullable: true, description: "Packed String representing the player's quest/task status" })
  roleIconChoice: number | null;

  @Field(() => String, { nullable: true, description: "The player's class" })
  skillTemplate: string | null;

  @Field(() => String, { nullable: true, description: 'The skill the player has achieved' })
  workingSkill: string | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The amount of GCW Points the player has in their current GCW Cycle',
  })
  currentGcwPoints: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The GCW rating (rank) of the player',
  })
  currentGcwRating: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The amount of PVP Kills the player has in their current GCW Cycle',
  })
  currentPvpKills: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The amount of GCW Points that the player has earned for this faction since they joined',
  })
  lifetimeGcwPoints: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The maximum rating/rank the player has ever reached for the Empire',
  })
  maxGcwImperialRating: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The maximum rating/rank the player has ever reached for the Rebellion',
  })
  maxGcwRebelRating: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The total of PVP kills the player has got in their lifetime',
  })
  lifetimePvpKills: number | null;

  @Field(() => Int, {
    nullable: true,
    description:
      'Game time for when the player is next due to have their ranks recalculated. Rank calculations are repeated on next login until this is less than 7 days away',
  })
  nextGcwRatingCalcTime: number | null;

  @Field(() => String, {
    nullable: true,
    description: "Packed string representing the player's colleciton state.",
  })
  collections: string | null;

  @Field({
    description: 'Whether the player currently has their backpack displayed',
  })
  showBackpack: boolean;

  @Field({
    description: 'Whether the player currently has their helmet displayed',
  })
  showHelmet: boolean;
}
