import { Field, ID, Int, ObjectType } from 'type-graphql';

import { PlayerCreatureObject } from '.';

@ObjectType()
export class GuildMember {
  @Field(() => ID, { description: 'OID of the Guild Member' })
  id: string;

  @Field({ description: 'Last seen name of the guild member' })
  name: string;

  @Field(() => String, { nullable: true, description: 'Class of the guild member' })
  skillTemplate: string | null;

  @Field(() => Int, { nullable: true, description: 'Level of the guild member' })
  level: number | null;

  @Field(() => Int, { description: 'Permissions bitfield the guild member has' })
  permissions: number;

  @Field({ description: 'ID of the guild title the member has' })
  title: string;

  @Field(() => String, { nullable: true, description: 'ID of the rank(s) the member has' })
  rank: string | null;

  @Field(() => ID, { description: 'OID of the person the user last voted for in an election' })
  allegianceOid: string;

  // @Field(() => ID, { description: 'PlayerCreatureObject for the member' })
  // object?: PlayerCreatureObject;
}

@ObjectType()
export class GuildEnemy {
  @Field(() => ID, { description: 'Guild ID of the Guild Enemy' })
  id: string;

  @Field(() => Int, { nullable: true, description: 'Last seen name of the guild member' })
  killCount: number | null;

  @Field(() => Int, { nullable: true, description: 'Class of the guild member' })
  lastUpdateTime: number | null;
}

@ObjectType()
export class Guild {
  @Field(() => ID, { description: 'ID of the guild' })
  id: string;

  @Field({ description: 'Full name of the guild' })
  name: string;

  @Field({ description: 'Guild short-code/tag that appears above player names' })
  abbreviation: string;

  @Field(() => ID, { description: 'ID of the current leader of the guild' })
  leaderId: string;

  @Field(() => [GuildMember], { description: 'A list of all members currently within the guild' })
  members: GuildMember[];

  @Field(() => [GuildEnemy], { nullable: true, description: 'A list of all enemy guilds' })
  enemies: GuildEnemy[] | null;

  @Field(() => Int, { nullable: true, description: 'Game time when the last guild election ended' })
  electionPreviousEndTime: number | null;

  @Field(() => Int, { nullable: true, description: 'Game time when the last guild election ended' })
  electionNextEndTime: number | null;

  @Field(() => Int, { nullable: true, description: 'CRC of the faction the guild is declared to' })
  faction: number | null;

  @Field(() => Int, { nullable: true, description: 'When the guild last went neutral from its previous faction' })
  timeLeftGuildFaction: number | null;

  @Field(() => String, { nullable: true, description: 'Name of the region the guild is registered as defender for' })
  gcwDefenderRegion: string | null;

  @Field(() => Int, { nullable: true, description: 'When the guild joined its defender region' })
  timeJoinedGcwDefenderRegion: number | null;

  @Field(() => Int, { nullable: true, description: 'When the guild last removed its previous defender region' })
  timeLeftGcwDefenderRegion: number | null;
}
