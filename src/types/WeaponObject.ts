import { Field, Float, Int, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class WeaponObject extends ITangibleObject {
  @Field(() => Int, { nullable: true, description: 'The minimum damage of the weapon' })
  minDamage: number | null;

  @Field(() => Int, { nullable: true, description: 'The minimum damage of the weapon' })
  maxDamage: number | null;

  @Field(() => Int, { nullable: true, description: 'Bitfield representing the damage type(s) this weapon does' })
  damageType: number | null;

  @Field(() => Int, { nullable: true, description: 'Bitfield representing the elemental type(s) this weapon inflicts' })
  elementalType: number | null;

  @Field(() => Int, { nullable: true, description: "Strength of the weapon's elemental proc" })
  elementalValue: number | null;

  @Field(() => Float, { nullable: true, description: 'Interval between attacks for this weapon' })
  attackSpeed: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'Chance in percent that this weapon will inflict wounds on hit',
    deprecationReason: 'Unused in NGE.',
  })
  woundChance: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Chance in percent that an attack with this weapon will land on the target',
    deprecationReason: 'Unusued in NGE.',
  })
  accuracy: number | null;

  @Field(() => Int, { nullable: true, description: 'Amount of action that each basic attack with this weapon costs' })
  attackCost: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'The radius, in meters, around the target in which this weapon will do damage',
  })
  damageRadius: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'The minimum range the target has to be for this weapon to be effective',
  })
  minRange: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'The maximum range the target can be for this weapon to be effective',
  })
  maxRange: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'Computed property representing the damage per second this weapon does.',
  })
  dps: number | null;
}
