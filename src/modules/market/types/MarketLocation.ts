import { Field, ID, Int, ObjectType, Float } from 'type-graphql';

import { IServerObject } from '@core/types';

@ObjectType({ description: 'A vendor or bazaar terminal location' })
export class MarketLocation {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true, description: 'Owner of this vendor/bazaar' })
  ownerId: string | null;

  @Field(() => IServerObject, { nullable: true, description: 'Owner object' })
  owner?: IServerObject;

  @Field(() => String, { nullable: true, description: 'Full location name (planet.region.vendorName)' })
  locationName: string | null;

  @Field(() => Float, { nullable: true, description: 'Sales tax percentage' })
  salesTax: number | null;

  @Field(() => ID, { nullable: true, description: 'Bank account receiving sales tax' })
  salesTaxBankId: string | null;

  @Field(() => Float, { description: 'Timestamp when vendor became empty' })
  emptyDate: number;

  @Field(() => Float, { description: 'Timestamp of last access' })
  lastAccessDate: number;

  @Field(() => Float, { description: 'Timestamp when vendor became inactive' })
  inactiveDate: number;

  @Field(() => Int, { description: 'Vendor status code' })
  status: number;

  @Field(() => Boolean, { description: 'Whether this location appears in bazaar searches' })
  searchEnabled: boolean;

  @Field(() => Int, { description: 'Entrance charge for the vendor' })
  entranceCharge: number;

  @Field(() => String, { nullable: true, description: 'Planet extracted from locationName' })
  planet: string | null;

  @Field(() => String, { nullable: true, description: 'Region extracted from locationName' })
  region: string | null;

  @Field(() => String, { nullable: true, description: 'Vendor name extracted from locationName' })
  vendorName: string | null;
}

@ObjectType()
export class MarketLocationSearchResult {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [MarketLocation])
  results: MarketLocation[];
}
