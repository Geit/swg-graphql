import { Field, ID, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class ResourceTypeFractalData {
  @Field(() => ID, { description: 'Planet ID the resource spawns on' })
  planetId: string;

  @Field(() => Int, {
    description: 'Seed to use for the Multifractal defining the resource efficency at a given location',
  })
  seed: number;
}

@ObjectType()
export class ResourceTypeAttribute {
  @Field(() => ID, { description: 'Name of the attribute' })
  attributeId: string;

  @Field(() => Int, { description: 'Value of the attribute' })
  value: number;
}

@ObjectType()
export class ResourceType {
  @Field(() => ID, { nullable: true, description: 'ID of the resource type' })
  id: string;

  @Field(() => String, { nullable: true, description: 'Generated name for this resource type' })
  name: string | null;

  @Field(() => ID, { description: 'Class of the resource' })
  resourceClassId: string | null;

  @Field(() => String, { nullable: true, description: 'Time the resource was depleted. Null if not yet depleted.' })
  depletedTime: string | null;

  @Field(() => [ResourceTypeAttribute], { nullable: true, description: 'Attributes for the resource' })
  attributes: ResourceTypeAttribute[] | null;

  @Field(() => [ResourceTypeFractalData], { nullable: true, description: 'Spawning pool data for the resource' })
  fractalData: ResourceTypeFractalData[] | null;
}
