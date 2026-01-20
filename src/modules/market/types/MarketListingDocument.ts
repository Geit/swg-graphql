/**
 * Elasticsearch document type for market listings.
 */
export interface MarketListingDocument {
  type: 'MarketListing';

  /** ITEM_ID from MARKET_AUCTIONS */
  id: string;

  /** LOCATION_ID - reference to AUCTION_LOCATIONS */
  locationId: string;

  /** CREATOR_ID - original item creator */
  creatorId: string | null;

  /** OWNER_ID - current seller */
  ownerId: string | null;

  /** MIN_BID - minimum bid for auctions */
  minBid: number | null;

  /** BUY_NOW_PRICE - instant purchase price */
  buyNowPrice: number | null;

  /** AUCTION_TIMER - auction end timestamp */
  auctionTimer: number | null;

  /** USER_DESCRIPTION - seller's description */
  userDescription: string | null;

  /** ITEM_NAME - display name */
  itemName: string;

  /** OOB - out-of-band data (attributes display) */
  oob: string | null;

  /** CATEGORY - game object type ID */
  category: number;

  /**
   * Category hierarchy for hierarchical search.
   * E.g., ['armor', 'armor_body'] for armor_body items.
   */
  categoryHierarchy: string[];

  /** ITEM_TIMER - item expiration timestamp */
  itemTimer: number | null;

  /** ACTIVE - whether listing is active */
  active: number;

  /** ITEM_SIZE - size/volume of item */
  itemSize: number;

  /** OBJECT_TEMPLATE_ID - item's template ID */
  objectTemplateId: number | null;

  // Denormalized location fields from AUCTION_LOCATIONS

  /** Full location name (planet.region.vendorName) */
  locationName: string | null;

  /** Sales tax percentage */
  salesTax: number | null;

  /** Whether location appears in bazaar searches */
  searchEnabled: boolean;

  /** Planet extracted from locationName */
  planet: string | null;

  /** Region extracted from locationName */
  region: string | null;

  /** Vendor name extracted from locationName */
  vendorName: string | null;

  // Bid information from MARKET_AUCTION_BIDS

  /** Current highest bid amount */
  currentBid: number | null;

  /** Current highest bidder's character ID */
  bidderId: string | null;

  /** Maximum auto-bid amount */
  maxProxyBid: number | null;

  /**
   * Flattened attributes from MARKET_AUCTION_ATTRIBUTES.
   * Keys are normalized attribute names (e.g., 'obj_attr_n_efficiency').
   */
  attributes: Record<string, string | number>;

  /** ISO timestamp when last seen/updated */
  lastSeen: string;

  /** ISO timestamp when indexed to ES */
  indexedAt: string;
}
