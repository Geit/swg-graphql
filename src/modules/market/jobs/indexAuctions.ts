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
}

/**
 * Indexes active market auctions to Elasticsearch and cleans up stale documents.
 * Uses bulk loading and cursor-based pagination for performance.
 */
export async function indexAuctions(): Promise<void> {
  console.log('Starting auction indexing');
  console.time('Total indexing time');

  const auctionService = Container.get(AuctionService);
  const locationService = Container.get(AuctionLocationService);

  // Bulk load locations and bids upfront (small datasets)
  // Attributes are too large (~7.5M rows) so we fetch per-batch
  const [locationsMap, bidsMap] = await Promise.all([locationService.loadAll(), auctionService.loadAllActiveBids()]);

  const batchSize = AUCTION_INDEX_BATCH_SIZE;
  let lastId: string | undefined;
  let hasMore = true;
  let totalIndexed = 0;

  const indexedIds = new Set<string>();

  while (hasMore) {
    const batchLabel = `Batch after ${lastId ?? 'start'}`;
    console.time(batchLabel);

    // Stage 1: Fetch auctions using cursor-based pagination
    console.time(`${batchLabel} - fetch auctions`);
    const auctions = await auctionService.getMany({
      limit: batchSize,
      afterId: lastId,
      activeOnly: true,
    });
    console.timeEnd(`${batchLabel} - fetch auctions`);

    if (auctions.length === 0) {
      hasMore = false;
      break;
    }

    // Stage 2: Fetch attributes for this batch via DataLoader
    console.time(`${batchLabel} - fetch attributes`);
    const attributesBatch = await Promise.all(auctions.map(auction => auctionService.getAttributesForItem(auction.id)));
    console.timeEnd(`${batchLabel} - fetch attributes`);

    // Stage 3: Build documents using pre-loaded maps + fetched attributes
    console.time(`${batchLabel} - build documents`);
    const docs = auctions.map((auction, i) => {
      const location = locationsMap.get(auction.locationId) ?? null;
      const attrs = attributesBatch[i];
      const bid = bidsMap.get(auction.id) ?? null;

      indexedIds.add(auction.id);
      return buildDocument(auction, location, attrs, bid);
    });
    console.timeEnd(`${batchLabel} - build documents`);

    // Stage 4: Save documents to Elasticsearch
    console.time(`${batchLabel} - save to ES`);
    await Promise.all(docs.map(doc => saveDocument(doc)));
    console.timeEnd(`${batchLabel} - save to ES`);

    console.timeEnd(batchLabel);
    totalIndexed += auctions.length;
    lastId = auctions[auctions.length - 1].id;
    // Continue if we got any results - only stop on empty batch
    hasMore = auctions.length > 0;
  }

  console.log(`Indexed ${totalIndexed} auctions`);
  console.timeEnd('Total indexing time');

  await cleanupStaleDocuments(indexedIds);
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
