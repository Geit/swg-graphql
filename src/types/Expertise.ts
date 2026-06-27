import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType({ description: 'A single skill modifier granted by one rank of an expertise node.' })
export class ExpertiseMod {
  @Field(() => String, { description: 'Skill mod id, e.g. "strength_modified".' })
  id: string;

  @Field(() => String, { nullable: true, description: 'Localized display name (stat_n), or null.' })
  name: string | null;

  @Field(() => Int, {
    description:
      'Per-rank increment this single rank adds to the mod. The total at a given rank is the sum of this value across all ranks up to and including it (e.g. a +25 mod is +25 at rank 1, +50 at rank 2).',
  })
  value: number;

  @Field(() => Boolean, { description: 'Whether the modifier value is a percentage (skill_mod_listing.percent).' })
  percent: boolean;

  @Field(() => Int, { description: 'Divisor for the modifier value (skill_mod_listing.divisor); 0 means none.' })
  divisor: number;
}

@ObjectType({ description: 'One rank of an expertise node — its own skill, CRC and modifiers.' })
export class ExpertiseRank {
  @Field(() => Int, { description: 'Rank number, 1-based.' })
  rank: number;

  @Field(() => String, { description: 'Skill name granted by this rank.' })
  skillName: string;

  @Field(() => Int, {
    description: 'SWG CRC of skillName (Crc::normalizeAndCalculate), as a signed int32.',
  })
  crc: number;

  @Field(() => [ExpertiseMod], { description: 'Skill mods this rank grants.' })
  mods: ExpertiseMod[];
}

@ObjectType({ description: 'A direct box-to-box expertise prerequisite (from the rank-1 skill SKILLS_REQUIRED).' })
export class ExpertisePrerequisite {
  @Field(() => String, { description: 'Prerequisite node id (its rank-1 skill name).' })
  nodeId: string;

  @Field(() => Int, { description: 'Minimum rank the prerequisite node must hold.' })
  rank: number;
}

@ObjectType({ description: 'A node (skill) in an expertise tree at a grid position, with its ranks.' })
export class ExpertiseNode {
  @Field(() => String, { description: 'Stable node id — the rank-1 skill name.' })
  id: string;

  @Field(() => Int, { description: 'Tree id this node belongs to.' })
  tree: number;

  @Field(() => Int, { description: 'Tier (row), 1..5.' })
  tier: number;

  @Field(() => Int, { description: 'Grid (column), 1..7.' })
  grid: number;

  @Field(() => Int, { description: 'Number of ranks this node has.' })
  maxRank: number;

  @Field(() => String, { nullable: true, description: 'Localized node name (skl_n of rank-1 skill).' })
  name: string | null;

  @Field(() => String, { nullable: true, description: 'Localized node description (skl_d of rank-1 skill).' })
  description: string | null;

  @Field(() => String, { description: 'Required profession token from the datatable (REQ_PROF).' })
  reqProf: string;

  @Field(() => Int, { description: 'Character level prerequisite from the datatable (PREREQ_LEVEL).' })
  prereqLevel: number;

  @Field(() => [ExpertisePrerequisite], {
    description: 'Boxes that must be trained first (rank-1 skill SKILLS_REQUIRED); usually empty or one.',
  })
  prerequisites: ExpertisePrerequisite[];

  @Field(() => [ExpertiseRank], {
    description: 'The ranks for this node, ordered by rank ascending. Each carries its own rank number.',
  })
  ranks: ExpertiseRank[];
}

@ObjectType({ description: 'An expertise tree — a 7x5 grid of nodes.' })
export class ExpertiseTree {
  @Field(() => Int, { description: 'Tree id (expertise_tree_id).' })
  id: number;

  @Field(() => String, { description: 'Tree string id, e.g. "expertise_tree_fs_general".' })
  key: string;

  @Field(() => String, { nullable: true, description: 'Localized tree name (expertise_n of the string id).' })
  name: string | null;

  @Field(() => String, { description: 'UI background id from expertise_trees (ui_background_id).' })
  uiBackground: string;

  @Field(() => [ExpertiseNode], { description: 'Nodes in this tree, ordered by tier then grid.' })
  nodes: ExpertiseNode[];
}

@ObjectType({ description: 'A profession and the ordered trees it can spend expertise in.' })
export class ExpertiseProfession {
  @Field(() => String, { description: 'Representative skill template id, e.g. "force_sensitive_1a".' })
  id: string;

  @Field(() => String, { description: 'Localized profession label (ui_roadmap), e.g. "Jedi".' })
  label: string;

  @Field(() => [Int], { description: 'Ordered tree ids for this profession (general, path, beast).' })
  treeIds: number[];
}

@ObjectType({ description: 'Cumulative expertise points available at a character level.' })
export class ExpertiseLevelPoints {
  @Field(() => Int)
  level: number;

  @Field(() => Int, { description: 'Total expertise points available by this level (cumulative).' })
  points: number;
}

@ObjectType({
  description:
    'Expertise header: the profession list, the cumulative points-per-level curve and the global point/tier constants. Tree node data is fetched separately via expertiseTrees(ids).',
})
export class ExpertiseMeta {
  @Field(() => [ExpertiseProfession])
  professions: ExpertiseProfession[];

  @Field(() => [ExpertiseLevelPoints], {
    description: 'Cumulative expertise points available at each character level.',
  })
  pointsPerLevel: ExpertiseLevelPoints[];

  @Field(() => Int, { description: 'Ranks per tier (MAX_NUM_EXPERTISE_RANKS).' })
  ranksPerTier: number;

  @Field(() => Int, { description: 'Maximum total expertise points at the top level.' })
  maxPoints: number;
}
