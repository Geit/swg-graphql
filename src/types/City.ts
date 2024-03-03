import {} from 'graphql';
import { Field, Float, ID, Int, ObjectType } from 'type-graphql';

import { LocationXZ, Location } from './ServerObject';

@ObjectType()
export class CityStructure {
  @Field(() => ID, { description: 'OID of the Structure' })
  id: string;

  @Field(() => Int, { description: 'Type of the structure' })
  type: number;

  @Field({ description: 'Whether the sturcture is valid' })
  isValid: boolean;
}

@ObjectType()
export class Citizen {
  @Field(() => ID, { description: 'OID of the Citzen' })
  id: string;

  @Field({ description: 'Full name of the Citizen' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Class of the Citizen' })
  skillTemplate: string | null;

  @Field(() => Int, { nullable: true, description: 'Last seen level of the Citizen' })
  level: number | null;

  @Field(() => String, { nullable: true, description: 'Last seen title of the Citizen' })
  title: string | null;

  @Field(() => ID, { nullable: true, description: 'ID of the player the Citizen last voted for' })
  allegiance: string | null;

  @Field(() => Int, { description: 'Permissions of the Citizen' })
  permissions: number;

  @Field(() => String, { nullable: true, description: 'Rank string for the Citizen' })
  rank: string | null;
}

@ObjectType()
export class City {
  @Field(() => ID, { description: 'ID of the city' })
  id: string;

  @Field({ description: 'Full name of the city' })
  name: string;

  @Field(() => ID, { description: 'OID of the City Hall' })
  cityHallId: string;

  @Field(() => ID, { description: 'Scene ID the City is located in' })
  planet: string;

  @Field(() => [Int], { description: 'XZ Location of the City' })
  location: LocationXZ;

  @Field(() => Int, { description: 'Radius of the City in Meters' })
  radius: number;

  @Field(() => Int, { nullable: true, description: 'Game time when the city was created' })
  creationTime: number | null;

  @Field(() => ID, { description: 'OID of the current Mayor of the City' })
  mayorId: string;

  @Field(() => Int, { description: 'The rate of income tax in the City' })
  incomeTax: number;

  @Field(() => Int, { description: 'The rate of property tax in the City' })
  propertyTax: number;

  @Field(() => Int, { description: 'The rate of sales tax in the City' })
  salesTax: number;

  @Field(() => [Float], { description: 'The location of the City shuttleport' })
  travelLocation: Location;

  @Field(() => Int, { description: 'The cost of travelling to the City via the Travel Network' })
  travelCost: number;

  @Field({ description: 'The cost of travelling to the City via the Travel Network' })
  travelInterplanetary: boolean;

  @Field(() => [Float], { description: "The location of the City's cloner" })
  cloneLocation: Location;

  @Field(() => [Float], { description: "The location of the City's cloner" })
  cloneRespawnLocation: Location;

  @Field(() => ID, { description: 'The OID of the Cell that clones will spawn in' })
  cloneRespawnCellId: string;

  @Field(() => ID, { description: 'The OID of the Cloning center(?)' })
  cloneId: string;

  @Field(() => [Citizen], { description: 'Information about the citizens of the City' })
  citizens: Citizen[];

  @Field(() => [CityStructure], { description: 'Information about the structures that make up the city' })
  structures: CityStructure[];
}

@ObjectType()
export class CityStructureSummary {
  @Field(() => Int, { description: 'Number of decorations within the city' })
  decoCount: number;

  @Field(() => Int, { description: 'Number of terminals within the city' })
  terminalCount: number;

  @Field(() => Int, { description: 'Number of skill trainers within the city' })
  skillTrainerCount: number;
}
