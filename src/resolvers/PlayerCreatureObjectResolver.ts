import { Arg, Authorized, FieldResolver, Int, Resolver, ResolverInterface, Root } from 'type-graphql';
import { Inject, Service } from 'typedi';

import { ENABLE_STRUCTURE_SHORTCUT } from '../config';
import { CityService } from '../services/CityService';
import { GuildService } from '../services/GuildService';
import { PlayerCreatureObjectService } from '../services/PlayerCreatureObjectService';
import { PropertyListService } from '../services/PropertyListService';
import { ServerObjectService } from '../services/ServerObjectService';
import { StringFileLoader } from '../services/StringFileLoader';
import { City, Guild, PlayerCreatureObject } from '../types';
import { PropertyListIds } from '../types/PropertyList';
import { PlayerObject } from '../types/PlayerObject';
import TAGIFY, { STRUCTURE_TYPE_IDS } from '../utils/tagify';
import { isPresent, subsetOf } from '../utils/utility-types';
import { Skill, SkillTree } from '../types/PlayerCreatureObject';
import { SkillService } from '../services/SkillService';
import { PlayerObjectService } from '../services/PlayerObjectService';

import { CreatureObjectResolver } from './CreatureObjectResolver';

import { ROLES } from '@core/auth/roles';

@Resolver(() => PlayerCreatureObject)
@Service()
export class PlayerCreatureObjectResolver
  extends CreatureObjectResolver
  implements ResolverInterface<PlayerCreatureObject>
{
  @Inject()
  playerCreatureObjectService: PlayerCreatureObjectService;

  @Inject()
  objectService: ServerObjectService;

  @Inject()
  propertyListService: PropertyListService;

  @Inject()
  stringFileService: StringFileLoader;

  @Inject()
  cityService: CityService;

  @Inject()
  guildService: GuildService;

  @Inject()
  skillService: SkillService;

  @Inject()
  playerObjectService: PlayerObjectService;

  @FieldResolver()
  async ownedObjects(
    @Root() object: PlayerCreatureObject,
    @Arg('objectTypes', () => [Int], { nullable: true }) objectTypes: number[] | null,
    @Arg('excludeDeleted', { defaultValue: true }) excludeDeleted: boolean,
    @Arg('structuresOnly', { defaultValue: false }) structuresOnly: boolean
  ) {
    // eslint-disable-next-line no-param-reassign
    if (structuresOnly) objectTypes = STRUCTURE_TYPE_IDS;

    if (ENABLE_STRUCTURE_SHORTCUT && objectTypes && subsetOf(objectTypes, STRUCTURE_TYPE_IDS)) {
      // If the user is just searching for structures, we can cheat a little and use
      // the structure objvar on characters.
      const structureOids = await this.playerCreatureObjectService.getCheapStructuresForCharacter(object.id);
      return this.objectService.getMany({
        objectTypes,
        excludeDeleted,
        objectIds: structureOids,
      });
    }

    const ownedObjects = await this.objectService.getMany({
      ownedBy: [object.id],
      objectTypes,
      excludeDeleted,
    });

    return ownedObjects;
  }

  @FieldResolver()
  @Authorized([ROLES.READ_ACCOUNTS])
  async account(@Root() object: PlayerCreatureObject) {
    const playerRecord = await this.playerCreatureObjectService.getPlayerRecordForCharacter(object.id);

    if (!playerRecord || !playerRecord.STATION_ID) {
      return null;
    }

    return {
      id: playerRecord.STATION_ID,
    };
  }

  @FieldResolver()
  async lastLoginTime(@Root() object: PlayerCreatureObject) {
    const playerRecord = await this.playerCreatureObjectService.getPlayerRecordForCharacter(object.id);

    return playerRecord?.LAST_LOGIN_TIME?.toISOString() ?? null;
  }

  @FieldResolver()
  async createdTime(@Root() object: PlayerCreatureObject) {
    const playerRecord = await this.playerCreatureObjectService.getPlayerRecordForCharacter(object.id);

    return playerRecord?.CREATE_TIME?.toISOString() ?? null;
  }

  @FieldResolver(() => [Skill])
  async skills(@Root() object: PlayerCreatureObject) {
    const pLists = await this.propertyListService.load({ objectId: object.id, listId: PropertyListIds.Skills });

    const skillPromises = pLists.map(val => this.skillService.getSkillInformation(val.value));

    const skills = (await Promise.all(skillPromises)).filter(isPresent);

    return skills;
  }

  @FieldResolver(() => [SkillTree])
  async skillTrees(@Root() object: PlayerCreatureObject) {
    const skills = await this.skills(object);
    const treeMap = new Map<string, { name: string | null; skills: Skill[] }>();

    for (const skill of skills) {
      // Skip bare container skills with no meaningful data
      if (skill.id === 'expertise') continue;

      // Check if this skill belongs to an expertise tree — if so, group by that instead
      const expertiseTree = this.skillService.getExpertiseTreeForSkill(skill.id);
      if (expertiseTree) {
        const key = `expertise_tree_${expertiseTree.treeId}`;
        const existing = treeMap.get(key);
        if (existing) {
          existing.skills.push(skill);
        } else {
          const name =
            expertiseTree.name ?? expertiseTree.stringId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          treeMap.set(key, { name, skills: [skill] });
        }
        continue;
      }

      const category = await this.skillService.getCategoryForSkill(skill.id);
      if (!category) continue;

      // Class profession phases (e.g. class_forcesensitive_phase1..4) are merged into
      // a single group per profession. Other class categories (e.g. class_chronicles)
      // remain separate.
      const phaseMatch = category.id.match(/^(class_.+)_phase\d+$/);
      const groupId = phaseMatch ? phaseMatch[1] : category.id;

      const existing = treeMap.get(groupId);
      if (existing) {
        existing.skills.push(skill);
      } else {
        let name: string;
        if (phaseMatch) {
          const playerObj = await this.playerObject(object);
          const [rawPlayer, skillTitles] = await Promise.all([
            this.playerObjectService.load(playerObj.id),
            this.stringFileService.load('ui_roadmap'),
          ]);
          const template = rawPlayer?.SKILL_TEMPLATE;
          name =
            (template && skillTitles[template]) ??
            groupId
              .replace(/^class_/, '')
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase());
        } else {
          name =
            category.name ?? category.title ?? category.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        treeMap.set(groupId, { name, skills: [skill] });
      }
    }

    return Array.from(treeMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      skills: data.skills.sort((a, b) => {
        const depthA = this.skillService.getSkillDepth(a.id);
        const depthB = this.skillService.getSkillDepth(b.id);
        return depthA - depthB || a.xpCost - b.xpCost;
      }),
    }));
  }

  @FieldResolver(() => Int)
  async level(@Root() object: PlayerCreatureObject) {
    const [skills, playerObject] = await Promise.all([this.skills(object), this.playerObject(object)]);

    return this.skillService.getLevelForPlayer(skills, playerObject.id);
  }

  @FieldResolver(() => City, { nullable: true, description: 'The City the player is Resident in' })
  city(@Root() object: PlayerCreatureObject) {
    return this.cityService.getCityForPlayer(object.id);
  }

  @FieldResolver(() => Guild, { nullable: true, description: 'The Guild the player is a member of' })
  guild(@Root() object: PlayerCreatureObject) {
    return this.guildService.getGuildForPlayer(object.id);
  }

  @FieldResolver(() => PlayerObject)
  async playerObject(@Root() object: PlayerCreatureObject) {
    const objects = await this.objectService.getMany({
      containedById: object.id,
      objectTypes: [TAGIFY('PLAY')],
    });

    if (!objects || objects.length === 0) throw new Error(`Character ${object.id} with no player object is invalid!`);

    return objects[0];
  }
}
