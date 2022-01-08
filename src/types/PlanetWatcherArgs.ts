import { ArgsType, Field, ID } from 'type-graphql';

@ArgsType()
export class PlanetWatcherArgs {
  @Field(() => ID, {
    description: 'The planet to watch for updates on',
  })
  planet: string;
  @Field(() => ID, {
    description: 'A unique ID for the querying client, used to replay any existing state on connection',
  })
  clientId: string;
}
