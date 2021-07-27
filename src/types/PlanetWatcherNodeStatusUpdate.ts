import { Field, Int, ObjectType } from 'type-graphql';

import { Location } from './ServerObject';

@ObjectType()
export class PlanetWatcherNodeStatusUpdate {
  @Field(() => Int)
  cellIndex: number;

  @Field(() => [Int])
  location: Location;

  @Field(() => Boolean)
  isLoaded: boolean;

  @Field(() => Int)
  serverCount: number;

  @Field(() => [Int], { nullable: true })
  serverIds: number[];

  @Field(() => Int)
  subscriptionCount: number;

  @Field(() => [Int])
  subscriptions: number[];
}
