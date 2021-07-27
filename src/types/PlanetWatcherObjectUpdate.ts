import { Field, ID, Int, ObjectType } from 'type-graphql';

import { Location } from './ServerObject';

@ObjectType()
export class PlanetWatcherObjectUpdate {
  @Field(() => ID)
  networkId: String;

  @Field(() => [Int])
  location: Location;

  @Field(() => Int)
  authoritativeServer: number;

  @Field(() => Int)
  interestRadius: number;

  @Field(() => Int)
  deleteObject: number;

  @Field(() => Int)
  objectTypeTag: number;

  @Field(() => Int)
  level: number;

  @Field(() => Int)
  hibernating: number;

  @Field(() => Int)
  templateCrc: number;

  @Field(() => Int)
  aiActivity: number;

  @Field(() => Int)
  creationType: number;
}
