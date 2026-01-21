import { Arg, Authorized, Int, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import { MarketSearchAttribute, MarketSearchAttributeSearchResult, SearchAttributeDataType } from '../types';
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

  @Query(() => MarketSearchAttributeSearchResult, {
    description: 'Get searchable market attributes with optional filtering and pagination',
  })
  @Authorized()
  async marketSearchAttributes(
    @Arg('gameObjectType', {
      nullable: true,
      description: 'Filter by game object type (includes attributes from all child types)',
    })
    gameObjectType?: string,
    @Arg('from', () => Int, { defaultValue: 0 }) from?: number,
    @Arg('size', () => Int, { defaultValue: 50 }) size?: number
  ): Promise<MarketSearchAttributeSearchResult> {
    const attributes = gameObjectType
      ? this.searchAttributeService.getAttributesForCategory(gameObjectType)
      : this.searchAttributeService.getAllAttributes();

    const totalResults = attributes.length;

    // Apply pagination
    const paginatedAttributes = attributes.slice(from ?? 0, (from ?? 0) + (size ?? 50));

    const results = await Promise.all(paginatedAttributes.map(attr => this.toMarketSearchAttribute(attr)));

    return {
      totalResults,
      results,
    };
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
