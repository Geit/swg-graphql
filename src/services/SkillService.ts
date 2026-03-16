import { Service } from 'typedi';
import { CamelCasedProperties, Merge } from 'type-fest';
import { camelCase } from 'lodash';

import { DataTableService } from './DataTableService';
import { StringFileLoader } from './StringFileLoader';
import db from './db';

import { isPresent } from '@core/utils/utility-types';

type SkillDatableRow = CamelCasedProperties<{
  NAME: string;
  PARENT: string;
  GRAPH_TYPE: number;
  GOD_ONLY: boolean;
  IS_TITLE: boolean;
  IS_PROFESSION: boolean;
  IS_HIDDEN: boolean;
  MONEY_REQUIRED: number;
  POINTS_REQUIRED: number;
  SKILLS_REQUIRED_COUNT: number;
  SKILLS_REQUIRED: string;
  PRECLUSION_SKILLS: string;
  XP_TYPE: string;
  XP_COST: number;
  XP_CAP: number;
  MISSIONS_REQUIRED: string;
  APPRENTICESHIPS_REQUIRED: string;
  STATS_REQUIRED: string;
  SPECIES_REQUIRED: string;
  JEDI_STATE_REQUIRED: number;
  SKILL_ABILITY: string;
  COMMANDS: string;
  SKILL_MODS: string;
  SCHEMATICS_GRANTED: string;
  SCHEMATICS_REVOKED: string;
  SEARCHABLE: boolean;
  ENDER: number;
}>;

type PlayerLevelDatatableRow = CamelCasedProperties<{
  level: number;
  xp_required: number;
  xp_type: string;
  xp_multiplier: number;
  health_granted: number;
  expertise_points: number;
}>;

interface ExpertiseRow {
  NAME: string;
  TREE: number;
  TIER: number;
  GRID: number;
  RANK: number;
}

interface ExpertiseTreeRow {
  expertise_tree_id: number;
  expertise_tree_string_id: string;
}

export interface ExpertiseTreeInfo {
  treeId: number;
  stringId: string;
  name: string | null;
}

interface SkillMod {
  id: string;
  value: number;
}

interface SkillDataToAdd {
  id: string;
  name: string | null;
  title: string | null;
  description: string | null;
  commands: string[] | null;
  skillMods: SkillMod[] | null;
  schematicsRevoked: string[] | null;
  schematicsGranted: string[] | null;
  speciesRequired: string[] | null;
  statsRequired: string[] | null;
  missionsRequired: string[] | null;
  preclusionSkills: string[] | null;
}

interface ExperienceRecord {
  OBJECT_ID: number;
  EXPERIENCE_TYPE: string;
  POINTS: number;
}

type EnrichedSkillData = Merge<SkillDatableRow, SkillDataToAdd>;

const splitToArrayOrNull = (csvString: string): string[] | null => (csvString ? csvString.split(',') : null);

@Service({ global: true, eager: true })
export class SkillService {
  loadingHandle: false | Promise<void> = false;

  private _skillMap = new Map<string, EnrichedSkillData>();
  private _expertiseSkillToTree = new Map<string, ExpertiseTreeInfo>();

  private _levelData: PlayerLevelDatatableRow[] = [];
  private _xpTypesThatAffectLevel: Set<string> = new Set();

  private db = db;

  constructor(
    private readonly dataTable: DataTableService,
    private readonly stringService: StringFileLoader
  ) {
    this.loadSkillData();
  }

  private async loadSkillData() {
    if (!this.loadingHandle) {
      try {
        this.loadingHandle = this.loadSkillDataFromDatatables();
        await this.loadingHandle;
      } catch (err) {
        this.loadingHandle = false;
        throw err;
      }
    }

    return this.loadingHandle;
  }

  private async loadSkillDataFromDatatables() {
    const [
      levelData,
      skillData,
      skillNames,
      skillTitles,
      skillDescriptions,
      expertiseData,
      expertiseTreeData,
      expertiseNames,
    ] = await Promise.all([
      this.dataTable.load<PlayerLevelDatatableRow>({
        fileName: `player/player_level.iff`,
        camelcase: true,
      }),
      this.dataTable.load<SkillDatableRow>({
        fileName: `skill/skills.iff`,
        camelcase: true,
      }),
      this.stringService.load('skl_n'),
      this.stringService.load('skl_t'),
      this.stringService.load('skl_d'),
      this.dataTable.load<ExpertiseRow>({
        fileName: `expertise/expertise.iff`,
        camelcase: false,
      }),
      this.dataTable.load<ExpertiseTreeRow>({
        fileName: `expertise/expertise_trees.iff`,
        camelcase: false,
      }),
      this.stringService.load('expertise_n'),
    ]);

    this._levelData = levelData;
    this._xpTypesThatAffectLevel = new Set(levelData.map(ld => ld.xpType).filter(isPresent));

    // Build expertise tree ID -> info map
    const treeInfoMap = new Map<number, ExpertiseTreeInfo>();
    for (const tree of expertiseTreeData) {
      treeInfoMap.set(tree.expertise_tree_id, {
        treeId: tree.expertise_tree_id,
        stringId: tree.expertise_tree_string_id,
        name: expertiseNames[tree.expertise_tree_string_id] ?? null,
      });
    }

    // Map each expertise skill to its tree info
    for (const row of expertiseData) {
      const treeInfo = treeInfoMap.get(row.TREE);
      if (treeInfo) {
        this._expertiseSkillToTree.set(row.NAME, treeInfo);
      }
    }

    for (const skill of skillData) {
      const skillMods = skill.skillMods
        ? skill.skillMods.split(',').flatMap((skillMod): SkillMod[] => {
            const [skillModId, skillModVal] = skillMod.split('=');

            return [
              {
                id: skillModId,
                value: parseInt(skillModVal),
              },
            ];
          })
        : null;

      this._skillMap.set(skill.name, {
        ...skill,
        id: skill.name,
        name: skillNames[skill.name] ?? null,
        title: skillTitles[skill.name] ?? null,
        description: skillDescriptions[skill.name] ?? null,
        commands: splitToArrayOrNull(skill.commands),
        skillMods,
        schematicsGranted: splitToArrayOrNull(skill.schematicsGranted),
        schematicsRevoked: splitToArrayOrNull(skill.schematicsRevoked),
        speciesRequired: splitToArrayOrNull(skill.speciesRequired),
        statsRequired: splitToArrayOrNull(skill.statsRequired),
        missionsRequired: splitToArrayOrNull(skill.missionsRequired),
        preclusionSkills: splitToArrayOrNull(skill.preclusionSkills),
      });
    }
  }

  public async getExperiencePointsForObject(objectId: string): Promise<CamelCasedProperties<ExperienceRecord>[]> {
    const experienceRecords = await this.db
      .select('*')
      .from<ExperienceRecord>('EXPERIENCE_POINTS')
      .where('OBJECT_ID', objectId);

    const result = experienceRecords.map(er =>
      Object.fromEntries(Object.entries(er).map(([key, val]) => [camelCase(key), val]))
    ) as CamelCasedProperties<ExperienceRecord>[];

    return result;
  }

  public async getLevelForPlayer(skills: EnrichedSkillData[], playerObjectId: string) {
    let totalXp = 0;

    for (const skill of skills) {
      if (this._xpTypesThatAffectLevel.has(skill.xpType)) {
        totalXp += skill.xpCost;
      }
    }

    const xp = await this.getExperiencePointsForObject(playerObjectId);

    for (const xpEntry of xp) {
      if (this._xpTypesThatAffectLevel.has(xpEntry.experienceType)) {
        totalXp += xpEntry.points;
      }
    }

    // TODO: need to apply the XP cap(s)?
    let levelVal = 0;

    for (const level of this._levelData) {
      // TODO: Should calculate total expertise points and health here.
      if (totalXp >= level.xpRequired) {
        levelVal = level.level;
      }
    }

    return levelVal;
  }

  async getSkillInformation(skillId: string): Promise<EnrichedSkillData | null> {
    await this.loadSkillData();

    return this._skillMap.get(skillId) ?? null;
  }

  /**
   * Returns the expertise tree info for a skill, or null if it's not an expertise skill.
   */
  getExpertiseTreeForSkill(skillId: string): ExpertiseTreeInfo | null {
    return this._expertiseSkillToTree.get(skillId) ?? null;
  }

  /**
   * Finds the tree root for a skill by walking up the parent chain.
   * The tree root is the skill whose parent is empty (i.e. a direct child of skill_system_root).
   */
  async getTreeRootForSkill(skillId: string): Promise<EnrichedSkillData | null> {
    await this.loadSkillData();

    let current = this._skillMap.get(skillId);
    while (current) {
      if (!current.parent) return current;
      current = this._skillMap.get(current.parent);
    }

    return null;
  }

  /**
   * Returns the depth of a skill in its tree (0 = tree root, 1 = direct child, etc.)
   */
  getSkillDepth(skillId: string): number {
    let depth = 0;
    let current = this._skillMap.get(skillId);
    while (current && current.parent) {
      depth += 1;
      current = this._skillMap.get(current.parent);
    }
    return depth;
  }
}
