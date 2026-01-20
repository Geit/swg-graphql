import { Field, ID, Int, ObjectType, Float, InputType } from 'type-graphql';

@ObjectType()
export class MarketListingAttribute {
  @Field()
  name: string;

  @Field()
  value: string;
}

@ObjectType()
export class MarketListing {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  itemName: string;

  @Field(() => String, { nullable: true })
  userDescription: string | null;

  @Field(() => Int, { nullable: true })
  minBid: number | null;

  @Field(() => Int, { nullable: true })
  buyNowPrice: number | null;

  @Field(() => Float, { nullable: true, description: 'Auction end timestamp (epoch)' })
  auctionTimer: number | null;

  @Field(() => Int)
  category: number;

  @Field(() => [String], { description: 'Category hierarchy for hierarchical filtering' })
  categoryHierarchy: string[];

  @Field(() => ID, { nullable: true })
  ownerId: string | null;

  @Field(() => ID, { nullable: true })
  creatorId: string | null;

  @Field(() => ID)
  locationId: string;

  @Field(() => String, { nullable: true })
  planet: string | null;

  @Field(() => String, { nullable: true })
  region: string | null;

  @Field(() => String, { nullable: true })
  locationName: string | null;

  @Field(() => String, { nullable: true })
  vendorName: string | null;

  @Field(() => Int, { nullable: true, description: 'Current highest bid amount' })
  currentBid: number | null;

  @Field(() => ID, { nullable: true, description: 'Current highest bidder' })
  bidderId: string | null;

  @Field(() => Int)
  itemSize: number;

  @Field(() => Int, { nullable: true })
  objectTemplateId: number | null;

  @Field(() => [MarketListingAttribute])
  attributes: MarketListingAttribute[];
}

@ObjectType()
export class MarketSearchResult {
  @Field(() => Int)
  totalResults: number;

  @Field(() => [MarketListing])
  results: MarketListing[];
}

@InputType()
export class MarketPriceRangeInput {
  @Field(() => Int, { nullable: true })
  min?: number;

  @Field(() => Int, { nullable: true })
  max?: number;
}

@InputType()
export class MarketAttributeFilterInput {
  @Field({ description: 'Normalized attribute name (e.g., obj_attr_n_efficiency)' })
  name: string;

  @Field(() => Int, { nullable: true })
  minValue?: number;

  @Field(() => Int, { nullable: true })
  maxValue?: number;

  @Field(() => String, { nullable: true })
  exactValue?: string;
}
