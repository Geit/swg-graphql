import DataLoader from 'dataloader';
import { Service } from 'typedi';

import knexDb from '@core/services/db';

/**
 * Raw record from MARKET_AUCTIONS table.
 */
interface MarketAuctionRecord {
  ITEM_ID: number;
  LOCATION_ID: number;
  CREATOR_ID: number | null;
  OWNER_ID: number | null;
  MIN_BID: number | null;
  BUY_NOW_PRICE: number | null;
  AUCTION_TIMER: number | null;
  USER_DESCRIPTION: string | null;
  ITEM_NAME: string | null;
  OOB: string | null;
  CATEGORY: number | null;
  ITEM_TIMER: number | null;
  ACTIVE: number | null;
  ITEM_SIZE: number;
  OBJECT_TEMPLATE_ID: number | null;
}

/**
 * Raw record from MARKET_AUCTION_ATTRIBUTES table.
 */
interface MarketAuctionAttributeRecord {
  ITEM_ID: number;
  ATTRIBUTE_NAME: string;
  ATTRIBUTE_VALUE: string | null;
}

/**
 * Raw record from MARKET_AUCTION_BIDS table.
 */
interface MarketAuctionBidRecord {
  ITEM_ID: number;
  BIDDER_ID: number | null;
  BID: number | null;
  MAX_PROXY_BID: number | null;
}

/**
 * Transformed auction data.
 */
export interface Auction {
  id: string;
  locationId: string;
  creatorId: string | null;
  ownerId: string | null;
  minBid: number | null;
  buyNowPrice: number | null;
  auctionTimer: number | null;
  userDescription: string | null;
  itemName: string | null;
  oob: string | null;
  category: number | null;
  itemTimer: number | null;
  active: number | null;
  itemSize: number;
  objectTemplateId: number | null;
}

/**
 * Transformed auction attribute.
 */
export interface AuctionAttribute {
  itemId: string;
  attributeName: string;
  attributeValue: string | null;
}

/**
 * Transformed auction bid.
 */
export interface AuctionBid {
  itemId: string;
  bidderId: string | null;
  bid: number | null;
  maxProxyBid: number | null;
}

export interface GetManyFilters {
  limit: number;
  offset?: number;
  afterId?: string;
  sortOrder?: 'asc' | 'desc';
  activeOnly?: boolean;
  locationId?: string;
  category?: number;
}

@Service()
export class AuctionService {
  private db = knexDb;

  private prepareQuery(filters: Partial<GetManyFilters>) {
    let query = this.db
      .select()
      .from<MarketAuctionRecord>('MARKET_AUCTIONS')
      .orderBy('ITEM_ID', filters.sortOrder ?? 'desc');

    if (filters.activeOnly) {
      query = query.where('ACTIVE', 1);
    }
    if (filters.locationId) {
      query = query.where('LOCATION_ID', filters.locationId);
    }
    if (filters.category) {
      query = query.where('CATEGORY', filters.category);
    }
    if (filters.afterId) {
      query = query.where('ITEM_ID', '>', filters.afterId);
    }

    return query;
  }

  async getMany(filters: Partial<GetManyFilters>): Promise<Auction[]> {
    const query = this.prepareQuery(filters);

    if (filters.afterId !== undefined) {
      query.limit(filters.limit ?? 1000);
    } else {
      query.limit(filters.limit ?? 1000).offset(filters.offset ?? 0);
    }

    const records = await query;
    return records.map(AuctionService.convertRecord);
  }

  async countMany(filters: Partial<GetManyFilters>): Promise<number> {
    const query = this.prepareQuery(filters);
    const result = await query.count('ITEM_ID as count');
    return Number((result[0] as unknown as { count: string | number }).count);
  }

  async countActive(): Promise<number> {
    const result = await this.db
      .from<MarketAuctionRecord>('MARKET_AUCTIONS')
      .where('ACTIVE', 1)
      .count('ITEM_ID as count');
    return Number((result[0] as unknown as { count: string | number }).count);
  }

  // DataLoader for single auction lookups
  private auctionLoader = new DataLoader(
    async (keys: readonly string[]): Promise<(Auction | null)[]> => {
      const results = await knexDb
        .select()
        .from<MarketAuctionRecord>('MARKET_AUCTIONS')
        .whereIn('ITEM_ID', [...keys]);

      return keys.map(key => {
        const found = results.find(r => String(r.ITEM_ID) === key);
        return found ? AuctionService.convertRecord(found) : null;
      });
    },
    { cache: false, maxBatchSize: 999 }
  );

  getOne = this.auctionLoader.load.bind(this.auctionLoader);

  // DataLoader for attributes by item ID
  private attributesLoader = new DataLoader(
    async (keys: readonly string[]): Promise<AuctionAttribute[][]> => {
      const records = await this.db
        .select()
        .from<MarketAuctionAttributeRecord>('MARKET_AUCTION_ATTRIBUTES')
        .whereIn('ITEM_ID', [...keys]);

      const map = new Map<string, AuctionAttribute[]>();
      for (const record of records) {
        const itemId = String(record.ITEM_ID);
        if (!map.has(itemId)) {
          map.set(itemId, []);
        }
        map.get(itemId)!.push({
          itemId,
          attributeName: record.ATTRIBUTE_NAME,
          attributeValue: record.ATTRIBUTE_VALUE,
        });
      }

      return keys.map(key => map.get(key) ?? []);
    },
    { cache: false, maxBatchSize: 999 }
  );

  getAttributesForItem = this.attributesLoader.load.bind(this.attributesLoader);

  // DataLoader for bids by item ID
  private bidsLoader = new DataLoader(
    async (keys: readonly string[]): Promise<(AuctionBid | null)[]> => {
      const records = await this.db
        .select()
        .from<MarketAuctionBidRecord>('MARKET_AUCTION_BIDS')
        .whereIn('ITEM_ID', [...keys]);

      const map = new Map<string, AuctionBid>();
      for (const record of records) {
        const itemId = String(record.ITEM_ID);
        map.set(itemId, {
          itemId,
          bidderId: record.BIDDER_ID ? String(record.BIDDER_ID) : null,
          bid: record.BID,
          maxProxyBid: record.MAX_PROXY_BID,
        });
      }

      return keys.map(key => map.get(key) ?? null);
    },
    { cache: false, maxBatchSize: 999 }
  );

  getBidForItem = this.bidsLoader.load.bind(this.bidsLoader);

  /**
   * Bulk loads all attributes for active auctions into a Map.
   * Much faster than per-item lookups for full index.
   */
  async loadAllActiveAttributes(): Promise<Map<string, AuctionAttribute[]>> {
    console.time('Loading all auction attributes');
    const records = await this.db
      .select('a.*')
      .from<MarketAuctionAttributeRecord>('MARKET_AUCTION_ATTRIBUTES as a')
      .join('MARKET_AUCTIONS as m', 'a.ITEM_ID', 'm.ITEM_ID')
      .where('m.ACTIVE', 1);

    const map = new Map<string, AuctionAttribute[]>();
    for (const record of records) {
      const itemId = String(record.ITEM_ID);
      if (!map.has(itemId)) {
        map.set(itemId, []);
      }
      map.get(itemId)!.push({
        itemId,
        attributeName: record.ATTRIBUTE_NAME,
        attributeValue: record.ATTRIBUTE_VALUE,
      });
    }
    console.timeEnd('Loading all auction attributes');
    console.log(`Loaded ${records.length} attributes for ${map.size} items`);
    return map;
  }

  /**
   * Bulk loads all bids for active auctions into a Map.
   */
  async loadAllActiveBids(): Promise<Map<string, AuctionBid>> {
    console.time('Loading all auction bids');
    const records = await this.db
      .select('b.*')
      .from<MarketAuctionBidRecord>('MARKET_AUCTION_BIDS as b')
      .join('MARKET_AUCTIONS as m', 'b.ITEM_ID', 'm.ITEM_ID')
      .where('m.ACTIVE', 1);

    const map = new Map<string, AuctionBid>();
    for (const record of records) {
      const itemId = String(record.ITEM_ID);
      map.set(itemId, {
        itemId,
        bidderId: record.BIDDER_ID ? String(record.BIDDER_ID) : null,
        bid: record.BID,
        maxProxyBid: record.MAX_PROXY_BID,
      });
    }
    console.timeEnd('Loading all auction bids');
    console.log(`Loaded ${map.size} bids`);
    return map;
  }

  private static convertRecord(record: MarketAuctionRecord): Auction {
    return {
      id: String(record.ITEM_ID),
      locationId: String(record.LOCATION_ID),
      creatorId: record.CREATOR_ID ? String(record.CREATOR_ID) : null,
      ownerId: record.OWNER_ID ? String(record.OWNER_ID) : null,
      minBid: record.MIN_BID,
      buyNowPrice: record.BUY_NOW_PRICE,
      auctionTimer: record.AUCTION_TIMER,
      userDescription: record.USER_DESCRIPTION,
      itemName: record.ITEM_NAME,
      oob: record.OOB,
      category: record.CATEGORY,
      itemTimer: record.ITEM_TIMER,
      active: record.ACTIVE,
      itemSize: record.ITEM_SIZE,
      objectTemplateId: record.OBJECT_TEMPLATE_ID,
    };
  }
}
