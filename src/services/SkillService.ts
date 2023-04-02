import { Inject, Service } from 'typedi';
import { CamelCasedProperties, Merge } from 'type-fest';

import { DataTableService } from './DataTableService';
import { ObjVarService } from './ObjVarService';
import { StringFileLoader } from './StringFileLoader';

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

type EnrichedSkillData = Merge<SkillDatableRow, SkillDataToAdd>;

const splitToArrayOrNull = (csvString: string): string[] | null => (csvString ? csvString.split(',') : null);

@Service({ global: true, eager: true })
export class SkillService {
  @Inject()
  private readonly objvarService: ObjVarService;

  loadingHandle: false | Promise<void> = false;

  private _skillMap = new Map<string, EnrichedSkillData>();

  private _levelData: PlayerLevelDatatableRow[] = [];
  private _xpTypesThatAffectLevel: Set<string> = new Set();

  constructor(private readonly dataTable: DataTableService, private readonly stringService: StringFileLoader) {
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
    const [levelData, skillData, skillNames, skillTitles, skillDescriptions] = await Promise.all([
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
    ]);

    this._levelData = levelData;
    this._xpTypesThatAffectLevel = new Set(levelData.map(ld => ld.xpType).filter(isPresent));

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

  public getLevelForPlayer(skills: EnrichedSkillData[]) {
    let totalXp = 0;

    for (const skill of skills) {
      if (this._xpTypesThatAffectLevel.has(skill.xpType)) {
        totalXp += skill.xpCost;
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
}
