import { Container } from 'typedi';

import { AUCTION_INDEX_BATCH_SIZE, MARKET_INDEX_NAME } from '../config';
import { AuctionService, Auction, AuctionAttribute, AuctionBid } from '../services/AuctionService';
import { AuctionLocationService, AuctionLocation } from '../services/AuctionLocationService';
import { MarketListingDocument } from '../types';
import { buildCategoryHierarchy } from '../utils/gameObjectType';
import { normalizeAttributeName } from '../utils/parseAdvancedSearchAttribute';
import { saveDocument } from '../utils/saveDocuments';

import { elasticClient } from '@core/utils/elasticClient';

export interface IndexAuctionsJob {
  jobName: 'indexAuctions';
  full: boolean;
}

/**
 * Indexes active market auctions to Elasticsearch.
 * @param fullIndex - If true, performs a full re-index and cleans up stale documents.
 */
export async function indexAuctions(fullIndex: boolean): Promise<void> {
  console.log(`Starting ${fullIndex ? 'full' : 'incremental'} auction indexing`);

  const auctionService = Container.get(AuctionService);
  const locationService = Container.get(AuctionLocationService);

  const batchSize = AUCTION_INDEX_BATCH_SIZE;
  let offset = 0;
  let hasMore = true;
  let totalIndexed = 0;

  // Track indexed IDs for cleanup during full index
  const indexedIds = new Set<string>();

  while (hasMore) {
    console.time(`Indexing batch at offset ${offset}`);

    // Fetch auctions
    const auctions = await auctionService.getMany({
      limit: batchSize,
      offset,
      activeOnly: true,
    });

    if (auctions.length === 0) {
      hasMore = false;
      break;
    }

    // Build and save documents - DataLoaders will batch the lookups
    const savePromises = auctions.map(async auction => {
      const [location, attrs, bid] = await Promise.all([
        locationService.getOne(auction.locationId),
        auctionService.getAttributesForItem(auction.id),
        auctionService.getBidForItem(auction.id),
      ]);

      const doc = buildDocument(auction, location, attrs, bid);
      indexedIds.add(auction.id);

      return saveDocument(doc);
    });

    await Promise.all(savePromises);

    console.timeEnd(`Indexing batch at offset ${offset}`);
    totalIndexed += auctions.length;
    offset += batchSize;
    hasMore = auctions.length === batchSize;
  }

  console.log(`Indexed ${totalIndexed} auctions`);

  // Clean up stale documents during full index
  if (fullIndex) {
    await cleanupStaleDocuments(indexedIds);
  }
}

/**
 * Builds a MarketListingDocument from auction data.
 */
function buildDocument(
  auction: Auction,
  location: AuctionLocation | null,
  attributes: AuctionAttribute[],
  bid: AuctionBid | null
): MarketListingDocument {
  // Flatten attributes
  const flattenedAttrs: Record<string, string | number> = {};
  for (const attr of attributes) {
    const normalizedName = normalizeAttributeName(attr.attributeName);
    if (attr.attributeValue !== null) {
      // Try to parse as number if possible
      const numValue = parseFloat(attr.attributeValue);
      flattenedAttrs[normalizedName] = isNaN(numValue) ? attr.attributeValue : numValue;
    }
  }

  // Build category hierarchy from the category (game object type)
  const categoryHierarchy = auction.category !== null ? buildCategoryHierarchy(auction.category) : [];

  const now = new Date().toISOString();

  return {
    type: 'MarketListing',
    id: auction.id,
    locationId: auction.locationId,
    creatorId: auction.creatorId,
    ownerId: auction.ownerId,
    minBid: auction.minBid,
    buyNowPrice: auction.buyNowPrice,
    auctionTimer: auction.auctionTimer,
    userDescription: auction.userDescription,
    itemName: auction.itemName ?? '',
    oob: auction.oob,
    category: auction.category ?? 0,
    categoryHierarchy,
    itemTimer: auction.itemTimer,
    active: auction.active ?? 0,
    itemSize: auction.itemSize,
    objectTemplateId: auction.objectTemplateId,

    // Location fields
    locationName: location?.locationName ?? null,
    salesTax: location?.salesTax ?? null,
    searchEnabled: location?.searchEnabled ?? false,
    planet: location?.planet ?? null,
    region: location?.region ?? null,
    vendorName: location?.vendorName ?? null,

    // Bid fields
    currentBid: bid?.bid ?? null,
    bidderId: bid?.bidderId ?? null,
    maxProxyBid: bid?.maxProxyBid ?? null,

    attributes: flattenedAttrs,

    lastSeen: now,
    indexedAt: now,
  };
}

/**
 * Removes documents from ES that are no longer active in the database.
 */
async function cleanupStaleDocuments(activeIds: Set<string>): Promise<void> {
  console.log('Starting cleanup of stale market listing documents');

  try {
    // Delete documents that aren't in the active set
    // Use delete by query to remove documents with IDs not in our set
    const result = await elasticClient.deleteByQuery({
      index: MARKET_INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [{ term: { type: 'MarketListing' } }],
            // eslint-disable-next-line camelcase
            must_not: [{ ids: { values: [...activeIds].map(id => `MarketListing:${id}`) } }],
          },
        },
      },
    });

    console.log(`Cleaned up ${result.deleted ?? 0} stale documents`);
  } catch (err) {
    console.error('Error cleaning up stale documents:', err);
  }
}
