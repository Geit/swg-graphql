import { Field, ID, ObjectType, Float, Int } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class ManfSchematicObject extends ITangibleObject {
  @Field(() => ID, { nullable: true, description: 'The Object ID of the creator of this manufacturing schematic' })
  creatorId: string | null;

  @Field({ nullable: true, description: 'The name of the creator of this manufacturing schematic' })
  creatorName: string | null;

  @Field(() => Int, {
    nullable: true,
    description:
      'The number of crafted items that should be placed within a single factory crate for this manufacturing schematic',
  })
  itemsPerContainer: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'The amount of time, in seconds, for each item in the schematic to be crafted by an installation',
  })
  manufactureTime: number | null;

  @Field(() => Int, { nullable: true, description: 'The ID of the Draft Schematic' })
  draftSchematic: number | null;
}
