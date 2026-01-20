import { Arg, Authorized, Int, Query, Resolver } from 'type-graphql';
import { Inject, Service } from 'typedi';

import {
  MarketSearchResult,
  MarketListing,
  MarketListingAttribute,
  MarketPriceRangeInput,
  MarketAttributeFilterInput,
} from '../types';
import { MarketSearchService } from '../services/MarketSearchService';

@Service()
@Resolver()
export class MarketSearchResolver {
  @Inject()
  private readonly marketSearchService: MarketSearchService;

  @Query(() => MarketSearchResult, { nullable: true })
  @Authorized()
  async marketListings(
    @Arg('searchText', { nullable: true }) searchText?: string,
    @Arg('category', () => Int, { nullable: true }) category?: number,
    @Arg('categories', () => [Int], { nullable: true }) categories?: number[],
    @Arg('categoryHierarchy', {
      nullable: true,
      description: 'Filter by category hierarchy (e.g., "armor" matches all armor types)',
    })
    categoryHierarchy?: string,
    @Arg('planet', { nullable: true }) planet?: string,
    @Arg('planets', () => [String], { nullable: true }) planets?: string[],
    @Arg('priceRange', () => MarketPriceRangeInput, { nullable: true }) priceRange?: MarketPriceRangeInput,
    @Arg('bidRange', () => MarketPriceRangeInput, { nullable: true }) bidRange?: MarketPriceRangeInput,
    @Arg('attributeFilters', () => [MarketAttributeFilterInput], { nullable: true })
    attributeFilters?: MarketAttributeFilterInput[],
    @Arg('ownerId', () => String, { nullable: true }) ownerId?: string,
    @Arg('locationId', () => String, { nullable: true }) locationId?: string,
    @Arg('from', () => Int, { defaultValue: 0 }) from?: number,
    @Arg('size', () => Int, { defaultValue: 50 }) size?: number,
    @Arg('sortField', { nullable: true })
    sortField?: 'buyNowPrice' | 'minBid' | 'itemName' | 'auctionTimer' | 'currentBid',
    @Arg('sortDirection', { nullable: true }) sortDirection?: 'asc' | 'desc'
  ): Promise<MarketSearchResult | null> {
    const searchResult = await this.marketSearchService.search({
      searchText,
      category,
      categories,
      categoryHierarchy,
      planet,
      planets,
      priceRange,
      bidRange,
      attributeFilters,
      ownerId,
      locationId,
      from,
      size,
      sortField,
      sortDirection,
    });

    if (!searchResult) {
      return null;
    }

    const results: MarketListing[] = searchResult.results.map(doc => {
      const attributes: MarketListingAttribute[] = [];

      if (doc.attributes) {
        for (const [name, value] of Object.entries(doc.attributes)) {
          attributes.push({
            name,
            value: String(value),
          });
        }
      }

      return {
        id: doc.id,
        itemName: doc.itemName,
        userDescription: doc.userDescription ?? null,
        minBid: doc.minBid ?? null,
        buyNowPrice: doc.buyNowPrice ?? null,
        auctionTimer: doc.auctionTimer ?? null,
        category: doc.category,
        categoryHierarchy: doc.categoryHierarchy,
        ownerId: doc.ownerId ?? null,
        creatorId: doc.creatorId ?? null,
        locationId: doc.locationId,
        planet: doc.planet ?? null,
        region: doc.region ?? null,
        locationName: doc.locationName ?? null,
        vendorName: doc.vendorName ?? null,
        currentBid: doc.currentBid ?? null,
        bidderId: doc.bidderId ?? null,
        itemSize: doc.itemSize,
        objectTemplateId: doc.objectTemplateId ?? null,
        attributes,
      };
    });

    return {
      totalResults: searchResult.totalResults,
      results,
    };
  }
}
