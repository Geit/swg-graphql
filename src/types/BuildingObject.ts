import { Field, Int, ID, ObjectType } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

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
