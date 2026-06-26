import { Service } from 'typedi';
import { CamelCasedProperties, Merge } from 'type-fest';
import { camelCase } from 'lodash';

import { getStringCrc } from '../utils/crc';
import { humanizeId } from '../utils/humanize';
import type {
  ExpertiseLevelPoints,
  ExpertiseMeta,
  ExpertiseMod,
  ExpertiseNode,
  ExpertiseProfession,
  ExpertiseRank,
  ExpertiseTree,
} from '../types/Expertise';

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
  PREREQ_LEVEL: number;
  REQ_PROF: string;
}

interface ExpertiseTreeRow {
  expertise_tree_id: number;
  expertise_tree_string_id: string;
  ui_background_id: string;
}

interface SkillTemplateRow {
  templateName: string;
  strClassName: string;
  expertiseTrees: string;
}

interface SkillModListingRow {
  skill_mod: string;
  divisor: number;
  percent: boolean;
}

export interface ExpertiseTreeInfo {
  treeId: number;
  stringId: string;
  name: string | null;
  uiBackground: string;
}

/** One grid position (node) in an expertise tree, with its ranks resolved once. */
interface ExpertisePosition {
  /** The RANK 1 row — the node's stable identity (also carries TREE/TIER/GRID). */
  rank1: ExpertiseRow;
  /** All rank rows for this position, ordered by RANK ascending. */
  ranks: ExpertiseRow[];
}

/** The full assembled expertise dataset held internally; the public API slices it
 * into the small ExpertiseMeta and the per-id ExpertiseTree[] so callers never
 * have to pull all trees at once. */
interface AssembledExpertise {
  professions: ExpertiseProfession[];
  trees: ExpertiseTree[];
  pointsPerLevel: ExpertiseLevelPoints[];
  ranksPerTier: number;
  maxPoints: number;
}

interface SkillMod {
  id: string;
  name: string | null;
  value: number;
}

interface SkillCommand {
  id: string;
  name: string | null;
}

interface SkillDataToAdd {
  id: string;
  name: string | null;
  title: string | null;
  description: string | null;
  commands: SkillCommand[] | null;
  skillMods: SkillMod[] | null;
  schematicsRevoked: string[] | null;
  schematicsGranted: string[] | null;
  speciesRequired: string[] | null;
  statsRequired: string[] | null;
  missionsRequired: string[] | null;
  preclusionSkills: string[] | null;
  pointsAssigned: number | null;
  maxPointsAssigned: number | null;
}

interface ExperienceRecord {
  OBJECT_ID: number;
  EXPERIENCE_TYPE: string;
  POINTS: number;
}

type EnrichedSkillData = Merge<SkillDatableRow, SkillDataToAdd>;

const splitToArrayOrNull = (csvString: string): string[] | null => (csvString ? csvString.split(',') : null);

/** Ranks per node / points required to step up an expertise tier (engine MAX_NUM_EXPERTISE_RANKS). */
const MAX_NUM_EXPERTISE_RANKS = 4;

@Service({ global: true, eager: true })
export class SkillService {
  loadingHandle: false | Promise<void> = false;

  private _skillMap = new Map<string, EnrichedSkillData>();
  private _expertiseSkillToTree = new Map<string, ExpertiseTreeInfo>();
  private _expertiseRank1ForSkill = new Map<string, string>();
  private _expertiseMaxRank = new Map<string, number>();

  private _levelData: PlayerLevelDatatableRow[] = [];
  private _xpTypesThatAffectLevel: Set<string> = new Set();

  // Full structured expertise dataset, assembled once at load (it is static).
  // Public accessors slice it into meta vs trees-by-id so callers fetch granularly.
  private _expertise: AssembledExpertise | null = null;
  private _treeById = new Map<number, ExpertiseTree>();

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
      commandNames,
      skillModNames,
      skillTemplateData,
      skillModListing,
      professionTitles,
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
      this.stringService.load('cmd_n'),
      this.stringService.load('stat_n'),
      this.dataTable.load<SkillTemplateRow>({
        fileName: `skill_template/skill_template.iff`,
        camelcase: true,
      }),
      this.dataTable.load<SkillModListingRow>({
        fileName: `expertise/skill_mod_listing.iff`,
        camelcase: false,
      }),
      this.stringService.load('ui_roadmap'),
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
        uiBackground: tree.ui_background_id ?? '',
      });
    }

    // Group expertise rows into grid positions once; the player-state lookup maps
    // and the calculator dataset both derive from this single grouping, so they
    // can't drift on rank-1 selection or max-rank.
    const expertisePositions = SkillService.groupExpertisePositions(expertiseData);

    for (const row of expertiseData) {
      const treeInfo = treeInfoMap.get(row.TREE);
      if (treeInfo) {
        this._expertiseSkillToTree.set(row.NAME, treeInfo);
      }
    }

    for (const position of expertisePositions) {
      this._expertiseMaxRank.set(position.rank1.NAME, position.ranks.length);
      for (const r of position.ranks) {
        this._expertiseRank1ForSkill.set(r.NAME, position.rank1.NAME);
      }
    }

    for (const skill of skillData) {
      const skillMods = skill.skillMods
        ? skill.skillMods.split(',').flatMap((skillMod): SkillMod[] => {
            const [skillModId, skillModVal] = skillMod.split('=');

            return [
              {
                id: skillModId,
                name: skillModNames[skillModId] ?? null,
                value: parseInt(skillModVal),
              },
            ];
          })
        : null;

      const commands: SkillCommand[] | null = skill.commands
        ? skill.commands.split(',').map(
            (cmdId): SkillCommand => ({
              id: cmdId,
              name: commandNames[cmdId.toLowerCase()] ?? null,
            })
          )
        : null;

      this._skillMap.set(skill.name, {
        ...skill,
        id: skill.name,
        name: skillNames[skill.name] ?? null,
        title: skillTitles[skill.name] ?? null,
        description: skillDescriptions[skill.name] ?? null,
        commands,
        skillMods,
        schematicsGranted: splitToArrayOrNull(skill.schematicsGranted),
        schematicsRevoked: splitToArrayOrNull(skill.schematicsRevoked),
        speciesRequired: splitToArrayOrNull(skill.speciesRequired),
        statsRequired: splitToArrayOrNull(skill.statsRequired),
        missionsRequired: splitToArrayOrNull(skill.missionsRequired),
        preclusionSkills: splitToArrayOrNull(skill.preclusionSkills),
        pointsAssigned: null,
        maxPointsAssigned: null,
      });
    }

    this._expertise = this.buildExpertiseData(
      expertisePositions,
      treeInfoMap,
      skillModListing,
      skillTemplateData,
      professionTitles
    );
    this._treeById = new Map(this._expertise.trees.map(tree => [tree.id, tree]));
  }

  /**
   * Group expertise rows into grid positions (one node per TREE/TIER/GRID), with
   * each position's ranks sorted ascending. Positions lacking a RANK 1 row are
   * skipped — the single rank-1 rule every consumer shares — so the player-state
   * lookup maps and the calculator dataset can't disagree on node identity.
   */
  private static groupExpertisePositions(expertiseData: ExpertiseRow[]): ExpertisePosition[] {
    const byPosition = new Map<string, ExpertiseRow[]>();
    for (const row of expertiseData) {
      const posKey = `${row.TREE},${row.TIER},${row.GRID}`;
      const rows = byPosition.get(posKey) ?? [];
      rows.push(row);
      byPosition.set(posKey, rows);
    }

    const positions: ExpertisePosition[] = [];
    for (const rows of byPosition.values()) {
      const ranks = [...rows].sort((a, b) => a.RANK - b.RANK);
      const rank1 = ranks.find(r => r.RANK === 1);
      if (!rank1) continue;
      positions.push({ rank1, ranks });
    }
    return positions;
  }

  /**
   * Assemble the static expertise dataset (trees -> nodes -> ranks -> mods,
   * professions, and the points-per-level curve) from the loaded datatables.
   * Pure structuring over already-resolved data; runs once at load.
   */
  private buildExpertiseData(
    positions: ExpertisePosition[],
    treeInfoMap: Map<number, ExpertiseTreeInfo>,
    skillModListing: SkillModListingRow[],
    skillTemplateData: SkillTemplateRow[],
    professionTitles: Record<string, string | undefined>
  ): AssembledExpertise {
    const listingById = new Map(skillModListing.map(l => [l.skill_mod, l]));

    const modsForRank = (skillName: string): ExpertiseMod[] => {
      const mods = this._skillMap.get(skillName)?.skillMods ?? [];
      return mods.map(m => {
        const listing = listingById.get(m.id);
        return {
          id: m.id,
          name: m.name,
          value: m.value,
          percent: listing?.percent ?? false,
          divisor: listing?.divisor ?? 0,
        };
      });
    };

    const toNode = (position: ExpertisePosition): ExpertiseNode => {
      const { rank1, ranks } = position;
      const skill = this._skillMap.get(rank1.NAME);
      return {
        id: rank1.NAME,
        tree: rank1.TREE,
        tier: rank1.TIER,
        grid: rank1.GRID,
        maxRank: ranks.length,
        name: skill?.name ?? null,
        description: skill?.description ?? null,
        reqProf: rank1.REQ_PROF ?? '',
        prereqLevel: rank1.PREREQ_LEVEL ?? 1,
        ranks: ranks.map(
          (r): ExpertiseRank => ({
            rank: r.RANK,
            skillName: r.NAME,
            crc: getStringCrc(r.NAME),
            mods: modsForRank(r.NAME),
          })
        ),
      };
    };

    // Bucket the shared position grouping by tree.
    const byTree = new Map<number, ExpertisePosition[]>();
    for (const position of positions) {
      const treeId = position.rank1.TREE;
      const treePositions = byTree.get(treeId) ?? [];
      treePositions.push(position);
      byTree.set(treeId, treePositions);
    }

    const trees: ExpertiseTree[] = [];
    for (const [treeId, treePositions] of byTree) {
      const info = treeInfoMap.get(treeId);
      if (!info) continue;

      const nodes = treePositions.map(toNode).sort((a, b) => a.tier - b.tier || a.grid - b.grid);
      trees.push({
        id: treeId,
        key: info.stringId,
        name: info.name,
        uiBackground: info.uiBackground,
        nodes,
      });
    }
    trees.sort((a, b) => a.id - b.id);

    // One profession per distinct expertise-tree set; label via ui_roadmap.
    const parseTreeIds = (csv: string): number[] =>
      csv
        .split(',')
        .map(t => parseInt(t.trim(), 10))
        .filter(n => !Number.isNaN(n));

    const resolveProfessionLabel = (row: SkillTemplateRow): string => {
      const localized = professionTitles[row.templateName] ?? professionTitles[row.strClassName];
      if (localized) return localized;
      if (row.templateName === 'politician') return 'City Expertise';
      return humanizeId(row.strClassName || row.templateName);
    };

    const byTreeSet = new Map<string, SkillTemplateRow>();
    for (const row of skillTemplateData) {
      if (!row.expertiseTrees?.trim()) continue;
      const existing = byTreeSet.get(row.expertiseTrees);
      if (!existing || row.templateName < existing.templateName) byTreeSet.set(row.expertiseTrees, row);
    }

    const professions = [...byTreeSet.values()]
      .map(row => ({ row, treeIds: parseTreeIds(row.expertiseTrees) }))
      .sort((a, b) => (a.treeIds[0] ?? 0) - (b.treeIds[0] ?? 0) || a.row.templateName.localeCompare(b.row.templateName))
      .map(({ row, treeIds }) => ({
        id: row.templateName,
        label: resolveProfessionLabel(row),
        treeIds,
      }));

    // Cumulative expertise points awarded by each level (ExpertiseManager::getExpertisePointsForLevel).
    const levels = [...this._levelData].sort((a, b) => a.level - b.level);
    let cumulative = 0;
    const pointsPerLevel = levels.map(l => {
      cumulative += l.expertisePoints ?? 0;
      return { level: l.level, points: cumulative };
    });

    return {
      professions,
      trees,
      pointsPerLevel,
      ranksPerTier: MAX_NUM_EXPERTISE_RANKS,
      maxPoints: cumulative,
    };
  }

  /** The full assembled expertise dataset (all trees). Prefer the granular
   * getExpertiseMeta / getExpertiseTrees in resolvers; this backs tests + reuse. */
  async getExpertiseData(): Promise<AssembledExpertise> {
    await this.loadSkillData();
    if (!this._expertise) throw new Error('Expertise data was not assembled during skill load');
    return this._expertise;
  }

  /** The small expertise header: professions, the points-per-level curve and the
   * point/tier constants. Cheap — no tree node data. */
  async getExpertiseMeta(): Promise<ExpertiseMeta> {
    const { professions, pointsPerLevel, ranksPerTier, maxPoints } = await this.getExpertiseData();
    return { professions, pointsPerLevel, ranksPerTier, maxPoints };
  }

  /** Expertise trees, optionally filtered to the given ids (a profession's tree
   * set). Omit `ids` to return every tree. Unknown ids are skipped. */
  async getExpertiseTrees(ids?: readonly number[] | null): Promise<ExpertiseTree[]> {
    const all = await this.getExpertiseData();
    if (!ids || ids.length === 0) return all.trees;
    return ids.map(id => this._treeById.get(id)).filter((tree): tree is ExpertiseTree => Boolean(tree));
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
   * Returns the rank 1 skill ID for an expertise skill, or null if not an expertise skill.
   */
  getExpertiseRank1(skillId: string): string | null {
    return this._expertiseRank1ForSkill.get(skillId) ?? null;
  }

  /**
   * Returns the maximum number of ranks for an expertise skill (by its rank 1 ID).
   */
  getExpertiseMaxRank(rank1SkillId: string): number {
    return this._expertiseMaxRank.get(rank1SkillId) ?? 1;
  }

  /**
   * Finds the category for a skill — the 2nd level in the hierarchy.
   * Mirrors the SWG client's SkillObject::findCategory() behaviour:
   * walks up the parent chain and returns the skill whose parent's parent is empty (root).
   * For skills that are direct children of root, returns the skill itself.
   */
  async getCategoryForSkill(skillId: string): Promise<EnrichedSkillData | null> {
    await this.loadSkillData();

    let current = this._skillMap.get(skillId);
    while (current) {
      // Direct child of root — this skill IS the category
      if (!current.parent) return current;

      const parentSkill = this._skillMap.get(current.parent);
      // Parent is root (empty parent) — current is the category
      if (parentSkill && !parentSkill.parent) return current;

      current = parentSkill;
    }

    return null;
  }
}
