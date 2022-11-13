/**
 * Connection string used to pass custom properties to the underlying connection.
 *
 * By default connections will be recycled after 5 minutes of inactivity.
 */
export const ORA_CONN_STRING = process.env.ORA_CONN_STRING ?? '(DESCRIPTION=(EXPIRE_TIME=5))';

/**
 * Host where the Oracle DB for SWG is.
 */
export const ORA_HOST = process.env.ORA_HOST ?? '127.0.0.1';

/**
 * Username for the Oracle DB with the SWG Game DB.
 */
export const ORA_USER = process.env.ORA_USER ?? 'swg';

/**
 * Password for the Oracle DB.
 */
export const ORA_PASS = process.env.ORA_PASS ?? 'swg';

/**
 * Database to use within Oracle.
 */
export const ORA_DATABASE = process.env.ORA_DATABASE ?? 'swg';

/**
 * Domain to use within Oracle.
 */
export const ORA_DOMAIN = process.env.ORA_DOMAIN ?? 'swg';

/**
 * The port to expose the GraphQL server on.
 */
export const PORT = parseInt(process.env.PORT ?? '4000');

/**
 * The text search features require a specific index to be set up within your database.
 * If these indexes are not available, you should disable (full) text search.
 */
export const ENABLE_TEXT_SEARCH = Boolean(process.env.ENABLE_TEXT_SEARCH);

/**
 * Whether to disable the authorisation layer.
 */
export const DISABLE_AUTH = process.env.DISABLE_AUTH === '1';

/**
 * Elastic HTTP host, used by the authorisation layer to validate incoming requests.
 */
export const ELASTIC_SEARCH_URL = process.env.ELASTIC_SEARCH_URL ?? 'http://localhost:9200/';
export const ELASTIC_SEARCH_AUTH =
  process.env.ELASTIC_SEARCH_AUTH ?? '{ "username": "elastic", "password": "changeme" }';

export const ELASTIC_SEARCH_INDEX_NAME = process.env.ELASTIC_SEARCH_INDEX_NAME ?? 'object_search_index';

/**
 * Required Elastic privilege the requesters must have in order to make queries.
 */
export const ELASTIC_REQUIRED_PRIVILEGE = process.env.ELASTIC_REQUIRED_PRIVILEGE ?? 'api:8.0.0:csrToolGraphQl';

/**
 * The index to check for privleges within.
 */
export const ELASTIC_KIBANA_INDEX = process.env.elasticKibanaIndex ?? '.kibana';

export const STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL = process.env.STATION_ID_TO_ACCOUNT_NAME_SERVICE_URL;
export const SEARCH_INDEXER_RECENT_LOGGED_IN_TIME =
  parseInt(process.env.SEARCH_INDEXER_RECENT_LOGGED_IN_TIME ?? '') || 60 * 11; // 11 minutes
export const SEARCH_INDEXER_INTERVAL = parseInt(process.env.SEARCH_INDEXER_INTERVAL ?? '') || 1000 * 60 * 10; // 10 minutes

/**
 * Frequency (in ms) at which to update swg-graphql's internal guild representation.
 */
export const GUILD_UPDATE_INTERVAL = parseInt(process.env.GUILD_UPDATE_INTERVAL ?? '') || 60 * 1000;

/**
 * Frequency (in ms) at which to update swg-graphql's internal city representation.
 */
export const CITY_UPDATE_INTERVAL = parseInt(process.env.CITY_UPDATE_INTERVAL ?? '') || 60 * 1000;

//#region Login Database Connection Details
/**
 * Whether to use a seperate DB connection for accessing login related tables
 */
export const ENABLE_SEPERATE_LOGIN_DB = Boolean(process.env.ENABLE_SEPERATE_LOGIN_DB) || false;

/**
 * Connection string used to pass custom properties to the underlying connection.
 *
 * By default connections will be recycled after 5 minutes of inactivity.
 */
export const ORA_LOGIN_CONN_STRING = process.env.ORA_LOGIN_CONN_STRING ?? '(DESCRIPTION=(EXPIRE_TIME=5))';

/**
 * Host where the Oracle DB for SWG's Login Tables are.
 */
export const ORA_LOGIN_HOST = process.env.ORA_LOGIN_HOST ?? '127.0.0.1';

/**
 * Username for the Oracle DB with the SWG's Login db.
 */
export const ORA_LOGIN_USER = process.env.ORA_LOGIN_USER ?? 'swg';

/**
 * Password for the Oracle DB for Login
 */
export const ORA_LOGIN_PASS = process.env.ORA_LOGIN_PASS ?? 'swg';

/**
 * Database to use within Oracle for Login.
 */
export const ORA_LOGIN_DATABASE = process.env.ORA_LOGIN_DATABASE ?? 'swg';

/**
 * Domain to use within Oracle for Login.
 */
export const ORA_LOGIN_DOMAIN = process.env.ORA_LOGIN_DOMAIN ?? 'swg';
//#endregion

export const ENABLE_STRUCTURE_SHORTCUT = Boolean(process.env.ENABLE_STRUCTURE_SHORTCUT) || false;
