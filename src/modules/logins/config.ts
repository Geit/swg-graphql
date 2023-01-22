export const VPN_API_KEY = process.env.VPN_API_KEY;
export const VPN_API_CACHE_TIME = parseInt(process.env.VPN_API_CACHE_TIME ?? '') ?? 1000 * 60 * 60 * 24;

export const ELASTIC_SEARCH_LOGIN_INDEX_NAME = process.env.ELASTIC_SEARCH_LOGIN_INDEX_NAME ?? 'login-logging-alias';
