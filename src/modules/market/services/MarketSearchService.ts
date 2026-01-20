import { Service } from 'typedi';
import esb, { Query } from 'elastic-builder';

import { MARKET_INDEX_NAME } from '../config';
import { MarketListingDocument } from '../types';

import { ENABLE_TEXT_SEARCH } from '@core/config';
import { elasticClient, transformElasticResponse } from '@core/utils/elasticClient';

export interface MarketSearchFilters {
  searchText?: string;
  category?: number;
  categories?: number[];
  categoryHierarchy?: string;
  planet?: string;
  planets?: string[];
  priceRange?: { min?: number; max?: number };
  bidRange?: { min?: number; max?: number };
  attributeFilters?: Array<{
    name: string;
    minValue?: number;
    maxValue?: number;
    exactValue?: string;
  }>;
  ownerId?: string;
  locationId?: string;
  from?: number;
  size?: number;
  sortField?: 'buyNowPrice' | 'minBid' | 'itemName' | 'auctionTimer' | 'currentBid';
  sortDirection?: 'asc' | 'desc';
}

export interface MarketSearchResult {
  totalResults: number;
  results: MarketListingDocument[];
}

@Service()
export class MarketSearchService {
  private elastic = elasticClient;

  async search(filters: MarketSearchFilters): Promise<MarketSearchResult | null> {
    if (!ENABLE_TEXT_SEARCH) {
      return null;
    }

    const body = esb
      .requestBodySearch()
      .from(filters.from ?? 0)
      .size(filters.size ?? 50);

    const mustQueries: Query[] = [];
    const filterQueries: Query[] = [];

    // Only active listings
    filterQueries.push(esb.termQuery('active', 1));

    // Type filter
    filterQueries.push(esb.termQuery('type', 'MarketListing'));

    // Text search on item name and description
    if (filters.searchText?.trim()) {
      mustQueries.push(
        esb
          .disMaxQuery()
          .queries([
            esb.matchPhraseQuery('itemName', filters.searchText).boost(3),
            esb.matchQuery('itemName', filters.searchText).boost(2),
            esb.matchQuery('userDescription', filters.searchText),
            esb.matchQuery('vendorName', filters.searchText),
          ])
          .tieBreaker(0.3)
      );
    }

    // Category filters
    if (filters.category !== undefined) {
      filterQueries.push(esb.termQuery('category', filters.category));
    }
    if (filters.categories?.length) {
      filterQueries.push(esb.termsQuery('category', filters.categories));
    }

    // Hierarchical category search (e.g., 'armor' matches all armor types)
    if (filters.categoryHierarchy) {
      filterQueries.push(esb.termQuery('categoryHierarchy', filters.categoryHierarchy));
    }

    // Planet filters
    if (filters.planet) {
      filterQueries.push(esb.termQuery('planet', filters.planet));
    }
    if (filters.planets?.length) {
      filterQueries.push(esb.termsQuery('planet', filters.planets));
    }

    // Price range (buy now price)
    if (filters.priceRange) {
      const priceQuery = esb.rangeQuery('buyNowPrice');
      if (filters.priceRange.min !== undefined) priceQuery.gte(filters.priceRange.min);
      if (filters.priceRange.max !== undefined) priceQuery.lte(filters.priceRange.max);
      filterQueries.push(priceQuery);
    }

    // Bid range (current bid)
    if (filters.bidRange) {
      const bidQuery = esb.rangeQuery('currentBid');
      if (filters.bidRange.min !== undefined) bidQuery.gte(filters.bidRange.min);
      if (filters.bidRange.max !== undefined) bidQuery.lte(filters.bidRange.max);
      filterQueries.push(bidQuery);
    }

    // Attribute filters
    if (filters.attributeFilters?.length) {
      for (const af of filters.attributeFilters) {
        const fieldName = `attributes.${af.name}`;

        if (af.exactValue !== undefined) {
          filterQueries.push(esb.termQuery(fieldName, af.exactValue));
        } else if (af.minValue !== undefined || af.maxValue !== undefined) {
          const rangeQuery = esb.rangeQuery(fieldName);
          if (af.minValue !== undefined) rangeQuery.gte(af.minValue);
          if (af.maxValue !== undefined) rangeQuery.lte(af.maxValue);
          filterQueries.push(rangeQuery);
        }
      }
    }

    // Owner filter
    if (filters.ownerId) {
      filterQueries.push(esb.termQuery('ownerId', filters.ownerId));
    }

    // Location filter
    if (filters.locationId) {
      filterQueries.push(esb.termQuery('locationId', filters.locationId));
    }

    // Build the bool query
    const boolQuery = esb.boolQuery().filter(filterQueries);
    if (mustQueries.length > 0) {
      boolQuery.must(mustQueries);
    }

    body.query(boolQuery);

    // Sorting
    if (filters.sortField) {
      body.sort(esb.sort(filters.sortField, filters.sortDirection ?? 'asc'));
    } else if (filters.searchText?.trim()) {
      // Sort by relevance when text search is used
      body.sorts([esb.sort('_score', 'desc'), esb.sort('auctionTimer', 'asc')]);
    } else {
      // Default: sort by auction end time (soonest first)
      body.sort(esb.sort('auctionTimer', 'asc'));
    }

    const response = await this.elastic.search<MarketListingDocument>({
      index: MARKET_INDEX_NAME,
      body: body.toJSON(),
    });

    const transformedResponse = transformElasticResponse(response);

    return {
      totalResults: transformedResponse.totalResults,
      results: transformedResponse.results,
    };
  }
}
