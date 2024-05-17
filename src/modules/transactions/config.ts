/**
 * API key to use when doing self-queries of the GQL API via HTTP.
 */
export const TRANSACTIONS_GQL_API_KEY = process.env.TRANSACTIONS_GQL_API_KEY!;

export const ELASTIC_SEARCH_TRANSACTION_INDEX_NAME =
  process.env.ELASTIC_SEARCH_TRANSACTION_INDEX_NAME ?? 'transaction-logging-alias';
