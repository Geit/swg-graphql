import { Arg, Authorized, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { MarketSearchAttribute, SearchAttributeDataType } from '../types';
import { SearchAttributeService } from '../services/SearchAttributeService';
import { normalizeAttributeName, ParsedSearchAttribute } from '../utils/parseAdvancedSearchAttribute';

import { StringFileLoader } from '@core/services/StringFileLoader';

@Service()
@Resolver()
export class MarketSearchAttributeResolver {
  constructor(
    private readonly searchAttributeService: SearchAttributeService,
    private readonly stringService: StringFileLoader
  ) {}

  @Query(() => [MarketSearchAttribute], { description: 'Get all searchable market attributes' })
  @Authorized()
  marketSearchAttributes(): Promise<MarketSearchAttribute[]> {
    const attributes = this.searchAttributeService.getAllAttributes();
    return Promise.all(attributes.map(attr => this.toMarketSearchAttribute(attr)));
  }

  @Query(() => [MarketSearchAttribute], {
    description: 'Get searchable attributes for a specific game object type (includes inherited attributes)',
  })
  @Authorized()
  marketSearchAttributesForType(
    @Arg('gameObjectType', { description: 'The game object type (e.g., "armor_body", "weapon_ranged_rifle")' })
    gameObjectType: string
  ): Promise<MarketSearchAttribute[]> {
    const attributes = this.searchAttributeService.getAttributesForType(gameObjectType);
    return Promise.all(attributes.map(attr => this.toMarketSearchAttribute(attr)));
  }

  @Query(() => [String], { description: 'Get all game object types that have searchable attributes' })
  @Authorized()
  marketSearchableTypes(): string[] {
    return Array.from(this.searchAttributeService.getGameObjectTypes()).sort();
  }

  private async toMarketSearchAttribute(attr: ParsedSearchAttribute): Promise<MarketSearchAttribute> {
    const normalizedName = normalizeAttributeName(attr.name);
    const displayName = await this.stringService.loadFromRef(attr.name);

    return {
      name: attr.name,
      normalizedName,
      displayName,
      gameObjectType: attr.gameObjectType,
      dataType: attr.dataType as SearchAttributeDataType,
      enumValues: attr.enumValues,
    };
  }
}
