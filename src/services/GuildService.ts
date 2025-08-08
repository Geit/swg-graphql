import { Inject, Service } from 'typedi';

import { GUILD_UPDATE_INTERVAL } from '../config';
import { Guild, GuildMember } from '../types';
import { PropertyListIds } from '../types/PropertyList';

import knexDb from './db';
import { PropertyListService } from './PropertyListService';

/**
 * Derived from guild_objects.tab
 */
interface GuildObjectRecord {
  OBJECT_ID: number;
}

@Service({
  global: true,
  eager: true,
})
export class GuildService {
  @Inject()
  private readonly propertyListService: PropertyListService;

  private _guilds: Map<string, Guild> = new Map();
  private _memberIdToGuildId: Map<GuildMember['id'], Guild['id']> = new Map();
  private _currentUpdateCycle: Promise<void> | null = null;
  private lastUpdateTime = 0;

  async getAllGuilds() {
    await this.updateGuildsIfNeeded();

    return this._guilds;
  }

  async getGuild(id: string) {
    await this.updateGuildsIfNeeded();

    return this._guilds?.get(id) ?? null;
  }

  async getGuildForPlayer(playerId: string) {
    await this.updateGuildsIfNeeded();

    const guildId = this._memberIdToGuildId.get(playerId);

    if (guildId) {
      return this._guilds.get(guildId) ?? null;
    }

    return null;
  }

  async updateGuildsIfNeeded() {
    const timeDiffFromLastUpdate = Date.now() - this.lastUpdateTime;

    if (!this._currentUpdateCycle && timeDiffFromLastUpdate > GUILD_UPDATE_INTERVAL) {
      this._currentUpdateCycle = this._updateGuilds();
      await this._currentUpdateCycle;
      this._currentUpdateCycle = null;
      this.lastUpdateTime = Date.now();
    }

    await this._currentUpdateCycle;
  }

  private async _updateGuilds() {
    const results = await knexDb.first().from<GuildObjectRecord>('GUILD_OBJECTS');

    const guilds: Map<string, Guild> = new Map();
    const memberIdToGuildId: Map<GuildMember['id'], Guild['id']> = new Map();

    const updateGuildData = (data: Partial<Guild> & Pick<Guild, 'id'>) => {
      const guildToUpdate = guilds.get(data.id);

      if (guildToUpdate) {
        guilds.set(data.id, Object.assign(guildToUpdate, data));
      } else {
        const newGuild = new Guild();
        guilds.set(data.id, Object.assign(newGuild, data));
      }
    };

    if (!results) {
      return;
    }

    // This should give us
    const pLists = await this.propertyListService.load({ objectId: String(results.OBJECT_ID) });

    pLists.forEach(pList => {
      switch (pList.listId) {
        case PropertyListIds.GuildNames: {
          // GuildNames is in one of three formats
          // - `v3:guildId:guildName:guildElectionPreviousEndTime:guildElectionNextEndTime:guildFaction:timeLeftGuildFaction:guildGcwDefenderRegion:timeJoinedGuildGcwDefenderRegion:timeLeftGuildGcwDefenderRegion`
          // - `v2:guildId:guildName:guildElectionPreviousEndTime:guildElectionNextEndTime`
          // - `guildId:guildName`

          if (pList.value.startsWith('v3:')) {
            const [
              ,
              id,
              name,
              electionPreviousEndTime,
              electionNextEndTime,
              factionCrc,
              timeLeftGuildFaction,
              gcwDefenderRegion,
              timeJoinedGcwDefenderRegion,
              timeLeftGcwDefenderRegion,
            ] = pList.value.split(':');

            updateGuildData({
              id,
              name,
              electionPreviousEndTime: parseInt(electionPreviousEndTime),
              electionNextEndTime: parseInt(electionNextEndTime),
              factionCrc: parseInt(factionCrc),
              timeLeftGuildFaction: parseInt(timeLeftGuildFaction),
              gcwDefenderRegion,
              timeJoinedGcwDefenderRegion: parseInt(timeJoinedGcwDefenderRegion),
              timeLeftGcwDefenderRegion: parseInt(timeLeftGcwDefenderRegion),
            });
          } else if (pList.value.startsWith('v2:')) {
            const [, id, name, electionPreviousEndTime, electionNextEndTime] = pList.value.split(':');

            updateGuildData({
              id,
              name,
              electionPreviousEndTime: parseInt(electionPreviousEndTime),
              electionNextEndTime: parseInt(electionNextEndTime),
            });
          } else {
            const [id, name] = pList.value.split(':');

            updateGuildData({
              id,
              name,
            });
          }
          break;
        }

        case PropertyListIds.GuildAbbrevs: {
          // GuildNames is in format `id:abbr`
          const [id, abbreviation] = pList.value.split(':');
          updateGuildData({
            id,
            abbreviation,
          });
          break;
        }

        case PropertyListIds.GuildLeaders: {
          // GuildLeaders is in format `id:leaderOid`
          const [id, oid] = pList.value.split(':');
          updateGuildData({
            id,
            leaderId: oid,
          });
          break;
        }

        case PropertyListIds.GuildEnemies: {
          // GuildEnemies is in formats
          // - `v2:id:enemyId:killCount:lastUpdateTime`
          // - `id:enemyId`
          if (pList.value.startsWith('v2:')) {
            const [, id, enemyId, killCount, lastUpdateTime] = pList.value.split(':');
            const enemies = guilds.get(id)?.enemies ?? [];
            enemies.push({
              id: enemyId,
              killCount: parseInt(killCount),
              lastUpdateTime: parseInt(lastUpdateTime),
            });
            updateGuildData({
              id,
              enemies,
            });
          } else {
            const [id, enemyId] = pList.value.split(':');
            const enemies = guilds.get(id)?.enemies ?? [];
            enemies.push({
              id: enemyId,
              killCount: null,
              lastUpdateTime: null,
            });
            updateGuildData({
              id,
              enemies,
            });
          }
          break;
        }

        case PropertyListIds.GuildMembers: {
          // GuildMembers is in one of two formats
          // - `v2:guildId:memberId:memberName:memberClass:memberLevel:permissions:title:allegiance:rank`
          // - `guildId:memberId:memberName:permissions:title:allegiance`

          if (pList.value.startsWith('v2:')) {
            const [, id, memberId, memberName, memberClass, memberLevel, permissions, title, allegiance, rank] =
              pList.value.split(':');
            const members = guilds.get(id)?.members ?? [];

            members.push({
              id: memberId,
              name: memberName,
              skillTemplate: memberClass,
              level: parseInt(memberLevel),
              permissions: parseInt(permissions),
              title,
              allegianceOid: allegiance,
              rank,
            });
            memberIdToGuildId.set(memberId, id);
            updateGuildData({
              id,
              members,
            });
          } else {
            const [id, memberId, memberName, permissions, title, allegiance] = pList.value.split(':');
            const members = guilds.get(id)?.members ?? [];

            members.push({
              id: memberId,
              name: memberName,
              skillTemplate: null,
              level: null,
              permissions: parseInt(permissions),
              title,
              allegianceOid: allegiance,
              rank: null,
            });

            memberIdToGuildId.set(memberId, id);
            updateGuildData({
              id,
              members,
            });
          }
          break;
        }

        default:
          break;
      }
    });

    this._guilds = guilds;
    this._memberIdToGuildId = memberIdToGuildId;
  }
}
