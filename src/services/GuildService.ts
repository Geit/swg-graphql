import e from 'express';
import { Service } from 'typedi';

import { Guild } from '../types';
import { PropertyListIds } from '../types/PropertyList';

import knexDb from './db';
import { PropertyListService } from './PropertyListService';

/**
 * Derived from property_lists.tab
 *
 */
interface GuildObjectRecord {
  OBJECT_ID: number;
}

@Service()
export class GuildService {
  constructor(private readonly propertyListService: PropertyListService) {
    // Do nothing
  }

  async getAllGuilds() {
    const results = await knexDb.first().from<GuildObjectRecord>('GUILD_OBJECTS');

    if (!results) {
      return null;
    }

    // This should give us
    const pLists = await this.propertyListService.load({ objectId: String(results.OBJECT_ID) });

    const guilds: Map<string, Partial<Guild>> = new Map();

    const updateGuildData = (data: Partial<Guild> & Pick<Guild, 'id'>) => {
      const guildToUpdate = guilds.get(data.id);

      if (guildToUpdate) {
        Object.assign(guildToUpdate, data);
      } else {
        guilds.set(data.id, data);
      }
    };

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
              faction,
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
              faction: parseInt(faction),
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
          guilds.set(id, {
            ...guilds.get(id),
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

    return guilds;
  }

  async getGuild(id: string) {
    const guilds = await this.getAllGuilds();

    return guilds?.get(id) ?? null;
  }
}
