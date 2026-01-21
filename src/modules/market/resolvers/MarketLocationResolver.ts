import { Arg, Authorized, FieldResolver, Int, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { MarketLocation, MarketLocationSearchResult } from '../types';
import { AuctionLocation, AuctionLocationService } from '../services/AuctionLocationService';

import { ServerObjectService } from '@core/services/ServerObjectService';
import { IServerObject } from '@core/types';

@Service()
@Resolver(() => MarketLocation)
export class MarketLocationResolver {
  constructor(
    private readonly locationService: AuctionLocationService,
    private readonly objectService: ServerObjectService
  ) {}

  @Query(() => MarketLocation, { nullable: true, description: 'Get a market location by ID' })
  @Authorized()
  async marketLocation(@Arg('id', () => String) id: string): Promise<MarketLocation | null> {
    const location = await this.locationService.getOne(id);
    if (!location) return null;
    return this.toMarketLocation(location);
  }

  @Query(() => MarketLocationSearchResult, { description: 'Search for market locations' })
  @Authorized()
  async marketLocations(
    @Arg('planet', { nullable: true, description: 'Filter by planet name' }) planet?: string,
    @Arg('region', { nullable: true, description: 'Filter by region name' }) region?: string,
    @Arg('searchText', { nullable: true, description: 'Search vendor names' }) searchText?: string,
    @Arg('searchEnabled', { nullable: true, description: 'Filter by search visibility' }) searchEnabled?: boolean,
    @Arg('ownerId', { nullable: true, description: 'Filter by owner ID' }) ownerId?: string,
    @Arg('from', () => Int, { defaultValue: 0 }) from?: number,
    @Arg('size', () => Int, { defaultValue: 50 }) size?: number
  ): Promise<MarketLocationSearchResult> {
    const allLocations = await this.locationService.loadAll();
    let results = Array.from(allLocations.values());

    // Apply filters
    if (planet) {
      const planetLower = planet.toLowerCase();
      results = results.filter(loc => loc.planet?.toLowerCase() === planetLower);
    }

    if (region) {
      const regionLower = region.toLowerCase();
      results = results.filter(loc => loc.region?.toLowerCase() === regionLower);
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      results = results.filter(
        loc =>
          loc.vendorName?.toLowerCase().includes(searchLower) || loc.locationName?.toLowerCase().includes(searchLower)
      );
    }

    if (searchEnabled !== undefined) {
      results = results.filter(loc => loc.searchEnabled === searchEnabled);
    }

    if (ownerId) {
      results = results.filter(loc => loc.ownerId === ownerId);
    }

    const totalResults = results.length;

    // Apply pagination
    const paginatedResults = results.slice(from ?? 0, (from ?? 0) + (size ?? 50));

    return {
      totalResults,
      results: paginatedResults.map(loc => this.toMarketLocation(loc)),
    };
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  owner(@Root() location: MarketLocation) {
    if (!location.ownerId) return null;
    return this.objectService.getOne(location.ownerId);
  }

  private toMarketLocation(location: AuctionLocation): MarketLocation {
    return {
      id: location.id,
      ownerId: location.ownerId,
      locationName: location.locationName,
      salesTax: location.salesTax,
      salesTaxBankId: location.salesTaxBankId,
      emptyDate: location.emptyDate,
      lastAccessDate: location.lastAccessDate,
      inactiveDate: location.inactiveDate,
      status: location.status,
      searchEnabled: location.searchEnabled,
      entranceCharge: location.entranceCharge,
      planet: location.planet,
      region: location.region,
      vendorName: location.vendorName,
    };
  }
}
