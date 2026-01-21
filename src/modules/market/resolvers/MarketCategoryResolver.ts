import { Arg, Authorized, Int, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { MarketCategory } from '../types';
import { GameObjectType, getCategoryName, getMaskedType, isSubType } from '../utils/gameObjectType';

import { StringFileLoader } from '@core/services/StringFileLoader';

@Service()
@Resolver()
export class MarketCategoryResolver {
  private categoriesCache: MarketCategory[] | null = null;

  constructor(private readonly stringService: StringFileLoader) {}

  @Query(() => [MarketCategory], { description: 'Get all valid market categories' })
  @Authorized()
  async marketCategories(
    @Arg('parentOnly', { nullable: true, defaultValue: false, description: 'Only return top-level parent categories' })
    parentOnly?: boolean
  ): Promise<MarketCategory[]> {
    const categories = await this.getCategories();
    if (parentOnly) {
      return categories.filter(c => !c.isSubCategory);
    }
    return categories;
  }

  @Query(() => MarketCategory, { nullable: true, description: 'Get a market category by ID' })
  @Authorized()
  async marketCategory(@Arg('id', () => Int) id: number): Promise<MarketCategory | null> {
    const categories = await this.getCategories();
    return categories.find(c => c.id === id) ?? null;
  }

  @Query(() => [MarketCategory], { description: 'Get subcategories for a parent category' })
  @Authorized()
  async marketSubcategories(@Arg('parentId', () => Int) parentId: number): Promise<MarketCategory[]> {
    const categories = await this.getCategories();
    return categories.filter(c => c.parentId === parentId);
  }

  private async getCategories(): Promise<MarketCategory[]> {
    if (this.categoriesCache) {
      return this.categoriesCache;
    }
    this.categoriesCache = await this.buildCategories();
    return this.categoriesCache;
  }

  private async buildCategories(): Promise<MarketCategory[]> {
    const gotNames = await this.stringService.load('got_n');
    const categories: MarketCategory[] = [];

    for (const [key, value] of Object.entries(GameObjectType)) {
      // Skip non-marketable types
      if (this.isNonMarketableType(key)) continue;

      const name = key.replace('GOT_', '');
      const displayName = gotNames[name] ?? this.formatDisplayName(name);
      const isSub = isSubType(value);
      const parentValue = isSub ? getMaskedType(value) : null;
      const parentName = parentValue !== null ? getCategoryName(parentValue) : null;

      categories.push({
        id: value,
        name,
        displayName,
        parentId: parentValue,
        parentName,
        isSubCategory: isSub,
      });
    }

    // Sort by parent first, then by name
    categories.sort((a, b) => {
      // Parent categories first
      if (a.isSubCategory !== b.isSubCategory) {
        return a.isSubCategory ? 1 : -1;
      }
      // Then by display name
      return a.displayName.localeCompare(b.displayName);
    });

    return categories;
  }

  private isNonMarketableType(key: string): boolean {
    // Skip base/system types that aren't typically sold on the market
    const nonMarketable = [
      'GOT_none',
      'GOT_corpse',
      'GOT_group',
      'GOT_guild',
      'GOT_lair',
      'GOT_static',
      'GOT_camp',
      'GOT_loadbeacon',
      'GOT_building',
      'GOT_building_municipal',
      'GOT_building_player',
      'GOT_building_factional',
      'GOT_creature',
      'GOT_creature_character',
      'GOT_creature_droid',
      'GOT_creature_droid_probe',
      'GOT_creature_monster',
      'GOT_installation',
      'GOT_installation_factory',
      'GOT_installation_generator',
      'GOT_installation_harvester',
      'GOT_installation_turret',
      'GOT_installation_minefield',
      'GOT_terminal',
      'GOT_terminal_bank',
      'GOT_terminal_bazaar',
      'GOT_terminal_cloning',
      'GOT_terminal_insurance',
      'GOT_terminal_manage',
      'GOT_terminal_mission',
      'GOT_terminal_permissions',
      'GOT_terminal_player_structure',
      'GOT_terminal_shipping',
      'GOT_terminal_travel',
      'GOT_terminal_space',
      'GOT_terminal_misc',
      'GOT_terminal_space_npe',
      'GOT_vehicle',
      'GOT_vehicle_hover',
      'GOT_vehicle_hover_ai',
      'GOT_ship',
      'GOT_ship_fighter',
      'GOT_ship_capital',
      'GOT_ship_station',
      'GOT_ship_transport',
      'GOT_ship_mining_asteroid_static',
      'GOT_ship_mining_asteroid_dynamic',
    ];
    return nonMarketable.includes(key);
  }

  private formatDisplayName(name: string): string {
    // Fallback if string file doesn't have the name
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
