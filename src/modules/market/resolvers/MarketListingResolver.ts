import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { MarketListing } from '../types';

import { ServerObjectService } from '@core/services/ServerObjectService';
import { IServerObject } from '@core/types';

@Resolver(() => MarketListing)
@Service()
export class MarketListingResolver {
  constructor(private readonly objectService: ServerObjectService) {}

  @FieldResolver(() => IServerObject, { nullable: true })
  item(@Root() listing: MarketListing) {
    return this.objectService.getOne(listing.id);
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  owner(@Root() listing: MarketListing) {
    if (!listing.ownerId) return null;
    return this.objectService.getOne(listing.ownerId);
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  creator(@Root() listing: MarketListing) {
    if (!listing.creatorId) return null;
    return this.objectService.getOne(listing.creatorId);
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  location(@Root() listing: MarketListing) {
    return this.objectService.getOne(listing.locationId);
  }

  @FieldResolver(() => IServerObject, { nullable: true })
  bidder(@Root() listing: MarketListing) {
    if (!listing.bidderId) return null;
    return this.objectService.getOne(listing.bidderId);
  }
}
