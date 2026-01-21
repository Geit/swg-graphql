import { Arg, Authorized, Int, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

import {
  MarketSearchAttribute,
  MarketSearchAttributeSearchResult,
  SearchAttributeDataType,
  SearchAttributeEnumValue,
} from '../types';
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
      description: 'Filter by game object type',
    })
    gameObjectType?: string,
    @Arg('includeCategoryChildren', {
      defaultValue: true,
      description: 'When true, includes attributes from all child types of the category',
    })
    includeCategoryChildren?: boolean,
    @Arg('from', () => Int, { defaultValue: 0 }) from?: number,
    @Arg('size', () => Int, { defaultValue: 50 }) size?: number
  ): Promise<MarketSearchAttributeSearchResult> {
    let attributes;
    if (gameObjectType) {
      attributes = includeCategoryChildren
        ? this.searchAttributeService.getAttributesForCategory(gameObjectType)
        : this.searchAttributeService.getAttributesForType(gameObjectType);
    } else {
      attributes = this.searchAttributeService.getAllAttributes();
    }

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
    const displayName = await this.resolveDisplayName(attr.name);
    const enumValues = await this.resolveEnumValues(attr.enumValues);

    return {
      name: attr.name,
      normalizedName,
      displayName,
      gameObjectType: attr.gameObjectType,
      dataType: attr.dataType as SearchAttributeDataType,
      enumValues,
    };
  }

  private resolveEnumValues(values: string[]): Promise<SearchAttributeEnumValue[]> {
    return Promise.all(
      values.map(async name => ({
        name: name.replace(' <<<a_blank_space>>>', ''),
        displayName: (await this.stringService.loadFromRef(name)).replace(' <<<a_blank_space>>>', ''),
      }))
    );
  }

  /**
   * Resolves the display name for an attribute.
   * First tries to load it as a string reference (e.g., "@obj_attr_n:efficiency").
   * If not a ref format, extracts the key and looks it up in obj_attr_n.
   */
  private resolveDisplayName(name: string): Promise<string> {
    // If it's a string reference format (contains :), try loading it directly
    if (name.includes(':')) {
      return this.stringService.loadFromRef(name);
    }

    // Otherwise, extract the attribute key (last part after . or the whole name)
    // e.g., "ship_component.ship_component_hitpoints" -> "ship_component_hitpoints"
    const dotIndex = name.lastIndexOf('.');
    const attrKey = dotIndex !== -1 ? name.slice(dotIndex + 1) : name;

    // Try looking it up in obj_attr_n
    return this.stringService.loadFromRef(`obj_attr_n:${attrKey}`, attrKey);
  }
}
