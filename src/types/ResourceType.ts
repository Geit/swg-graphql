import { Field, Float, ID, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class ResourceTypePlanetDistribution {
  @Field(() => ID, { description: 'Planet ID the resource spawns on' })
  planetId: string;

  @Field(() => Int, {
    description: 'Seed to use for the Multifractal defining the resource efficency at a given location',
  })
  seed: number;
}

@ObjectType()
export class ResourceTypeFractalData {
  @Field(() => Int)
  poolSizeMin: number;

  @Field(() => Int)
  poolSizeMax: number;

  @Field(() => String)
  type: string;

  @Field(() => Float)
  xScale: number;

  @Field(() => Float)
  yScale: number;

  @Field(() => Float)
  bias: number;

  @Field(() => Float)
  gain: number;

  @Field(() => Int)
  comboRule: number;

  @Field(() => Float)
  frequency: number;

  @Field(() => Float)
  amplitude: number;

  @Field(() => Int)
  octaves: number;
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
  @Field(() => ID, { description: 'ID of the resource type' })
  id: string;

  @Field(() => String, { nullable: true, description: 'Generated name for this resource type' })
  name: string | null;

  @Field(() => ID, { description: 'Class of the resource' })
  classId: string | null;

  @Field(() => Int, { nullable: true, description: 'Time the resource was depleted. Null if not yet depleted.' })
  depletedTime: number | null;

  @Field(() => [ResourceTypeAttribute], { nullable: true, description: 'Attributes for the resource' })
  attributes: ResourceTypeAttribute[] | null;

  @Field(() => [ResourceTypePlanetDistribution], { nullable: true, description: 'Spawning pool data for the resource' })
  planetDistribution: ResourceTypePlanetDistribution[] | null;
}

@ObjectType()
export class ResourceTypeResult {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [ResourceType])
  results: ResourceType[];
}
