import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { GuildService } from '../services/GuildService';
import { ServerObjectService } from '../services/ServerObjectService';
import { PlayerCreatureObject } from '../types';
import { Guild, GuildEnemy, GuildMember } from '../types/Guild';

@Resolver(() => Guild)
@Service()
export class GuildResolver /* implements ResolverInterface<GuildMember> */ {
  constructor(private readonly objectService: ServerObjectService) {
    // Do nothing
  }

  @FieldResolver(() => PlayerCreatureObject, { description: 'The current leader of the guild' })
  leader(@Root() guild: Guild) {
    return this.objectService.getOne(guild.leaderId);
  }
}

@Resolver(() => GuildMember)
@Service()
export class GuildMemberResolver /* implements ResolverInterface<GuildMember> */ {
  constructor(private readonly objectService: ServerObjectService) {
    // Do nothing
  }

  @FieldResolver(() => PlayerCreatureObject)
  object(@Root() member: GuildMember) {
    return this.objectService.getOne(member.id);
  }
}

@Resolver(() => GuildEnemy)
@Service()
export class GuildEnemyResolver /* implements ResolverInterface<GuildEnemy> */ {
  constructor(private readonly guildService: GuildService) {
    // Do nothing
  }

  @FieldResolver(() => Guild, { nullable: true })
  guild(@Root() enemy: GuildEnemy) {
    return this.guildService.getGuild(enemy.id);
  }
}
