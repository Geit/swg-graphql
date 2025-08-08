import { Field, Int, ID, ObjectType, createUnionType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';
import { PlayerCreatureObject } from './PlayerCreatureObject';
import { Guild } from './Guild';

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class BuildingObject extends ITangibleObject {
  @Field(() => Int, { nullable: true, description: 'The cost per hour to maintain the structure' })
  maintenanceCost: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'The time at which the maintenance for this structure was last paid',
  })
  timeLastChecked: number | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Whether the building is public. Ban/Access lists are stored as property lists within the object',
  })
  isPublic: boolean | null;

  @Field(() => ID, { nullable: true, description: 'The ID of the city that this structure resides within' })
  cityId: string | null;
}

export const AccessListEntry: PlayerCreatureObject | Guild = createUnionType({
  name: 'AccessListEntry',
  types: () => [PlayerCreatureObject, Guild] as const,
  resolveType: value => {
    return value.constructor.name;
  },
});
