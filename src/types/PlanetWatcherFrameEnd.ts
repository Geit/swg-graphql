import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class PlanetWatcherFrameEnd {
  @Field(() => Int)
  serverId: number;

  @Field(() => Int)
  frameTime: number;

  @Field()
  profilerData: string;
}
