import { FieldResolver, Int, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { GuildService } from '../services/GuildService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { PlayerCreatureObject } from '../types';
import { Guild, GuildEnemy, GuildMember } from '../types/Guild';
import getStringCrc from '../utils/crc';

const IMPERIAL_CRC = getStringCrc('imperial');
const REBEL_CRC = getStringCrc('rebel');

@Resolver(() => Guild)
@Service()
export class GuildResolver /* implements ResolverInterface<Guild> */ {
  constructor(private readonly objectService: ServerObjectService, private readonly stringService: StringFileLoader) {
    // Do nothing
  }

  @FieldResolver(() => PlayerCreatureObject, { nullable: true, description: 'The current leader of the guild' })
  leader(@Root() guild: Guild) {
    return this.objectService.getOne(guild.leaderId);
  }

  @FieldResolver(() => Int, { description: 'Number of members in the guild' })
  memberCount(@Root() guild: Guild) {
    return guild.members.length;
  }

  @FieldResolver(() => Int, { description: 'Number of enemies the guild has' })
  enemyCount(@Root() guild: Guild) {
    return guild.enemies?.length ?? 0;
  }

  @FieldResolver(() => String, { nullable: true, description: 'Name of the faction the guild represents' })
  faction(@Root() guild: Guild) {
    if (guild.factionCrc === IMPERIAL_CRC) return 'Imperial';
    else if (guild.factionCrc === REBEL_CRC) return 'Rebel';

    return null;
  }

  @FieldResolver(() => String, { nullable: true, description: 'Name of the faction the guild represents' })
  async gcwDefenderRegionResolved(@Root() guild: Guild) {
    if (!guild.gcwDefenderRegion) return null;

    const gcwRegions = await this.stringService.load('gcw_regions');

    return gcwRegions?.[guild.gcwDefenderRegion] ?? null;
  }
}

@Resolver(() => GuildMember)
@Service()
export class GuildMemberResolver /* implements ResolverInterface<GuildMember> */ {
  constructor(private readonly objectService: ServerObjectService, private readonly stringService: StringFileLoader) {
    // Do nothing
  }

  @FieldResolver(() => PlayerCreatureObject, { nullable: true })
  object(@Root() member: GuildMember) {
    return this.objectService.getOne(member.id);
  }

  @FieldResolver(() => String)
  async skillTemplateTitle(@Root() member: GuildMember) {
    const skillTitles = await this.stringService.load('ui_roadmap');

    return (member.skillTemplate && skillTitles?.[member.skillTemplate]) ?? 'Unknown';
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
