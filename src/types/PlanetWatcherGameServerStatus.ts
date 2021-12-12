import { Field, ID, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class PlanetWatcherGameServerStatus {
  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => String)
  ipAddress: string;

  @Field(() => String)
  hostName: string;

  @Field(() => Int)
  serverId: number;

  @Field(() => Int)
  systemPid: number;

  @Field(() => ID)
  sceneId: string;
}
