import { Field, ObjectType, Float, Int } from 'type-graphql';

import { IServerObject } from './ServerObject';
import { ITangibleObject } from './TangibleObject';

@ObjectType()
export class ManfSchematicAttribute {
  @Field(() => String, { description: 'Attribute identifier (e.g. crafting:damage)' })
  name: string;

  @Field(() => Float, { nullable: true, description: 'Attribute value baked into the schematic' })
  value: number | null;
}

@ObjectType({ implements: [ITangibleObject, IServerObject] })
export class ManfSchematicObject extends ITangibleObject {
  @Field(() => String, { nullable: true, description: 'The name of the creator of this manufacturing schematic' })
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

  @Field(() => [ManfSchematicAttribute], { description: 'Crafting attributes baked into the schematic' })
  attributes: ManfSchematicAttribute[];
}
