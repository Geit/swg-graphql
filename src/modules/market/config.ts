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
 * Higher values reduce Oracle round-trips but increase memory usage.
 */
export const AUCTION_INDEX_BATCH_SIZE = parseInt(process.env.AUCTION_INDEX_BATCH_SIZE ?? '') || 2000;

/**
 * Interval for auction sync (in cron format).
 */
export const AUCTION_SYNC_INTERVAL = process.env.AUCTION_SYNC_INTERVAL ?? '0 * * * *';
