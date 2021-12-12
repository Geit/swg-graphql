import { Field, ID, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class PlanetWatcherGameServerStatus {
  @Field(() => Boolean)
  isOnline: Boolean;

  @Field(() => String)
  ipAddress: String;

  @Field(() => String)
  hostName: String;

  @Field(() => Int)
  serverId: number;

  @Field(() => Int)
  systemPid: number;

  @Field(() => ID)
  sceneId: string;
}
