import { Field, Float, ID, Int, InterfaceType, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';

@InterfaceType({
  description: 'An object that can exist in the world.',
  resolveType: value => value.constructor.name,
  implements: IServerObject,
})
export class ITangibleObject extends IServerObject {
  @Field(() => Int, { nullable: true, description: 'The maximum hitpoints this object has' })
  maxHitPoints: number;

  @Field(() => ID, {
    nullable: true,
    description: 'Object ID of another object which is considered to own this object',
  })
  ownerId: string | null;

  @Field({ description: 'Whether the object can be seen by players' })
  visible: boolean;

  @Field(() => String, { nullable: true, description: 'Packed buffer determining how the object looks in game' })
  appearanceData: string | null;

  @Field(() => Float, { nullable: true, description: 'The interest radius, in meters ' })
  interestRadius: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Whether the object is currently special force/combatant or on leave',
  })
  pvpType: number | null;

  @Field(() => Int, { nullable: true, description: 'The faction CRC that this object is a part of' })
  pvpFaction: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The amount of damage this object has taken. Can be subtract from maximumHitpoints to get current HP.',
  })
  damageTaken: number | null;

  @Field(() => String, { nullable: true, description: 'Appearance file this object is currently imitating' })
  customAppearance: string | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Number of this object in the current stack represented by this OID',
  })
  count: number | null;

  @Field(() => Int, { nullable: true, description: "Bitfield representing the object's current condition states" })
  condition: number | null;

  @Field(() => ID, { nullable: true, description: 'Object ID of the creature/player that created this object' })
  creatorId: string | null;

  @Field(() => ID, { nullable: true, description: 'ID of the draft schematic that this object was generated from' })
  sourceDraftSchematicId: string | null;
}

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class TangibleObject extends ITangibleObject {}
