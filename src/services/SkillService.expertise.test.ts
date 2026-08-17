import { describe, it, expect, vi } from 'vitest';

import { getStringCrc } from '../utils/crc';
import { loadCrcLookupTable } from '../utils/CrcTableReader';

import { DataTableService } from './DataTableService';
import { SkillService } from './SkillService';
import { StringFileLoader } from './StringFileLoader';

vi.mock('./db');

// Integration tests over the real datatables/strings shipped in data/.
describe('SkillService.getExpertiseData (real datatables)', () => {
  const service = new SkillService(new DataTableService(), new StringFileLoader());

  it('derives professions with their ordered trees (Jedi -> general/path/beast)', async () => {
    const data = await service.getExpertiseData();

    const jedi = data.professions.find(p => p.label === 'Jedi');
    expect(jedi).toBeDefined();
    expect(jedi!.treeIds).toEqual([4, 5, 30]);

    // 8 combat professions + 4 trader disciplines (+ city) all share tree 30.
    expect(data.professions.length).toBeGreaterThanOrEqual(12);
    expect(data.professions.every(p => p.treeIds.length > 0)).toBe(true);

    expect(data.ranksPerTier).toBe(4);
    expect(data.maxPoints).toBeGreaterThan(0);
    expect(data.pointsPerLevel.at(-1)?.points).toBe(data.maxPoints);
  });

  it('shapes the Jedi general tree as a 7x5 grid of ranked nodes with mods', async () => {
    const data = await service.getExpertiseData();

    const tree = data.trees.find(t => t.id === 4);
    expect(tree?.key).toBe('expertise_tree_fs_general');

    const node = tree!.nodes.find(n => n.id === 'expertise_fs_general_enhanced_strength_1');
    expect(node).toBeDefined();
    expect(node!.name).toBe('Enhanced Strength');
    expect(node!.tier).toBe(1);
    expect(node!.maxRank).toBe(2);
    expect(node!.ranks).toHaveLength(2);

    const mod = node!.ranks[0].mods.find(m => m.id === 'strength_modified');
    expect(mod?.value).toBe(25);

    for (const n of tree!.nodes) {
      expect(n.tier).toBeGreaterThanOrEqual(1);
      expect(n.tier).toBeLessThanOrEqual(5);
      expect(n.grid).toBeGreaterThanOrEqual(1);
      expect(n.grid).toBeLessThanOrEqual(7);
      expect(n.ranks.length).toBe(n.maxRank);
    }
  });

  it('carries the abilities (COMMANDS) a rank grants, with names and descriptions', async () => {
    const data = await service.getExpertiseData();
    const tree = data.trees.find(t => t.id === 4)!;

    const cloak = tree.nodes.find(n => n.id === 'expertise_fs_general_force_cloak_1')!;
    expect(cloak.ranks[0].commands).toHaveLength(1);

    const [command] = cloak.ranks[0].commands;
    expect(command.id).toBe('fs_buff_invis_1');
    expect(command.name).toBe('Force Cloak');
    expect(command.description).toBeTruthy();

    // A mods-only node grants no abilities on any rank.
    const strength = tree.nodes.find(n => n.id === 'expertise_fs_general_enhanced_strength_1')!;
    expect(strength.ranks.every(r => r.commands.length === 0)).toBe(true);
    expect(strength.ranks.some(r => r.mods.length > 0)).toBe(true);
  });

  it('never grants an ability above rank 1 (abilities are not upgraded by rank)', async () => {
    const data = await service.getExpertiseData();

    const aboveRank1 = data.trees
      .flatMap(t => t.nodes)
      .flatMap(n => n.ranks)
      .filter(r => r.rank > 1 && r.commands.length > 0);

    expect(aboveRank1).toEqual([]);

    // Guard against the inverse false pass — rank 1 really does carry commands.
    const withCommands = data.trees.flatMap(t => t.nodes).filter(n => n.ranks[0].commands.length > 0);
    expect(withCommands.length).toBeGreaterThan(0);
  });

  it('resolves box prerequisites (SKILLS_REQUIRED) to node ids + required ranks', async () => {
    const data = await service.getExpertiseData();
    const tree = data.trees.find(t => t.id === 4)!;
    const byId = new Map(tree.nodes.map(n => [n.id, n]));

    // Root tier-1 nodes have no box prerequisite (only the tier gate).
    expect(byId.get('expertise_fs_general_enhanced_strength_1')!.prerequisites).toEqual([]);

    // A vertical link to a higher rank: Second Wind needs Heightened Speed maxed.
    expect(byId.get('expertise_fs_general_second_wind_1')!.prerequisites).toEqual([
      { nodeId: 'expertise_fs_general_heightened_speed_1', rank: 4 },
    ]);

    // A horizontal link: Improved Saber Block (T4 G3) needs Stance: Saber Block
    // (T4 G2) — same tier, adjacent column.
    const improved = byId.get('expertise_fs_general_improved_saber_block_1')!;
    const stance = byId.get('expertise_fs_general_stance_saber_block_1')!;
    expect(improved.prerequisites).toEqual([{ nodeId: stance.id, rank: 1 }]);
    expect(improved.tier).toBe(stance.tier);
    expect(improved.grid).not.toBe(stance.grid);
  });

  it('stamps each rank with the SWG CRC of its skill name (build-code identity)', async () => {
    const data = await service.getExpertiseData();
    const tree = data.trees.find(t => t.id === 4)!;
    const node = tree.nodes.find(n => n.id === 'expertise_fs_general_enhanced_strength_1')!;

    expect(node.ranks[0].crc).toBe(getStringCrc('expertise_fs_general_enhanced_strength_1'));
    expect(node.ranks[1].crc).toBe(getStringCrc('expertise_fs_general_enhanced_strength_2'));
  });

  it('serves a tree-free header from getExpertiseMeta', async () => {
    const meta = await service.getExpertiseMeta();
    expect(meta).not.toHaveProperty('trees');
    expect(meta.professions.length).toBeGreaterThanOrEqual(12);
    expect(meta.ranksPerTier).toBe(4);
    expect(meta.pointsPerLevel.at(-1)?.points).toBe(meta.maxPoints);
  });

  it('returns only the requested trees from getExpertiseTrees(ids)', async () => {
    const all = await service.getExpertiseTrees();
    const jedi = await service.getExpertiseTrees([4, 5, 30]);
    expect(jedi.map(t => t.id)).toEqual([4, 5, 30]);
    expect(all.length).toBeGreaterThan(jedi.length);
    // Unknown ids are skipped, not nulls.
    expect(await service.getExpertiseTrees([4, 99999])).toHaveLength(1);
  });
});

describe('SWG CRC parity', () => {
  it('getStringCrc reproduces the game object-template CRC table', async () => {
    const table = await loadCrcLookupTable('misc/object_template_crc_string_table.iff');

    let checked = 0;
    for (const [crc, name] of table) {
      expect(getStringCrc(name) >>> 0).toBe(crc >>> 0);
      checked += 1;
      if (checked >= 1000) break;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
