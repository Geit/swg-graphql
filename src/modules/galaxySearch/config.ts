/**
 * API key to use when doing self-queries of the GQL API via HTTP.
 */
export const GALAXY_SEARCH_GQL_API_KEY = process.env.GALAXY_SEARCH_GQL_API_KEY!;

export const SEARCH_INDEXER_RECENT_LOGGED_IN_TIME =
  parseInt(process.env.SEARCH_INDEXER_RECENT_LOGGED_IN_TIME ?? '') || 60 * 11; // 11 minutes

export const SEARCH_INDEXER_INTERVAL = parseInt(process.env.SEARCH_INDEXER_INTERVAL ?? '') || 1000 * 60 * 10; // 10 minutes

export const GALAXY_SEARCH_INDEX_NAME = process.env.GALAXY_SEARCH_INDEX_NAME ?? 'object_search_index';

export const STALE_DOCUMENT_THRESHOLD_DAYS = parseInt(process.env.STALE_DOCUMENT_THRESHOLD_DAYS ?? '') || 180;
