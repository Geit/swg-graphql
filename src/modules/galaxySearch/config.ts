/**
 * API key to use when doing self-queries of the GQL API via HTTP.
 */
export const GALAXY_SEARCH_GQL_API_KEY = process.env.GALAXY_SEARCH_GQL_API_KEY!;

export const SEARCH_INDEXER_RECENT_LOGGED_IN_TIME =
  parseInt(process.env.SEARCH_INDEXER_RECENT_LOGGED_IN_TIME ?? '') || 60 * 11; // 11 minutes

export const SEARCH_INDEXER_INTERVAL = parseInt(process.env.SEARCH_INDEXER_INTERVAL ?? '') || 1000 * 60 * 10; // 10 minutes
