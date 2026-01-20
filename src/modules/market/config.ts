/**
 * Elasticsearch index name for market listings.
 */
export const MARKET_INDEX_NAME = process.env.MARKET_INDEX_NAME ?? 'market_listings';

/**
 * Path to the compiled advanced_search_attribute datatable.
 */
export const ADVANCED_SEARCH_ATTRIBUTE_DATATABLE = 'commodity/advanced_search_attribute.iff';

/**
 * Batch size for indexing auctions.
 */
export const AUCTION_INDEX_BATCH_SIZE = parseInt(process.env.AUCTION_INDEX_BATCH_SIZE ?? '') || 500;

/**
 * Interval for incremental auction sync (in cron format).
 */
export const AUCTION_SYNC_INTERVAL = process.env.AUCTION_SYNC_INTERVAL ?? '*/3 * * * *';

/**
 * Interval for full auction re-index (in cron format).
 */
export const AUCTION_FULL_SYNC_INTERVAL = process.env.AUCTION_FULL_SYNC_INTERVAL ?? '0 3 * * *';
