import { Field, Float, ID, Int, ObjectType } from 'type-graphql';

import { IServerObject, Location } from './ServerObject';
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

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class CreatureObject extends ITangibleObject {
  @Field(() => Float, { nullable: true, description: "The relative scale of the object compared to it's default size" })
  scaleFactor: number | null;

  @Field(() => Int, { nullable: true, description: 'Bitfield representing the currently active states on the object' })
  states: number | null;

  @Field(() => Int, { nullable: true, description: 'Identifier for the current posture of the object' })
  posture: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The amount of shock wounds the creature has',
    deprecationReason: 'Unused in NGE',
  })
  shockWounds: number | null;

  @Field(() => ID, { nullable: true, description: "The Object ID for the creature's master, if any" })
  masterId: string | null;

  @Field(() => Int, { nullable: true, description: 'The current GCW rank index for the creature' })
  rank: number | null;

  @Field(() => Float, { nullable: true, description: 'The speed, in m/s, at which the creature will walk' })
  baseWalkSpeed: number | null;

  @Field(() => Float, { nullable: true, description: 'The speed, in m/s, at which the creature will run' })
  baseRunSpeed: number | null;

  @Field(() => [Float], {
    nullable: true,
    description: "Current values for the creature's attribute pools, such as health and action.",
  })
  attributes: number[] | null;

  @Field({
    nullable: true,
    description:
      'Packed/encoded string containing any buffs that will be reapplied to the creature when it is next active',
  })
  persitedBuffs: string | null;

  @Field(() => [Float], {
    nullable: true,
    description:
      'The location of the creature in world space. That is, this location is irrespective of any containing objects',
  })
  worldspaceLocation: Location | null;
}
